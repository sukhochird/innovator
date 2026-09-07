"""JT808 binary protocol parser for 0x0200 location + OBD2 reports."""

import struct
from datetime import datetime, timezone as dt_timezone

from django.utils import timezone

from apps.telemetry.parsers.base import NormalizedTelemetry, TelemetryParser

# DTC hex value -> OBD code (matches simulator.py encoding)
DTC_HEX_TO_CODE = {
    0x0300: "P0300",
    0x0171: "P0171",
    0x0420: "P0420",
    0x0115: "P0115",
}


def unescape_jt808(data: bytes) -> bytes:
    out = bytearray()
    i = 0
    while i < len(data):
        if data[i] == 0x7D and i + 1 < len(data):
            if data[i + 1] == 0x02:
                out.append(0x7E)
                i += 2
                continue
            if data[i + 1] == 0x01:
                out.append(0x7D)
                i += 2
                continue
        out.append(data[i])
        i += 1
    return bytes(out)


def bcd_to_phone(bcd: bytes) -> str:
    digits = []
    for b in bcd:
        digits.append(str((b >> 4) & 0x0F))
        digits.append(str(b & 0x0F))
    return "".join(digits)


def bcd_to_datetime(bcd: bytes) -> datetime:
    s = bcd_to_phone(bcd).zfill(12)
    try:
        return datetime.strptime(s, "%y%m%d%H%M%S").replace(tzinfo=dt_timezone.utc)
    except ValueError:
        return timezone.now()


def extract_packets(buffer: bytearray) -> tuple[list[bytes], bytearray]:
    """Split buffer into complete JT808 frames (0x7E ... 0x7E)."""
    packets: list[bytes] = []
    while True:
        start = buffer.find(b"\x7E")
        if start == -1:
            return packets, buffer
        end = buffer.find(b"\x7E", start + 1)
        if end == -1:
            return packets, buffer[start:]
        inner = bytes(buffer[start + 1 : end])
        del buffer[: end + 1]
        if inner:
            packets.append(inner)
    return packets, buffer


def parse_tlv_extensions(body: bytes, offset: int) -> dict:
    extras: dict = {}
    dtc_codes: list[str] = []
    pos = offset
    while pos + 2 <= len(body):
        tag = body[pos]
        length = body[pos + 1]
        pos += 2
        if pos + length > len(body):
            break
        value = body[pos : pos + length]
        pos += length

        if tag == 0x01 and length == 4:
            extras["odometer"] = struct.unpack(">I", value)[0] / 10.0
        elif tag == 0x82 and length == 2:
            extras["battery_voltage"] = struct.unpack(">H", value)[0] / 10.0
        elif tag == 0x30 and length == 1:
            extras["signal_percent"] = value[0]
        elif tag == 0x02 and length == 2:
            extras["fuel_level"] = struct.unpack(">H", value)[0] / 10.0
        elif tag == 0x03 and length == 2:
            extras["rpm"] = float(struct.unpack(">H", value)[0])
        elif tag == 0x04 and length == 1:
            extras["coolant_temperature"] = float(value[0] - 40)
        elif tag == 0x06 and length == 1:
            extras["throttle_position"] = float(value[0])
        elif tag == 0x07 and length == 1:
            extras["engine_load"] = float(value[0])
        elif tag == 0x05 and length >= 2:
            for i in range(0, length, 2):
                code_val = struct.unpack(">H", value[i : i + 2])[0]
                code = DTC_HEX_TO_CODE.get(code_val)
                if code:
                    dtc_codes.append(code)
                else:
                    dtc_codes.append(f"P{code_val:04X}")

    if dtc_codes:
        extras["dtc_codes"] = dtc_codes
    return extras


class JT808Parser(TelemetryParser):
    protocol = "JT808"

    def parse(self, payload: bytes) -> NormalizedTelemetry:
        if not isinstance(payload, (bytes, bytearray)):
            raise ValueError("JT808 payload must be bytes.")

        raw = unescape_jt808(payload)
        if len(raw) < 13:
            raise ValueError("JT808 packet too short.")

        payload_body = raw[:-1]  # drop checksum byte
        msg_id, body_attr = struct.unpack(">HH", payload_body[:4])
        phone_bcd = payload_body[4:10]
        terminal_phone = bcd_to_phone(phone_bcd)
        if len(terminal_phone) < 12:
            terminal_phone = terminal_phone.zfill(12)
        body = payload_body[12:]

        if msg_id != 0x0200 or len(body) < 28:
            raise ValueError(f"Unsupported JT808 message: 0x{msg_id:04X}")

        alarm, status, lat_raw, lng_raw, altitude, speed_raw = struct.unpack(
            ">IIIIHH", body[:20]
        )
        direction = struct.unpack(">H", body[20:22])[0]
        ts = bcd_to_datetime(body[22:28])

        latitude = lat_raw / 1_000_000.0
        longitude = lng_raw / 1_000_000.0
        speed = speed_raw / 10.0

        extras = parse_tlv_extensions(body, 28)
        ignition = bool(status & 0x01)

        return NormalizedTelemetry(
            serial_number=terminal_phone,
            timestamp=ts,
            latitude=latitude,
            longitude=longitude,
            speed=speed,
            heading=float(direction),
            rpm=extras.get("rpm"),
            coolant_temperature=extras.get("coolant_temperature"),
            engine_load=extras.get("engine_load"),
            throttle_position=extras.get("throttle_position"),
            battery_voltage=extras.get("battery_voltage"),
            fuel_level=extras.get("fuel_level"),
            odometer=extras.get("odometer"),
            ignition=ignition,
            dtc_codes=extras.get("dtc_codes", []),
            raw_payload={
                "protocol": "JT808",
                "msg_id": f"0x{msg_id:04X}",
                "terminal_phone": terminal_phone,
                "alarm": alarm,
                "status": status,
                "altitude": altitude,
                "direction": direction,
                "tlv": extras,
                "packet_hex": bytes(payload)[:128].hex() if payload else "",
            },
        )

    def validate(self, data: NormalizedTelemetry) -> None:
        if not data.serial_number:
            raise ValueError("terminal_phone is required.")
