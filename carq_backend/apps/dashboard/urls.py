from django.urls import path

from .views import (
    AdminDashboardView,
    CompanyDashboardView,
    DriverDashboardView,
    FleetAlertsView,
    FleetDtcView,
    VehicleDashboardView,
)

urlpatterns = [
    path("company/", CompanyDashboardView.as_view(), name="dashboard-company"),
    path("vehicles/<int:vehicle_id>/", VehicleDashboardView.as_view(), name="dashboard-vehicle"),
    path("driver/", DriverDashboardView.as_view(), name="dashboard-driver"),
    path("admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("alerts/", FleetAlertsView.as_view(), name="dashboard-alerts"),
    path("dtc/", FleetDtcView.as_view(), name="dashboard-dtc"),
]
