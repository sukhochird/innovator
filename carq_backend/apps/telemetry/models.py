from django.db import models


class VehicleTelemetry(models.Model):
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.CASCADE,
        related_name="telemetry_records",
    )
    device = models.ForeignKey(
        "devices.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="telemetry_records",
    )
    timestamp = models.DateTimeField(db_index=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    speed = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)
    rpm = models.FloatField(null=True, blank=True)
    coolant_temperature = models.FloatField(null=True, blank=True)
    engine_load = models.FloatField(null=True, blank=True)
    throttle_position = models.FloatField(null=True, blank=True)
    battery_voltage = models.FloatField(null=True, blank=True)
    fuel_level = models.FloatField(null=True, blank=True)
    intake_air_temperature = models.FloatField(null=True, blank=True)
    engine_runtime = models.FloatField(null=True, blank=True)
    odometer = models.FloatField(null=True, blank=True)
    ignition = models.BooleanField(null=True, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["vehicle", "-timestamp"]),
            models.Index(fields=["device", "-timestamp"]),
            models.Index(fields=["-timestamp"]),
        ]

    def __str__(self) -> str:
        return f"Telemetry {self.vehicle_id} @ {self.timestamp}"
