from django.urls import path

from .views import AdminDashboardView, CompanyDashboardView, DriverDashboardView, VehicleDashboardView

urlpatterns = [
    path("company/", CompanyDashboardView.as_view(), name="dashboard-company"),
    path("vehicles/<int:vehicle_id>/", VehicleDashboardView.as_view(), name="dashboard-vehicle"),
    path("driver/", DriverDashboardView.as_view(), name="dashboard-driver"),
    path("admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
]
