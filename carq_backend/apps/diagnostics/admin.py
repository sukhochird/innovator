from django.contrib import admin

from .models import DTCCode


@admin.register(DTCCode)
class DTCCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "vehicle", "severity", "is_active", "last_detected_at")
    list_filter = ("severity", "is_active")
    search_fields = ("code",)
