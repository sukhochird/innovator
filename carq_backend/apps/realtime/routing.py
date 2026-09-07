from django.urls import re_path

from .consumers import DeviceTelemetryConsumer, DriverVehicleConsumer, FleetConsumer, VehicleConsumer

websocket_urlpatterns = [
    re_path(r"ws/vehicles/(?P<vehicle_id>\d+)/$", VehicleConsumer.as_asgi()),
    re_path(r"ws/company/fleet/$", FleetConsumer.as_asgi()),
    re_path(r"ws/driver/vehicle/$", DriverVehicleConsumer.as_asgi()),
    re_path(r"ws/device/telemetry/$", DeviceTelemetryConsumer.as_asgi()),
]
