from django.contrib import admin

from .models import VehicleTelemetry


@admin.register(VehicleTelemetry)
class VehicleTelemetryAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "timestamp", "speed", "rpm", "latitude", "longitude")
    list_filter = ("vehicle",)
    date_hierarchy = "timestamp"
