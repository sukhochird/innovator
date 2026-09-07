import json
import math
from typing import Iterable

from django.core.cache import cache

from apps.alerts.models import AlertSeverity, AlertType, VehicleAlert
from apps.geofences.models import Geofence
from apps.vehicles.models import Vehicle, VehicleStatus


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def point_in_geofence(lat: float, lng: float, geofence: Geofence) -> bool:
    geom = geofence.geometry or {}
    gtype = geofence.type

    if gtype == "CIRCLE":
        center = geom.get("center") or []
        if len(center) < 2:
            return False
        radius = geom.get("radius_m") or geofence.radius_m or 0
        return haversine_m(lat, lng, center[1], center[0]) <= radius

    if gtype == "RECTANGLE":
        bounds = geom.get("bounds") or []
        if len(bounds) < 2:
            return False
        sw, ne = bounds[0], bounds[1]
        min_lng, min_lat = sw[0], sw[1]
        max_lng, max_lat = ne[0], ne[1]
        return min_lng <= lng <= max_lng and min_lat <= lat <= max_lat

    if gtype == "POLYGON":
        coords = geom.get("coordinates") or []
        if len(coords) < 3:
            return False
        return _point_in_polygon(lng, lat, coords)

    return False


def _point_in_polygon(x: float, y: float, polygon: list[list[float]]) -> bool:
    inside = False
    n = len(polygon)
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i][0], polygon[i][1]
        xj, yj = polygon[j][0], polygon[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def geofences_for_vehicle(vehicle: Vehicle) -> Iterable[Geofence]:
    qs = Geofence.objects.filter(
        company_id=vehicle.company_id,
        is_active=True,
    ).prefetch_related("vehicles")
    for gf in qs:
        if gf.assign_all or gf.vehicles.filter(pk=vehicle.id).exists():
            yield gf


def _redis_key(vehicle_id: int) -> str:
    return f"geofence:vehicle:{vehicle_id}:inside"


def get_vehicle_inside_geofences(vehicle_id: int) -> set[int]:
    raw = cache.get(_redis_key(vehicle_id))
    if not raw:
        return set()
    try:
        return set(json.loads(raw))
    except (TypeError, json.JSONDecodeError):
        return set()


def set_vehicle_inside_geofences(vehicle_id: int, geofence_ids: set[int]) -> None:
    cache.set(_redis_key(vehicle_id), json.dumps(list(geofence_ids)), timeout=86400)


def process_geofence_transitions(vehicle: Vehicle, lat: float, lng: float) -> None:
    if lat is None or lng is None:
        return

    applicable = list(geofences_for_vehicle(vehicle))
    currently_inside: set[int] = set()
    for gf in applicable:
        if point_in_geofence(lat, lng, gf):
            currently_inside.add(gf.id)

    previously_inside = get_vehicle_inside_geofences(vehicle.id)

    for gf in applicable:
        was_inside = gf.id in previously_inside
        is_inside = gf.id in currently_inside

        if not was_inside and is_inside and gf.alert_on_entry:
            _create_geofence_alert(vehicle, gf, AlertType.GEOFENCE_ENTER, "entered")
        elif was_inside and not is_inside and gf.alert_on_exit:
            _create_geofence_alert(vehicle, gf, AlertType.GEOFENCE_EXIT, "exited")

    set_vehicle_inside_geofences(vehicle.id, currently_inside)


def _create_geofence_alert(
    vehicle: Vehicle,
    geofence: Geofence,
    alert_type: str,
    action: str,
) -> None:
    severity = AlertSeverity.WARNING
    message = f"Vehicle {vehicle.plate_number} {action} geofence '{geofence.name}'"
    VehicleAlert.objects.create(
        vehicle=vehicle,
        type=alert_type,
        severity=severity,
        message=message,
    )
    vehicle.status = VehicleStatus.ALERT
    vehicle.save(update_fields=["status", "updated_at"])

    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    if channel_layer:
        payload = {
            "vehicle_id": vehicle.id,
            "type": alert_type,
            "severity": severity,
            "message": message,
            "geofence_id": geofence.id,
            "geofence_name": geofence.name,
        }
        async_to_sync(channel_layer.group_send)(
            f"vehicle_{vehicle.id}",
            {"type": "realtime.message", "event": "alert.created", "payload": payload},
        )
        async_to_sync(channel_layer.group_send)(
            f"company_{vehicle.company_id}_fleet",
            {"type": "realtime.message", "event": "alert.created", "payload": payload},
        )
