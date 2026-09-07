import json
import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from apps.accounts.models import UserRole
from apps.vehicles.services import user_can_access_vehicle

logger = logging.getLogger(__name__)


class BaseRealtimeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close()
            return
        await self.accept()

    async def realtime_message(self, event):
        await self.send(text_data=json.dumps({"type": event["event"], **event["payload"]}))


class VehicleConsumer(BaseRealtimeConsumer):
    async def connect(self):
        self.vehicle_id = self.scope["url_route"]["kwargs"]["vehicle_id"]
        self.group_name = f"vehicle_{self.vehicle_id}"

        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close()
            return

        allowed = await self._can_access(user, int(self.vehicle_id))
        if not allowed:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def _can_access(self, user, vehicle_id):
        from apps.vehicles.models import Vehicle

        try:
            vehicle = Vehicle.objects.get(pk=vehicle_id)
        except Vehicle.DoesNotExist:
            return False
        return user_can_access_vehicle(user, vehicle)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)


class FleetConsumer(BaseRealtimeConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close()
            return
        if user.role not in (UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN):
            await self.close()
            return
        if user.role == UserRole.COMPANY_ADMIN and not user.company_id:
            await self.close()
            return

        company_id = user.company_id if user.role == UserRole.COMPANY_ADMIN else "all"
        self.group_name = f"company_{company_id}_fleet" if company_id != "all" else None

        if user.role == UserRole.COMPANY_ADMIN:
            self.group_name = f"company_{user.company_id}_fleet"
            await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)


class DriverVehicleConsumer(BaseRealtimeConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close()
            return
        if user.role != UserRole.DRIVER:
            await self.close()
            return

        vehicle_id = await self._get_assigned_vehicle_id(user)
        if not vehicle_id:
            await self.close()
            return

        self.group_name = f"vehicle_{vehicle_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def _get_assigned_vehicle_id(self, user):
        from apps.vehicles.models import Vehicle

        vehicle = Vehicle.objects.filter(driver=user).first()
        return vehicle.id if vehicle else None

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)


class DeviceTelemetryConsumer(AsyncWebsocketConsumer):
    """Device socket endpoint for telemetry ingestion."""

    async def connect(self):
        await self.accept()
        self.serial_number = None

    async def disconnect(self, close_code):
        if self.serial_number:
            from apps.telemetry.services.redis_state import RedisVehicleState

            await database_sync_to_async(RedisVehicleState.set_device_online)(
                self.serial_number, False
            )

    async def receive(self, text_data=None, bytes_data=None):
        try:
            if text_data:
                payload = json.loads(text_data)
            else:
                payload = json.loads(bytes_data.decode("utf-8"))

            serial = payload.get("serial_number") or payload.get("device_id")
            if serial:
                self.serial_number = str(serial)

            await self._ingest(payload)
            await self.send(text_data=json.dumps({"status": "ok"}))
        except Exception as exc:
            logger.exception("Device telemetry error")
            await self.send(text_data=json.dumps({"status": "error", "message": str(exc)}))

    @database_sync_to_async
    def _ingest(self, payload):
        from apps.telemetry.services.ingestion import TelemetryIngestionService

        client = self.scope.get("client")
        client_ip = client[0] if client else None
        TelemetryIngestionService().ingest(payload, client_ip=client_ip)
