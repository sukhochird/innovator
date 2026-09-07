from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsCompanyAdminOrSuperAdmin, IsSuperAdmin
from apps.companies.models import Company, CompanyStatus
from apps.companies.serializers import CompanyListSerializer, CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def get_serializer_class(self):
        if self.action == "list":
            return CompanyListSerializer
        return CompanySerializer

    def get_queryset(self):
        qs = Company.objects.annotate(
            vehicle_count=Count("vehicles", distinct=True),
            device_count=Count("devices", distinct=True),
        )
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return qs
        if user.role == UserRole.COMPANY_ADMIN and user.company_id:
            return qs.filter(pk=user.company_id)
        return qs.none()

    def get_permissions(self):
        if self.action in ("create", "destroy", "approve", "reject", "suspend", "activate"):
            return [IsSuperAdmin()]
        if self.action in ("update", "partial_update", "retrieve"):
            return [IsCompanyAdminOrSuperAdmin()]
        if self.action == "list":
            return [IsCompanyAdminOrSuperAdmin()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(status=CompanyStatus.PENDING)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        company = self.get_object()
        company.status = CompanyStatus.ACTIVE
        company.approved_at = timezone.now()
        company.approved_by = request.user
        company.save(update_fields=["status", "approved_at", "approved_by", "updated_at"])
        return Response(CompanySerializer(company).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        company = self.get_object()
        company.status = CompanyStatus.REJECTED
        company.save(update_fields=["status", "updated_at"])
        return Response(CompanySerializer(company).data)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        company = self.get_object()
        company.status = CompanyStatus.SUSPENDED
        company.save(update_fields=["status", "updated_at"])
        return Response(CompanySerializer(company).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        company = self.get_object()
        company.status = CompanyStatus.ACTIVE
        company.save(update_fields=["status", "updated_at"])
        return Response(CompanySerializer(company).data)
