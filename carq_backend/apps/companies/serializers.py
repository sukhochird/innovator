from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.companies.models import Company, CompanyStatus


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = (
            "id",
            "name",
            "registration_number",
            "email",
            "phone",
            "address",
            "logo",
            "status",
            "approved_at",
            "approved_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "approved_at", "approved_by", "created_at", "updated_at")


class CompanyListSerializer(serializers.ModelSerializer):
    vehicle_count = serializers.IntegerField(read_only=True, default=0)
    device_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Company
        fields = (
            "id",
            "name",
            "registration_number",
            "email",
            "phone",
            "status",
            "vehicle_count",
            "device_count",
            "created_at",
        )
