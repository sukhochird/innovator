from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsCompanyAdminOrSuperAdmin
from apps.geofences.models import Geofence
from apps.geofences.serializers import GeofenceSerializer
from apps.vehicles.models import Vehicle


class GeofenceViewSet(viewsets.ModelViewSet):
    serializer_class = GeofenceSerializer
    permission_classes = [IsCompanyAdminOrSuperAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = Geofence.objects.select_related("company").prefetch_related("vehicles")
        if user.role == UserRole.SUPER_ADMIN:
            company_id = self.request.query_params.get("company")
            if company_id:
                qs = qs.filter(company_id=company_id)
            return qs
        if user.role == UserRole.COMPANY_ADMIN and user.company_id:
            return qs.filter(company_id=user.company_id)
        return Geofence.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.COMPANY_ADMIN:
            company_id = user.company_id
        else:
            company_id = self.request.data.get("company") or user.company_id
        if not company_id:
            raise PermissionDenied("Company required.")
        vehicle_ids = self.request.data.get("vehicle_ids") or []
        if vehicle_ids:
            invalid = Vehicle.objects.filter(pk__in=vehicle_ids).exclude(company_id=company_id)
            if invalid.exists():
                raise PermissionDenied("Cannot assign vehicles from another company.")
        serializer.save(company_id=company_id, created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if user.role == UserRole.COMPANY_ADMIN and instance.company_id != user.company_id:
            raise PermissionDenied()
        vehicle_ids = self.request.data.get("vehicle_ids")
        if vehicle_ids is not None:
            invalid = Vehicle.objects.filter(pk__in=vehicle_ids).exclude(company_id=instance.company_id)
            if invalid.exists():
                raise PermissionDenied("Cannot assign vehicles from another company.")
        serializer.save()
