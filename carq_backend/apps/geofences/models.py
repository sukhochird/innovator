from django.conf import settings
from django.db import models


class GeofenceType(models.TextChoices):
    CIRCLE = "CIRCLE", "Circle"
    POLYGON = "POLYGON", "Polygon"
    RECTANGLE = "RECTANGLE", "Rectangle"


class Geofence(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="geofences",
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=GeofenceType.choices)
    geometry = models.JSONField(
        help_text=(
            "CIRCLE: {center: [lng, lat], radius_m: number}; "
            "POLYGON: {coordinates: [[lng, lat], ...]}; "
            "RECTANGLE: {bounds: [[sw_lng, sw_lat], [ne_lng, ne_lat]]}"
        ),
    )
    radius_m = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    alert_on_entry = models.BooleanField(default=True)
    alert_on_exit = models.BooleanField(default=True)
    assign_all = models.BooleanField(default=True)
    vehicles = models.ManyToManyField(
        "vehicles.Vehicle",
        blank=True,
        related_name="geofences",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_geofences",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["company", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.company_id})"
