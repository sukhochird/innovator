from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsCompanyAdminOrSuperAdmin
from apps.accounts.models import User
from apps.devices.models import Device
from apps.devices.services import assign_device_to_vehicle
from apps.telemetry.models import VehicleTelemetry
from apps.diagnostics.models import DTCCode
from apps.alerts.models import VehicleAlert
from apps.vehicles.models import Vehicle
from apps.vehicles.serializers import (
    AlertSerializer,
    DTCSerializer,
    TelemetryRawLogSerializer,
    TelemetrySerializer,
    VehicleAssignDeviceSerializer,
    VehicleAssignDriverSerializer,
    VehicleSerializer,
)
from apps.vehicles.services import (
    assign_driver_to_vehicle,
    get_vehicle_queryset_for_user,
    user_can_access_vehicle,
)


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    filterset_fields = ["status", "company", "driver", "fuel_type"]
    search_fields = ["plate_number", "vin", "make", "model", "nickname"]
    ordering_fields = ["plate_number", "status", "created_at"]

    def get_queryset(self):
        return get_vehicle_queryset_for_user(self.request.user)

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "assign_device", "assign_driver"):
            return [IsCompanyAdminOrSuperAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        company = serializer.validated_data.get("company")
        if user.role == UserRole.COMPANY_ADMIN:
            serializer.save(company=user.company)
        else:
            serializer.save(company=company)

    @action(detail=True, methods=["post"], url_path="assign-device")
    def assign_device(self, request, pk=None):
        vehicle = self.get_object()
        serializer = VehicleAssignDeviceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = Device.objects.get(pk=serializer.validated_data["device_id"])
        assign_device_to_vehicle(device, vehicle, request.user)
        vehicle.refresh_from_db()
        return Response(VehicleSerializer(vehicle).data)

    @action(detail=True, methods=["post"], url_path="assign-driver")
    def assign_driver(self, request, pk=None):
        vehicle = self.get_object()
        serializer = VehicleAssignDriverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = User.objects.get(pk=serializer.validated_data["driver_id"])
        assign_driver_to_vehicle(vehicle, driver, request.user)
        vehicle.refresh_from_db()
        return Response(VehicleSerializer(vehicle).data)

    @action(detail=True, methods=["get"])
    def telemetry(self, request, pk=None):
        vehicle = self.get_object()
        qs = VehicleTelemetry.objects.filter(vehicle=vehicle).order_by("-timestamp")
        page = self.paginate_queryset(qs)
        serializer = TelemetrySerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="raw-logs")
    def raw_logs(self, request, pk=None):
        vehicle = self.get_object()
        qs = (
            VehicleTelemetry.objects.filter(vehicle=vehicle)
            .select_related("device")
            .order_by("-timestamp")
        )
        page = self.paginate_queryset(qs)
        serializer = TelemetryRawLogSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def dtc(self, request, pk=None):
        vehicle = self.get_object()
        qs = DTCCode.objects.filter(vehicle=vehicle, is_active=True)
        return Response(DTCSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def alerts(self, request, pk=None):
        vehicle = self.get_object()
        qs = VehicleAlert.objects.filter(vehicle=vehicle, resolved_at__isnull=True)
        return Response(AlertSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def location(self, request, pk=None):
        from apps.telemetry.services.redis_state import RedisVehicleState

        vehicle = self.get_object()
        state = RedisVehicleState.get_current(vehicle.id)
        if state:
            return Response(
                {
                    "latitude": state.get("latitude"),
                    "longitude": state.get("longitude"),
                    "heading": state.get("heading"),
                    "speed": state.get("speed"),
                    "timestamp": state.get("timestamp"),
                }
            )
        latest = VehicleTelemetry.objects.filter(vehicle=vehicle).order_by("-timestamp").first()
        if latest:
            return Response(
                {
                    "latitude": latest.latitude,
                    "longitude": latest.longitude,
                    "heading": latest.heading,
                    "speed": latest.speed,
                    "timestamp": latest.timestamp,
                }
            )
        return Response({"detail": "No location data."}, status=404)

    @action(detail=True, methods=["get"])
    def trips(self, request, pk=None):
        return Response([])
