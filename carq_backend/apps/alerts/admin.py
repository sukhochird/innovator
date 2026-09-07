from django.contrib import admin

from .models import VehicleAlert


@admin.register(VehicleAlert)
class VehicleAlertAdmin(admin.ModelAdmin):
    list_display = ("type", "vehicle", "severity", "created_at", "resolved_at")
    list_filter = ("type", "severity")
