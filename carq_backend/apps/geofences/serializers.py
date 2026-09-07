from rest_framework import serializers

from apps.geofences.models import Geofence, GeofenceType
from apps.vehicles.models import Vehicle


class GeofenceSerializer(serializers.ModelSerializer):
    vehicle_ids = serializers.PrimaryKeyRelatedField(
        source="vehicles",
        many=True,
        queryset=Vehicle.objects.all(),
        required=False,
    )
    assigned_count = serializers.SerializerMethodField()

    class Meta:
        model = Geofence
        fields = [
            "id",
            "company",
            "name",
            "description",
            "type",
            "geometry",
            "radius_m",
            "is_active",
            "alert_on_entry",
            "alert_on_exit",
            "assign_all",
            "vehicle_ids",
            "assigned_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["company", "created_at", "updated_at"]

    def get_assigned_count(self, obj: Geofence) -> int:
        if obj.assign_all:
            return Vehicle.objects.filter(company_id=obj.company_id).count()
        return obj.vehicles.count()

    def validate(self, attrs):
        gtype = attrs.get("type") or getattr(self.instance, "type", None)
        geometry = attrs.get("geometry") or getattr(self.instance, "geometry", None)
        if gtype and geometry:
            if gtype == GeofenceType.CIRCLE:
                center = geometry.get("center")
                radius = geometry.get("radius_m") or attrs.get("radius_m")
                if not center or len(center) < 2 or not radius:
                    raise serializers.ValidationError(
                        {"geometry": "Circle requires center [lng, lat] and radius_m."}
                    )
            elif gtype == GeofenceType.POLYGON:
                coords = geometry.get("coordinates") or []
                if len(coords) < 3:
                    raise serializers.ValidationError(
                        {"geometry": "Polygon requires at least 3 coordinates."}
                    )
            elif gtype == GeofenceType.RECTANGLE:
                bounds = geometry.get("bounds") or []
                if len(bounds) < 2:
                    raise serializers.ValidationError(
                        {"geometry": "Rectangle requires bounds [[sw_lng, sw_lat], [ne_lng, ne_lat]]."}
                    )
        return attrs

    def create(self, validated_data):
        vehicles = validated_data.pop("vehicles", [])
        geofence = Geofence.objects.create(**validated_data)
        if not geofence.assign_all:
            geofence.vehicles.set(vehicles)
        return geofence

    def update(self, instance, validated_data):
        vehicles = validated_data.pop("vehicles", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if vehicles is not None and not instance.assign_all:
            instance.vehicles.set(vehicles)
        return instance
