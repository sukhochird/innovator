import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class NormalizedTelemetry:
    serial_number: str
    timestamp: datetime
    latitude: float | None = None
    longitude: float | None = None
    speed: float | None = None
    heading: float | None = None
    rpm: float | None = None
    coolant_temperature: float | None = None
    engine_load: float | None = None
    throttle_position: float | None = None
    battery_voltage: float | None = None
    fuel_level: float | None = None
    intake_air_temperature: float | None = None
    engine_runtime: float | None = None
    odometer: float | None = None
    ignition: bool | None = None
    dtc_codes: list[str] = field(default_factory=list)
    raw_payload: dict = field(default_factory=dict)


class TelemetryParser(ABC):
    protocol: str

    @abstractmethod
    def parse(self, payload: Any) -> NormalizedTelemetry:
        ...

    @abstractmethod
    def validate(self, data: NormalizedTelemetry) -> None:
        ...

    def normalize(self, data: NormalizedTelemetry) -> NormalizedTelemetry:
        if data.speed is not None:
            data.speed = max(0.0, float(data.speed))
        if data.rpm is not None:
            data.rpm = max(0.0, float(data.rpm))
        if data.fuel_level is not None:
            data.fuel_level = min(100.0, max(0.0, float(data.fuel_level)))
        return data


class CarqDeviceV1Parser(TelemetryParser):
    protocol = "CARQ_DEVICE_V1"

    def parse(self, payload: Any) -> NormalizedTelemetry:
        if isinstance(payload, str):
            payload = json.loads(payload)
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a JSON object.")

        serial_number = payload.get("serial_number") or payload.get("device_id")
        if not serial_number:
            raise ValueError("serial_number is required.")

        ts = payload.get("timestamp")
        if ts:
            if isinstance(ts, str):
                timestamp = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            else:
                timestamp = datetime.utcnow()
        else:
            from django.utils import timezone

            timestamp = timezone.now()

        return NormalizedTelemetry(
            serial_number=str(serial_number),
            timestamp=timestamp,
            latitude=_float(payload.get("latitude")),
            longitude=_float(payload.get("longitude")),
            speed=_float(payload.get("speed")),
            heading=_float(payload.get("heading")),
            rpm=_float(payload.get("rpm")),
            coolant_temperature=_float(payload.get("coolant_temperature")),
            engine_load=_float(payload.get("engine_load")),
            throttle_position=_float(payload.get("throttle_position")),
            battery_voltage=_float(payload.get("battery_voltage")),
            fuel_level=_float(payload.get("fuel_level")),
            intake_air_temperature=_float(payload.get("intake_air_temperature")),
            engine_runtime=_float(payload.get("engine_runtime")),
            odometer=_float(payload.get("odometer")),
            ignition=payload.get("ignition") if "ignition" in payload else None,
            dtc_codes=list(payload.get("dtc_codes") or []),
            raw_payload=payload,
        )

    def validate(self, data: NormalizedTelemetry) -> None:
        if not data.serial_number:
            raise ValueError("serial_number is required.")


def _float(value) -> float | None:
    if value is None:
        return None
    return float(value)


PARSERS: dict[str, TelemetryParser] = {
    "CARQ_DEVICE_V1": CarqDeviceV1Parser(),
}


def get_parser(protocol: str = "CARQ_DEVICE_V1") -> TelemetryParser:
    if protocol == "JT808":
        from apps.telemetry.parsers.jt808 import JT808Parser

        return JT808Parser()
    parser = PARSERS.get(protocol)
    if not parser:
        raise ValueError(f"Unknown protocol: {protocol}")
    return parser
