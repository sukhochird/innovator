from django.contrib import admin

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "registration_number", "status", "email", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "registration_number", "email")
