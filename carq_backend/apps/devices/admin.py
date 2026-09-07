from django.contrib import admin

from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("serial_number", "status", "company", "last_seen_at")
    list_filter = ("status", "company")
    search_fields = ("serial_number", "imei")
