from django.db import models


class DTCSeverity(models.TextChoices):
    INFO = "INFO", "Info"
    WARNING = "WARNING", "Warning"
    CRITICAL = "CRITICAL", "Critical"


class DTCCode(models.Model):
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="dtc_codes",
    )
    device = models.ForeignKey(
        "devices.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dtc_codes",
    )
    code = models.CharField(max_length=16)
    description = models.TextField(blank=True)
    severity = models.CharField(
        max_length=20,
        choices=DTCSeverity.choices,
        default=DTCSeverity.WARNING,
    )
    first_detected_at = models.DateTimeField()
    last_detected_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-last_detected_at"]
        indexes = [
            models.Index(fields=["vehicle", "is_active"]),
            models.Index(fields=["code", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} ({self.vehicle_id})"
