from django.contrib import admin

from .models import DriverVehicleAssignment, Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "make", "model", "company", "status", "driver")
    list_filter = ("status", "company", "fuel_type")
    search_fields = ("plate_number", "vin", "make", "model")


@admin.register(DriverVehicleAssignment)
class DriverVehicleAssignmentAdmin(admin.ModelAdmin):
    list_display = ("driver", "vehicle", "is_active", "assigned_at", "unassigned_at")
    list_filter = ("is_active",)
