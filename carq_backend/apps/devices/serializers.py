from rest_framework import serializers

from apps.devices.models import Device


class DeviceSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.IntegerField(source="vehicle.id", read_only=True, allow_null=True)
    vehicle_plate = serializers.CharField(source="vehicle.plate_number", read_only=True, allow_null=True)
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = (
            "id",
            "serial_number",
            "imei",
            "model",
            "firmware_version",
            "status",
            "company",
            "vehicle_id",
            "vehicle_plate",
            "last_seen_at",
            "last_ip",
            "is_online",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "last_seen_at", "last_ip", "created_at", "updated_at")

    def get_is_online(self, obj) -> bool:
        from apps.telemetry.services.redis_state import RedisVehicleState

        if obj.vehicle_id:
            state = RedisVehicleState.get_current(obj.vehicle_id)
            if state:
                return state.get("is_online", False)
        if not obj.last_seen_at:
            return False
        from django.conf import settings
        from django.utils import timezone

        threshold = timezone.now() - timezone.timedelta(
            seconds=getattr(settings, "DEVICE_OFFLINE_THRESHOLD_SECONDS", 120)
        )
        return obj.last_seen_at >= threshold


class DeviceAssignSerializer(serializers.Serializer):
    vehicle_id = serializers.IntegerField()
