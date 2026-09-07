from django.contrib import admin

from apps.geofences.models import Geofence


@admin.register(Geofence)
class GeofenceAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "type", "is_active", "assign_all", "updated_at")
    list_filter = ("type", "is_active", "company")
    search_fields = ("name",)
    filter_horizontal = ("vehicles",)
