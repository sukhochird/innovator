import math
from datetime import timedelta

from django.utils import timezone


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _format_duration(seconds: float) -> str:
    seconds = max(0, int(seconds))
    hours, rem = divmod(seconds, 3600)
    mins = rem // 60
    if hours:
        return f"{hours}h {mins}m"
    return f"{mins} min"


def simplify_route(points: list[dict], max_points: int = 2000) -> list[dict]:
    if len(points) <= max_points:
        return points
    step = max(1, len(points) // max_points)
    simplified = [points[i] for i in range(0, len(points), step)]
    if simplified[-1] != points[-1]:
        simplified.append(points[-1])
    return simplified


def compute_track_statistics(points: list[dict]) -> dict:
    if not points:
        return {
            "distance_km": 0.0,
            "duration_seconds": 0,
            "duration_display": "0 min",
            "average_speed_kmh": 0.0,
            "max_speed_kmh": 0.0,
            "idle_time_seconds": 0,
            "idle_time_display": "0 min",
            "stops": 0,
            "point_count": 0,
        }

    sorted_pts = sorted(points, key=lambda p: p["timestamp"])
    total_distance = 0.0
    max_speed = 0.0
    speed_sum = 0.0
    speed_count = 0
    idle_seconds = 0.0
    stops = 0
    in_stop = False
    stop_started = None

    for i in range(1, len(sorted_pts)):
        prev, curr = sorted_pts[i - 1], sorted_pts[i]
        lat1, lng1 = prev.get("latitude"), prev.get("longitude")
        lat2, lng2 = curr.get("latitude"), curr.get("longitude")
        if lat1 is not None and lng1 is not None and lat2 is not None and lng2 is not None:
            total_distance += haversine_km(float(lat1), float(lng1), float(lat2), float(lng2))

        t1 = prev["timestamp"]
        t2 = curr["timestamp"]
        dt = (t2 - t1).total_seconds() if t1 and t2 else 0

        speed = curr.get("speed")
        if speed is not None:
            speed_val = float(speed)
            max_speed = max(max_speed, speed_val)
            if speed_val > 0:
                speed_sum += speed_val
                speed_count += 1

        is_idle = (speed or 0) < 1
        if is_idle and dt > 0:
            idle_seconds += dt

        if is_idle and not in_stop:
            in_stop = True
            stop_started = t2
        elif not is_idle and in_stop:
            if stop_started and t2:
                stop_duration = (t2 - stop_started).total_seconds()
                if stop_duration >= 120:
                    stops += 1
            in_stop = False
            stop_started = None

    start_ts = sorted_pts[0]["timestamp"]
    end_ts = sorted_pts[-1]["timestamp"]
    duration_seconds = (end_ts - start_ts).total_seconds() if start_ts and end_ts else 0
    avg_speed = (total_distance / (duration_seconds / 3600)) if duration_seconds > 0 else 0.0
    if speed_count > 0:
        avg_speed = speed_sum / speed_count

    return {
        "distance_km": round(total_distance, 1),
        "duration_seconds": int(duration_seconds),
        "duration_display": _format_duration(duration_seconds),
        "average_speed_kmh": round(avg_speed, 1),
        "max_speed_kmh": round(max_speed, 1),
        "idle_time_seconds": int(idle_seconds),
        "idle_time_display": _format_duration(idle_seconds),
        "stops": stops,
        "point_count": len(sorted_pts),
    }


def parse_datetime_range(start: str | None, end: str | None):
    now = timezone.now()
    if not start and not end:
        start_dt = now - timedelta(hours=24)
        end_dt = now
    else:
        start_dt = timezone.datetime.fromisoformat(start.replace("Z", "+00:00")) if start else now - timedelta(hours=24)
        end_dt = timezone.datetime.fromisoformat(end.replace("Z", "+00:00")) if end else now
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        if timezone.is_naive(end_dt):
            end_dt = timezone.make_aware(end_dt)
    return start_dt, end_dt
