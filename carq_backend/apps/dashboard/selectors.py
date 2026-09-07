from django.db.models import Count, Q
from django.utils import timezone

from apps.accounts.models import UserRole
from apps.alerts.models import AlertSeverity, VehicleAlert
from apps.companies.models import Company, CompanyStatus
from apps.devices.models import Device, DeviceStatus
from apps.diagnostics.models import DTCCode
from apps.telemetry.services.redis_state import RedisVehicleState
from apps.vehicles.models import Vehicle, VehicleStatus
from apps.vehicles.serializers import VehicleSerializer


def get_fleet_stats(vehicles_qs):
    vehicles = list(vehicles_qs)
    stats = {
        "total": len(vehicles),
        "online": 0,
        "offline": 0,
        "moving": 0,
        "idle": 0,
        "stopped": 0,
        "alert": 0,
    }
    for v in vehicles:
        state = RedisVehicleState.get_current(v.id)
        status = state.get("status") if state else v.status
        if status == VehicleStatus.MOVING:
            stats["moving"] += 1
            stats["online"] += 1
        elif status == VehicleStatus.IDLE:
            stats["idle"] += 1
            stats["online"] += 1
        elif status == VehicleStatus.STOPPED:
            stats["stopped"] += 1
            stats["online"] += 1
        elif status == VehicleStatus.ALERT:
            stats["alert"] += 1
            stats["online"] += 1
        elif status == VehicleStatus.ONLINE:
            stats["online"] += 1
        else:
            stats["offline"] += 1
    return stats


def get_alert_stats(vehicle_ids):
    qs = VehicleAlert.objects.filter(vehicle_id__in=vehicle_ids, resolved_at__isnull=True)
    return {
        "critical": qs.filter(severity=AlertSeverity.CRITICAL).count(),
        "warning": qs.filter(severity=AlertSeverity.WARNING).count(),
    }


def get_dtc_stats(vehicle_ids):
    return {
        "active": DTCCode.objects.filter(vehicle_id__in=vehicle_ids, is_active=True).count(),
    }


def build_company_dashboard(user):
    if user.role == UserRole.COMPANY_ADMIN:
        vehicles_qs = Vehicle.objects.filter(company_id=user.company_id).select_related(
            "driver", "assigned_device", "company"
        )
    elif user.role == UserRole.SUPER_ADMIN:
        vehicles_qs = Vehicle.objects.select_related("driver", "assigned_device", "company").all()
    else:
        vehicles_qs = Vehicle.objects.none()

    vehicle_ids = list(vehicles_qs.values_list("id", flat=True))

    company_data = None
    if user.company_id:
        company = Company.objects.filter(pk=user.company_id).first()
        if company:
            company_data = {
                "id": company.id,
                "name": company.name,
                "registration_number": company.registration_number,
                "status": company.status,
            }

    return {
        "company": company_data,
        "fleet": get_fleet_stats(vehicles_qs),
        "alerts": get_alert_stats(vehicle_ids),
        "dtc": get_dtc_stats(vehicle_ids),
        "vehicles": VehicleSerializer(vehicles_qs, many=True).data,
    }


def build_vehicle_dashboard(vehicle_id: int):
    vehicle = Vehicle.objects.select_related("driver", "assigned_device", "company").get(pk=vehicle_id)
    state = RedisVehicleState.get_current(vehicle.id)
    telemetry_history = []
    from apps.telemetry.models import VehicleTelemetry
    from apps.vehicles.serializers import AlertSerializer, DTCSerializer, TelemetrySerializer

    recent = VehicleTelemetry.objects.filter(vehicle=vehicle).order_by("-timestamp")[:50]
    return {
        "vehicle": VehicleSerializer(vehicle).data,
        "current": state,
        "telemetry_history": TelemetrySerializer(recent, many=True).data,
        "dtc": DTCSerializer(
            DTCCode.objects.filter(vehicle=vehicle, is_active=True), many=True
        ).data,
        "alerts": AlertSerializer(
            VehicleAlert.objects.filter(vehicle=vehicle, resolved_at__isnull=True), many=True
        ).data,
    }


def build_driver_dashboard(user):
    vehicles = Vehicle.objects.filter(driver=user).select_related("assigned_device", "company")
    vehicle = vehicles.first()
    if not vehicle:
        return {"vehicle": None, "current": None, "dtc": [], "alerts": []}
    dashboard = build_vehicle_dashboard(vehicle.id)
    return {
        "vehicle": dashboard["vehicle"],
        "current": dashboard["current"],
        "dtc": dashboard["dtc"],
        "alerts": dashboard["alerts"],
    }


def build_admin_dashboard():
    now = timezone.now()
    threshold = now - timezone.timedelta(seconds=120)
    online_devices = Device.objects.filter(last_seen_at__gte=threshold).count()
    online_vehicles = Vehicle.objects.filter(status__in=[
        VehicleStatus.ONLINE, VehicleStatus.MOVING, VehicleStatus.IDLE, VehicleStatus.STOPPED, VehicleStatus.ALERT
    ]).count()
    return {
        "companies": {
            "total": Company.objects.count(),
            "active": Company.objects.filter(status=CompanyStatus.ACTIVE).count(),
            "pending": Company.objects.filter(status=CompanyStatus.PENDING).count(),
        },
        "devices": {
            "total": Device.objects.count(),
            "online": online_devices,
            "active": Device.objects.filter(status=DeviceStatus.ACTIVE).count(),
        },
        "vehicles": {
            "total": Vehicle.objects.count(),
            "online": online_vehicles,
        },
        "alerts": {
            "critical": VehicleAlert.objects.filter(
                severity=AlertSeverity.CRITICAL, resolved_at__isnull=True
            ).count(),
        },
        "recent_companies": list(
            Company.objects.order_by("-created_at")[:10].values(
                "id", "name", "status", "created_at"
            )
        ),
    }
