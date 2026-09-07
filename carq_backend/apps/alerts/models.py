from django.db import models


class AlertType(models.TextChoices):
    HIGH_COOLANT_TEMPERATURE = "HIGH_COOLANT_TEMPERATURE", "High Coolant Temperature"
    LOW_BATTERY = "LOW_BATTERY", "Low Battery"
    HIGH_RPM = "HIGH_RPM", "High RPM"
    ENGINE_DTC = "ENGINE_DTC", "Engine DTC"
    DEVICE_OFFLINE = "DEVICE_OFFLINE", "Device Offline"
    SPEED_LIMIT = "SPEED_LIMIT", "Speed Limit"
    GEOFENCE_ENTER = "GEOFENCE_ENTER", "Geofence Enter"
    GEOFENCE_EXIT = "GEOFENCE_EXIT", "Geofence Exit"


class AlertSeverity(models.TextChoices):
    INFO = "INFO", "Info"
    WARNING = "WARNING", "Warning"
    CRITICAL = "CRITICAL", "Critical"


class VehicleAlert(models.Model):
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    type = models.CharField(max_length=40, choices=AlertType.choices)
    severity = models.CharField(max_length=20, choices=AlertSeverity.choices)
    message = models.TextField()
    value = models.FloatField(null=True, blank=True)
    threshold = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["vehicle", "-created_at"]),
            models.Index(fields=["severity", "resolved_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.type} - {self.vehicle_id}"
