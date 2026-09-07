from rest_framework import serializers

from apps.accounts.models import User
from apps.diagnostics.models import DTCCode
from apps.alerts.models import VehicleAlert
from apps.telemetry.models import VehicleTelemetry
from apps.vehicles.models import DriverVehicleAssignment, Vehicle


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone")


class VehicleSerializer(serializers.ModelSerializer):
    device_serial = serializers.CharField(source="assigned_device.serial_number", read_only=True, allow_null=True)
    device_id = serializers.IntegerField(source="assigned_device.id", read_only=True, allow_null=True)
    driver_name = serializers.SerializerMethodField()
    current_telemetry = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = (
            "id",
            "company",
            "driver",
            "driver_name",
            "device_id",
            "device_serial",
            "plate_number",
            "vin",
            "make",
            "model",
            "year",
            "color",
            "fuel_type",
            "status",
            "nickname",
            "current_telemetry",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "created_at", "updated_at")

    def get_driver_name(self, obj) -> str | None:
        if obj.driver:
            return f"{obj.driver.first_name} {obj.driver.last_name}".strip()
        return None

    def get_current_telemetry(self, obj) -> dict | None:
        from apps.telemetry.services.redis_state import RedisVehicleState

        return RedisVehicleState.get_current(obj.id)


class VehicleAssignDeviceSerializer(serializers.Serializer):
    device_id = serializers.IntegerField()


class VehicleAssignDriverSerializer(serializers.Serializer):
    driver_id = serializers.IntegerField()


class TelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleTelemetry
        fields = (
            "id",
            "vehicle",
            "device",
            "timestamp",
            "latitude",
            "longitude",
            "speed",
            "heading",
            "rpm",
            "coolant_temperature",
            "engine_load",
            "throttle_position",
            "battery_voltage",
            "fuel_level",
            "intake_air_temperature",
            "engine_runtime",
            "odometer",
            "ignition",
        )


class TelemetryRawLogSerializer(serializers.ModelSerializer):
    device_serial = serializers.CharField(source="device.serial_number", read_only=True, allow_null=True)
    protocol = serializers.SerializerMethodField()

    class Meta:
        model = VehicleTelemetry
        fields = (
            "id",
            "timestamp",
            "device",
            "device_serial",
            "protocol",
            "speed",
            "latitude",
            "longitude",
            "raw_payload",
        )

    def get_protocol(self, obj) -> str:
        payload = obj.raw_payload or {}
        return str(payload.get("protocol") or "unknown")


class DTCSerializer(serializers.ModelSerializer):
    class Meta:
        model = DTCCode
        fields = (
            "id",
            "vehicle",
            "device",
            "code",
            "description",
            "severity",
            "first_detected_at",
            "last_detected_at",
            "resolved_at",
            "is_active",
        )


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleAlert
        fields = (
            "id",
            "vehicle",
            "type",
            "severity",
            "message",
            "value",
            "threshold",
            "created_at",
            "acknowledged_at",
            "resolved_at",
        )
