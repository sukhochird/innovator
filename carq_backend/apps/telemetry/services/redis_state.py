import json
from typing import Any

import redis
from django.conf import settings


class RedisVehicleState:
    @staticmethod
    def _client() -> redis.Redis:
        return redis.from_url(settings.REDIS_URL, decode_responses=True)

    @staticmethod
    def _key(vehicle_id: int) -> str:
        return f"vehicle:{vehicle_id}:current"

    @classmethod
    def set_current(cls, vehicle_id: int, data: dict[str, Any]) -> None:
        client = cls._client()
        client.setex(
            cls._key(vehicle_id),
            getattr(settings, "TELEMETRY_CACHE_TTL_SECONDS", 300),
            json.dumps(data, default=str),
        )

    @classmethod
    def get_current(cls, vehicle_id: int) -> dict[str, Any] | None:
        client = cls._client()
        raw = client.get(cls._key(vehicle_id))
        if not raw:
            return None
        return json.loads(raw)

    @classmethod
    def set_device_online(cls, serial_number: str, online: bool = True) -> None:
        client = cls._client()
        key = f"device:{serial_number}:online"
        if online:
            client.setex(key, 300, "1")
        else:
            client.delete(key)

    @classmethod
    def is_device_online(cls, serial_number: str) -> bool:
        client = cls._client()
        return client.get(f"device:{serial_number}:online") == "1"
