from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import UserRole
from apps.devices.models import Device, DeviceStatus
from apps.vehicles.models import Vehicle


def assign_device_to_vehicle(device: Device, vehicle: Vehicle, user) -> Device:
    if user.role == UserRole.COMPANY_ADMIN and device.company_id != user.company_id:
        raise PermissionDenied("Cannot assign device from another company.")
    if user.role == UserRole.COMPANY_ADMIN and vehicle.company_id != user.company_id:
        raise PermissionDenied("Cannot assign to vehicle from another company.")
    if device.status == DeviceStatus.BLOCKED:
        raise ValidationError("Blocked devices cannot be assigned.")

    Device.objects.filter(vehicle=vehicle).update(vehicle=None, status=DeviceStatus.INACTIVE)
    if device.vehicle_id and device.vehicle_id != vehicle.id:
        old_vehicle = device.vehicle
        device.vehicle = None
        device.save(update_fields=["vehicle", "updated_at"])

    device.vehicle = vehicle
    device.company = vehicle.company
    device.status = DeviceStatus.ACTIVE
    device.save(update_fields=["vehicle", "company", "status", "updated_at"])
    return device
