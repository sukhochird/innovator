from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import User, UserRole
from apps.devices.models import Device
from apps.devices.services import assign_device_to_vehicle
from apps.vehicles.models import DriverVehicleAssignment, Vehicle


def get_vehicle_queryset_for_user(user):
    qs = Vehicle.objects.select_related("company", "driver", "assigned_device")
    if user.role == UserRole.SUPER_ADMIN:
        return qs
    if user.role == UserRole.COMPANY_ADMIN and user.company_id:
        return qs.filter(company_id=user.company_id)
    if user.role == UserRole.DRIVER:
        return qs.filter(driver=user)
    return qs.none()


def user_can_access_vehicle(user, vehicle: Vehicle) -> bool:
    if user.role == UserRole.SUPER_ADMIN:
        return True
    if user.role == UserRole.COMPANY_ADMIN:
        return vehicle.company_id == user.company_id
    if user.role == UserRole.DRIVER:
        return vehicle.driver_id == user.id
    return False


def assign_driver_to_vehicle(vehicle: Vehicle, driver: User, assigned_by) -> Vehicle:
    if driver.role != UserRole.DRIVER:
        raise ValidationError("User must be a driver.")
    if assigned_by.role == UserRole.COMPANY_ADMIN:
        if vehicle.company_id != assigned_by.company_id:
            raise PermissionDenied("Vehicle belongs to another company.")
        if driver.company_id != assigned_by.company_id:
            raise PermissionDenied("Driver belongs to another company.")

    DriverVehicleAssignment.objects.filter(vehicle=vehicle, is_active=True).update(
        is_active=False,
        unassigned_at=timezone.now(),
    )
    DriverVehicleAssignment.objects.filter(driver=driver, is_active=True).update(
        is_active=False,
        unassigned_at=timezone.now(),
    )
    DriverVehicleAssignment.objects.create(driver=driver, vehicle=vehicle, is_active=True)
    vehicle.driver = driver
    vehicle.save(update_fields=["driver", "updated_at"])
    return vehicle
