from rest_framework import serializers

from apps.alerts.models import VehicleAlert
from apps.diagnostics.models import DTCCode


class FleetAlertSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.IntegerField(source="vehicle.id", read_only=True)
    vehicle_plate = serializers.CharField(source="vehicle.plate_number", read_only=True)
    vehicle_make = serializers.CharField(source="vehicle.make", read_only=True)
    vehicle_model = serializers.CharField(source="vehicle.model", read_only=True)

    class Meta:
        model = VehicleAlert
        fields = (
            "id",
            "vehicle_id",
            "vehicle_plate",
            "vehicle_make",
            "vehicle_model",
            "type",
            "severity",
            "message",
            "value",
            "threshold",
            "created_at",
            "acknowledged_at",
            "resolved_at",
        )


class FleetDTCSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.IntegerField(source="vehicle.id", read_only=True)
    vehicle_plate = serializers.CharField(source="vehicle.plate_number", read_only=True)
    vehicle_make = serializers.CharField(source="vehicle.make", read_only=True)
    vehicle_model = serializers.CharField(source="vehicle.model", read_only=True)

    class Meta:
        model = DTCCode
        fields = (
            "id",
            "vehicle_id",
            "vehicle_plate",
            "vehicle_make",
            "vehicle_model",
            "code",
            "description",
            "severity",
            "is_active",
            "first_detected_at",
            "last_detected_at",
            "resolved_at",
        )
