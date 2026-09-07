from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

from apps.alerts.models import AlertSeverity, AlertType, VehicleAlert
from apps.devices.models import Device, DeviceStatus
from apps.diagnostics.models import DTCCode, DTCSeverity
from apps.telemetry.models import VehicleTelemetry
from apps.telemetry.parsers.base import NormalizedTelemetry, get_parser
from apps.telemetry.services.redis_state import RedisVehicleState
from apps.vehicles.models import Vehicle, VehicleStatus

DTC_DESCRIPTIONS = {
    "P0300": "Random/Multiple Cylinder Misfire Detected",
    "P0171": "System Too Lean (Bank 1)",
    "P0420": "Catalyst System Efficiency Below Threshold",
    "P0115": "Engine Coolant Temperature Sensor Circuit",
    "P0128": "Coolant Thermostat Below Regulating Temperature",
}


class TelemetryIngestionService:
    def __init__(self, protocol: str = "CARQ_DEVICE_V1"):
        self.parser = get_parser(protocol)

    def _resolve_device(self, data: NormalizedTelemetry) -> Device:
        terminal_phone = (data.raw_payload.get("terminal_phone") or data.serial_number).zfill(12)
        qs = Device.objects.select_related("vehicle", "vehicle__company")
        device = qs.filter(terminal_phone=terminal_phone).first()
        if device:
            return device
        return qs.get(serial_number=data.serial_number)

    def ingest_raw(self, raw: bytes, client_ip: str | None = None) -> VehicleTelemetry | None:
        """Ingest JT808 binary packet."""
        service = TelemetryIngestionService(protocol="JT808")
        data = service.parser.parse(raw)
        service.parser.validate(data)
        data = service.parser.normalize(data)
        return self._persist(data, client_ip)

    def ingest(self, payload, client_ip: str | None = None) -> VehicleTelemetry | None:
        if isinstance(payload, (bytes, bytearray)):
            return self.ingest_raw(bytes(payload), client_ip)
        data = self.parser.parse(payload)
        self.parser.validate(data)
        data = self.parser.normalize(data)
        return self._persist(data, client_ip)

    def _persist(self, data: NormalizedTelemetry, client_ip: str | None = None) -> VehicleTelemetry | None:
        try:
            device = self._resolve_device(data)
        except Device.DoesNotExist:
            return None

        if device.status == DeviceStatus.BLOCKED:
            return None

        vehicle = device.vehicle
        if not vehicle:
            return None

        now = timezone.now()
        device.last_seen_at = now
        device.last_ip = client_ip
        device.save(update_fields=["last_seen_at", "last_ip", "updated_at"])

        telemetry = VehicleTelemetry.objects.create(
            vehicle=vehicle,
            device=device,
            timestamp=data.timestamp or now,
            latitude=data.latitude,
            longitude=data.longitude,
            speed=data.speed,
            heading=data.heading,
            rpm=data.rpm,
            coolant_temperature=data.coolant_temperature,
            engine_load=data.engine_load,
            throttle_position=data.throttle_position,
            battery_voltage=data.battery_voltage,
            fuel_level=data.fuel_level,
            intake_air_temperature=data.intake_air_temperature,
            engine_runtime=data.engine_runtime,
            odometer=data.odometer,
            ignition=data.ignition,
            raw_payload=data.raw_payload,
        )

        status = self._compute_status(data, vehicle)
        vehicle.status = status
        vehicle.save(update_fields=["status", "updated_at"])

        current_state = {
            "vehicle_id": vehicle.id,
            "timestamp": telemetry.timestamp.isoformat(),
            "latitude": float(data.latitude) if data.latitude is not None else None,
            "longitude": float(data.longitude) if data.longitude is not None else None,
            "speed": data.speed,
            "heading": data.heading,
            "rpm": data.rpm,
            "coolant_temperature": data.coolant_temperature,
            "engine_load": data.engine_load,
            "throttle_position": data.throttle_position,
            "battery_voltage": data.battery_voltage,
            "fuel_level": data.fuel_level,
            "intake_air_temperature": data.intake_air_temperature,
            "engine_runtime": data.engine_runtime,
            "odometer": data.odometer,
            "ignition": data.ignition,
            "status": status,
            "is_online": True,
            "device_serial": device.serial_number,
        }
        RedisVehicleState.set_current(vehicle.id, current_state)
        RedisVehicleState.set_device_online(device.serial_number, True)

        self._process_dtc(device, vehicle, data)
        self._check_alerts(vehicle, data)
        self._check_geofences(vehicle, data)
        self._broadcast_telemetry(vehicle.id, current_state)
        return telemetry

    def _compute_status(self, data: NormalizedTelemetry, vehicle: Vehicle) -> str:
        if data.ignition is False and (data.speed or 0) < 1:
            return VehicleStatus.STOPPED
        speed = data.speed or 0
        if speed > 5:
            return VehicleStatus.MOVING
        if data.ignition and speed <= 5:
            return VehicleStatus.IDLE
        if data.ignition is False:
            return VehicleStatus.STOPPED
        return VehicleStatus.ONLINE

    def _process_dtc(self, device, vehicle, data: NormalizedTelemetry) -> None:
        incoming = set(data.dtc_codes or [])
        active = set(
            DTCCode.objects.filter(vehicle=vehicle, is_active=True).values_list("code", flat=True)
        )
        now = timezone.now()

        for code in incoming - active:
            severity = DTCSeverity.CRITICAL if code.startswith("P0") else DTCSeverity.WARNING
            dtc = DTCCode.objects.create(
                vehicle=vehicle,
                device=device,
                code=code,
                description=DTC_DESCRIPTIONS.get(code, "Diagnostic trouble code detected"),
                severity=severity,
                first_detected_at=now,
                last_detected_at=now,
                is_active=True,
            )
            self._broadcast_event(
                "dtc.created",
                {
                    "vehicle_id": vehicle.id,
                    "code": code,
                    "severity": dtc.severity,
                    "description": dtc.description,
                },
                vehicle,
            )
            VehicleAlert.objects.create(
                vehicle=vehicle,
                type=AlertType.ENGINE_DTC,
                severity=AlertSeverity.WARNING if severity == DTCSeverity.WARNING else AlertSeverity.CRITICAL,
                message=f"DTC detected: {code}",
            )

        for code in active - incoming:
            DTCCode.objects.filter(vehicle=vehicle, code=code, is_active=True).update(
                is_active=False,
                resolved_at=now,
            )

        for code in incoming & active:
            DTCCode.objects.filter(vehicle=vehicle, code=code, is_active=True).update(
                last_detected_at=now
            )

    def _check_geofences(self, vehicle, data: NormalizedTelemetry) -> None:
        if data.latitude is None or data.longitude is None:
            return
        from apps.geofences.services import process_geofence_transitions

        process_geofence_transitions(
            vehicle,
            float(data.latitude),
            float(data.longitude),
        )

    def _check_alerts(self, vehicle, data: NormalizedTelemetry) -> None:
        if data.coolant_temperature and data.coolant_temperature > 105:
            self._create_alert(
                vehicle,
                AlertType.HIGH_COOLANT_TEMPERATURE,
                AlertSeverity.CRITICAL,
                f"High coolant temperature: {data.coolant_temperature:.0f}°C",
                data.coolant_temperature,
                105,
            )
        if data.battery_voltage and data.battery_voltage < 11.8:
            self._create_alert(
                vehicle,
                AlertType.LOW_BATTERY,
                AlertSeverity.WARNING,
                f"Low battery voltage: {data.battery_voltage:.1f}V",
                data.battery_voltage,
                11.8,
            )
        if data.speed and data.speed > 120:
            self._create_alert(
                vehicle,
                AlertType.SPEED_LIMIT,
                AlertSeverity.WARNING,
                f"Overspeed: {data.speed:.0f} km/h",
                data.speed,
                120,
            )
        if data.rpm and data.rpm > 5500:
            self._create_alert(
                vehicle,
                AlertType.HIGH_RPM,
                AlertSeverity.WARNING,
                f"High RPM: {data.rpm:.0f}",
                data.rpm,
                5500,
            )

    def _create_alert(
        self,
        vehicle,
        alert_type: str,
        severity: str,
        message: str,
        value: float,
        threshold: float,
    ) -> None:
        existing = VehicleAlert.objects.filter(
            vehicle=vehicle,
            type=alert_type,
            resolved_at__isnull=True,
        ).exists()
        if existing:
            return
        alert = VehicleAlert.objects.create(
            vehicle=vehicle,
            type=alert_type,
            severity=severity,
            message=message,
            value=value,
            threshold=threshold,
        )
        vehicle.status = VehicleStatus.ALERT
        vehicle.save(update_fields=["status", "updated_at"])
        self._broadcast_event(
            "alert.created",
            {
                "vehicle_id": vehicle.id,
                "type": alert_type,
                "severity": severity,
                "message": message,
            },
            vehicle,
        )

    def _broadcast_telemetry(self, vehicle_id: int, data: dict) -> None:
        self._broadcast_event(
            "telemetry.update",
            {"vehicle_id": vehicle_id, "timestamp": data.get("timestamp"), "data": data},
            vehicle_id=vehicle_id,
            company_id=None,
        )

    def _broadcast_event(self, event_type: str, payload: dict, vehicle=None, vehicle_id=None, company_id=None) -> None:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        if vehicle is not None:
            vehicle_id = vehicle.id
            company_id = vehicle.company_id

        async_to_sync(channel_layer.group_send)(
            f"vehicle_{vehicle_id}",
            {"type": "realtime.message", "event": event_type, "payload": payload},
        )
        if company_id:
            async_to_sync(channel_layer.group_send)(
                f"company_{company_id}_fleet",
                {"type": "realtime.message", "event": event_type, "payload": payload},
            )
