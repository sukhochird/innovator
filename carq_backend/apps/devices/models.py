from django.db import models


class DeviceStatus(models.TextChoices):
    UNASSIGNED = "UNASSIGNED", "Unassigned"
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    BLOCKED = "BLOCKED", "Blocked"


class Device(models.Model):
    serial_number = models.CharField(max_length=64, unique=True)
    imei = models.CharField(max_length=32, blank=True)
    model = models.CharField(max_length=128, blank=True)
    firmware_version = models.CharField(max_length=32, blank=True)
    status = models.CharField(
        max_length=20,
        choices=DeviceStatus.choices,
        default=DeviceStatus.UNASSIGNED,
    )
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="devices",
    )
    vehicle = models.OneToOneField(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_device",
    )
    terminal_phone = models.CharField(
        max_length=16,
        blank=True,
        unique=True,
        null=True,
        help_text="JT808 terminal phone ID (12-digit BCD)",
    )
    last_seen_at = models.DateTimeField(null=True, blank=True)
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["serial_number"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["company", "status"]),
            models.Index(fields=["last_seen_at"]),
            models.Index(fields=["terminal_phone"]),
        ]

    def __str__(self) -> str:
        return self.serial_number
