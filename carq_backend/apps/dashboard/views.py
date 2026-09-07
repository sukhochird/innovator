from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsCompanyMember, IsSuperAdmin
from apps.dashboard.selectors import (
    build_admin_dashboard,
    build_company_dashboard,
    build_driver_dashboard,
    build_fleet_alerts,
    build_fleet_dtc,
    build_vehicle_dashboard,
)
from apps.vehicles.services import get_vehicle_queryset_for_user, user_can_access_vehicle


class CompanyDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        return Response(build_company_dashboard(request.user))


class VehicleDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vehicle_id):
        from apps.vehicles.models import Vehicle

        vehicle = Vehicle.objects.get(pk=vehicle_id)
        if not user_can_access_vehicle(request.user, vehicle):
            return Response({"detail": "Not found."}, status=404)
        return Response(build_vehicle_dashboard(vehicle_id))


class DriverDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != UserRole.DRIVER:
            return Response({"detail": "Driver access only."}, status=403)
        return Response(build_driver_dashboard(request.user))


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        return Response(build_admin_dashboard())


class FleetAlertsView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        active_only = request.query_params.get("active", "true").lower() != "false"
        return Response(build_fleet_alerts(request.user, active_only=active_only))


class FleetDtcView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        active_only = request.query_params.get("active", "true").lower() != "false"
        return Response(build_fleet_dtc(request.user, active_only=active_only))
