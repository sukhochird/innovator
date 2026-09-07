from django.conf import settings
from django.db import models


class CompanyStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    REJECTED = "REJECTED", "Rejected"


class Company(models.Model):
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=64, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to="company_logos/", blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=CompanyStatus.choices,
        default=CompanyStatus.PENDING,
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_companies",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "companies"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return self.name
