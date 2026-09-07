from django.conf import settings
from django.db import models


class VehicleStatus(models.TextChoices):
    ONLINE = "ONLINE", "Online"
    OFFLINE = "OFFLINE", "Offline"
    MOVING = "MOVING", "Moving"
    STOPPED = "STOPPED", "Stopped"
    IDLE = "IDLE", "Idle"
    ALERT = "ALERT", "Alert"


class FuelType(models.TextChoices):
    GASOLINE = "GASOLINE", "Gasoline"
    DIESEL = "DIESEL", "Diesel"
    ELECTRIC = "ELECTRIC", "Electric"
    HYBRID = "HYBRID", "Hybrid"
    OTHER = "OTHER", "Other"


class Vehicle(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="vehicles",
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_vehicles",
    )
    plate_number = models.CharField(max_length=32)
    vin = models.CharField(max_length=32, blank=True)
    make = models.CharField(max_length=64, blank=True)
    model = models.CharField(max_length=64, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    color = models.CharField(max_length=32, blank=True)
    fuel_type = models.CharField(
        max_length=20,
        choices=FuelType.choices,
        default=FuelType.GASOLINE,
    )
    status = models.CharField(
        max_length=20,
        choices=VehicleStatus.choices,
        default=VehicleStatus.OFFLINE,
    )
    nickname = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["plate_number"]
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "plate_number"]),
            models.Index(fields=["driver"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "plate_number"],
                name="unique_plate_per_company",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.plate_number} ({self.make} {self.model})".strip()


class DriverVehicleAssignment(models.Model):
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vehicle_assignments",
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="driver_assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    unassigned_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["driver", "is_active"]),
            models.Index(fields=["vehicle", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.driver} -> {self.vehicle}"
