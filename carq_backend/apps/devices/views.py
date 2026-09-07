from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsCompanyAdminOrSuperAdmin, IsSuperAdmin
from apps.devices.models import Device, DeviceStatus
from apps.devices.serializers import DeviceAssignSerializer, DeviceSerializer
from apps.devices.services import assign_device_to_vehicle
from apps.vehicles.models import Vehicle


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.select_related("company", "vehicle").all()
    serializer_class = DeviceSerializer
    filterset_fields = ["status", "company"]
    search_fields = ["serial_number", "imei", "model"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return qs
        if user.role == UserRole.COMPANY_ADMIN and user.company_id:
            return qs.filter(company_id=user.company_id)
        return qs.none()

    def get_permissions(self):
        if self.action in ("create", "destroy", "block"):
            return [IsSuperAdmin()]
        return [IsCompanyAdminOrSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(status=DeviceStatus.UNASSIGNED)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        device = self.get_object()
        device.status = DeviceStatus.ACTIVE
        device.save(update_fields=["status", "updated_at"])
        return Response(DeviceSerializer(device).data)

    @action(detail=True, methods=["post"])
    def block(self, request, pk=None):
        device = self.get_object()
        device.status = DeviceStatus.BLOCKED
        device.save(update_fields=["status", "updated_at"])
        return Response(DeviceSerializer(device).data)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        device = self.get_object()
        serializer = DeviceAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vehicle = Vehicle.objects.get(pk=serializer.validated_data["vehicle_id"])
        assign_device_to_vehicle(device, vehicle, request.user)
        device.refresh_from_db()
        return Response(DeviceSerializer(device).data)
