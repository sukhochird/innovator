#!/usr/bin/env python3
"""
JT808 Hardware Device & OBD2 Scanner Simulator (Python 3)

Simulates physical GPS/OBD2 terminals sending JT808 0x0200 packets.
Vehicles orbit Ulaanbaatar city center leaving a visible GPS track on the fleet map.

Default map center (CARQ): 47.921483°N, 106.916858°E
"""

import socket
import struct
import time
import math
import datetime
import os
import threading

SERVER_HOST = os.environ.get("SERVER_HOST", "127.0.0.1")
SERVER_PORT = int(os.environ.get("SERVER_PORT", "8080"))
INTERVAL = float(os.environ.get("INTERVAL", "3"))
DEVICE_PHONE = "013800138000"

# Ulaanbaatar city center — matches frontend DEFAULT_MAP_CENTER
UB_CENTER_LAT = float(os.environ.get("UB_CENTER_LAT", "47.921482718244036"))
UB_CENTER_LNG = float(os.environ.get("UB_CENTER_LNG", "106.91685752514958"))


def string_to_bcd(phone_str):
    phone_str = phone_str.zfill(12)
    bcd_bytes = bytearray()
    for i in range(0, 12, 2):
        high = int(phone_str[i])
        low = int(phone_str[i + 1])
        bcd_bytes.append((high << 4) | low)
    return bytes(bcd_bytes)


def compute_xor_checksum(data_bytes):
    checksum = 0
    for b in data_bytes:
        checksum ^= b
    return checksum


def escape_jt808(data_bytes):
    escaped = bytearray()
    for b in data_bytes:
        if b == 0x7E:
            escaped.extend([0x7D, 0x02])
        elif b == 0x7D:
            escaped.extend([0x7D, 0x01])
        else:
            escaped.append(b)
    return bytes(escaped)


def get_current_bcd_time():
    now = datetime.datetime.now()
    time_str = now.strftime("%y%m%d%H%M%S")
    return string_to_bcd(time_str)


def build_0200_packet(
    msg_seq,
    lat,
    lng,
    speed_kmh,
    direction,
    altitude,
    mileage_km,
    battery_v,
    signal_percent,
    rpm,
    coolant_c,
    fuel_pct,
    throttle_pct,
    load_pct,
    dtc_codes=None,
    phone_override=None,
):
    alarm_flag = 0x00000000
    status_flag = 0x00000003 if speed_kmh >= 1 else 0x00000002

    lat_raw = int(abs(lat) * 1000000)
    lng_raw = int(abs(lng) * 1000000)
    altitude_m = int(altitude)
    speed_raw = int(max(0, speed_kmh) * 10)
    dir_raw = int(direction) % 360
    bcd_time = get_current_bcd_time()

    body = bytearray()
    body.extend(struct.pack(">IIIIHH", alarm_flag, status_flag, lat_raw, lng_raw, altitude_m, speed_raw))
    body.extend(struct.pack(">H", dir_raw))
    body.extend(bcd_time)

    body.extend(struct.pack(">BB I", 0x01, 4, int(mileage_km * 10)))
    body.extend(struct.pack(">BB H", 0x82, 2, int(battery_v * 10)))
    body.extend(struct.pack(">BB B", 0x30, 1, int(signal_percent)))
    body.extend(struct.pack(">BB H", 0x02, 2, int(fuel_pct * 10)))
    body.extend(struct.pack(">BB H", 0x03, 2, int(rpm)))
    body.extend(struct.pack(">BB B", 0x04, 1, int(coolant_c + 40)))
    body.extend(struct.pack(">BB B", 0x06, 1, int(throttle_pct)))
    body.extend(struct.pack(">BB B", 0x07, 1, int(load_pct)))

    if dtc_codes:
        dtc_bytes = bytearray()
        dtc_map = {"P0300": 0x0300, "P0171": 0x0171, "P0420": 0x0420, "P0115": 0x0115}
        for code in dtc_codes:
            if code in dtc_map:
                dtc_bytes.extend(struct.pack(">H", dtc_map[code]))
        if dtc_bytes:
            body.extend(struct.pack(">BB", 0x05, len(dtc_bytes)))
            body.extend(dtc_bytes)

    msg_id = 0x0200
    body_len = len(body)
    msg_body_attr = body_len & 0x03FF
    target_phone = phone_override or DEVICE_PHONE
    phone_bcd = string_to_bcd(target_phone)

    header = bytearray()
    header.extend(struct.pack(">HH", msg_id, msg_body_attr))
    header.extend(phone_bcd)
    header.extend(struct.pack(">H", msg_seq & 0xFFFF))

    payload = header + body
    checksum = compute_xor_checksum(payload)
    payload_with_cs = payload + bytes([checksum])
    escaped_payload = escape_jt808(payload_with_cs)
    return b"\x7E" + escaped_payload + b"\x7E"


def _lerp(a, b, t):
    return a + (b - a) * t


def _interpolate_waypoints(waypoints, steps_per_segment=25):
    """Smooth GPS polyline between waypoints (closed loop)."""
    if len(waypoints) < 2:
        return list(waypoints)
    points = []
    n = len(waypoints)
    for i in range(n):
        lat1, lng1 = waypoints[i]
        lat2, lng2 = waypoints[(i + 1) % n]
        for s in range(steps_per_segment):
            t = s / steps_per_segment
            lat = _lerp(lat1, lat2, t)
            lng = _lerp(lng1, lng2, t)
            points.append((lat, lng))
    return points


def generate_orbit_route(center_lat, center_lng, radius_lat, radius_lng, num_steps=200, phase=0.0):
    """Elliptical orbit — leaves a clean circular track around UB center."""
    points = []
    for i in range(num_steps):
        angle = (2 * math.pi / num_steps) * i + phase
        lat = center_lat + radius_lat * math.sin(angle)
        lng = center_lng + radius_lng * math.cos(angle)
        lat += 0.00015 * math.sin(3 * angle)
        lng += 0.00018 * math.cos(2 * angle)
        points.append((lat, lng))
    return points


def generate_city_loop_route(center_lat=UB_CENTER_LAT, center_lng=UB_CENTER_LNG):
    """
    Approximate loop around central Ulaanbaatar (Sukhbaatar / Peace Ave area).
    All coordinates relative to the CARQ map default center.
    """
    dlat = 0.0045
    dlng = 0.0065
    waypoints = [
        (center_lat, center_lng),
        (center_lat + dlat * 0.3, center_lng + dlng * 0.5),
        (center_lat + dlat * 0.8, center_lng + dlng * 0.9),
        (center_lat + dlat, center_lng + dlng * 0.3),
        (center_lat + dlat * 0.9, center_lng - dlng * 0.2),
        (center_lat + dlat * 0.4, center_lng - dlng * 0.9),
        (center_lat - dlat * 0.2, center_lng - dlng * 0.85),
        (center_lat - dlat * 0.7, center_lng - dlng * 0.3),
        (center_lat - dlat * 0.85, center_lng + dlng * 0.35),
        (center_lat - dlat * 0.35, center_lng + dlng * 0.95),
    ]
    return _interpolate_waypoints(waypoints, steps_per_segment=28)


def generate_vehicle_route(v_info):
    """Per-vehicle route around UB center — different orbit so tracks don't overlap."""
    idx = v_info.get("route_style", "orbit")
    phase = v_info.get("phase", 0.0)

    if idx == "city":
        return generate_city_loop_route()

    radius_lat = v_info.get("radius_lat", 0.004)
    radius_lng = v_info.get("radius_lng", 0.0055)
    return generate_orbit_route(
        UB_CENTER_LAT,
        UB_CENTER_LNG,
        radius_lat=radius_lat,
        radius_lng=radius_lng,
        num_steps=v_info.get("route_steps", 200),
        phase=phase,
    )


SIMULATED_FLEET = [
    {
        "phone": "013800138000",
        "plate": "UBX-1234",
        "model": "Toyota Prius",
        "offset_index": 0,
        "initial_mileage": 12450.0,
        "dtc_trigger_seq": 5,
        "dtc_list": ["P0300", "P0171"],
        "route_style": "city",
        "phase": 0.0,
    },
    {
        "phone": "013800138001",
        "plate": "UBX-5678",
        "model": "Honda Civic",
        "offset_index": 0,
        "initial_mileage": 12550.0,
        "dtc_trigger_seq": 8,
        "dtc_list": ["P0420"],
        "route_style": "orbit",
        "radius_lat": 0.0035,
        "radius_lng": 0.005,
        "phase": math.pi * 0.66,
    },
    {
        "phone": "013800138002",
        "plate": "UBX-9012",
        "model": "Ford Transit",
        "offset_index": 0,
        "initial_mileage": 12650.0,
        "dtc_trigger_seq": 999,
        "dtc_list": [],
        "route_style": "orbit",
        "radius_lat": 0.0055,
        "radius_lng": 0.0075,
        "phase": math.pi * 1.33,
    },
]


def _distance_km(lat1, lng1, lat2, lng2):
    d_lat = (lat2 - lat1) * 111.0
    d_lng = (lng2 - lng1) * 111.0 * math.cos(math.radians(lat1))
    return math.sqrt(d_lat * d_lat + d_lng * d_lng)


def simulate_vehicle(v_info, route_points):
    phone = v_info["phone"]
    plate = v_info["plate"]
    model = v_info["model"]
    route_index = v_info["offset_index"] % len(route_points)
    seq = 1
    total_mileage = v_info["initial_mileage"]
    fuel_level = 78.5
    coolant_temp = 72.0
    idle_steps_left = 0

    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((SERVER_HOST, SERVER_PORT))
            print(f" [{plate}] Connected → {SERVER_HOST}:{SERVER_PORT}")
            break
        except Exception as e:
            print(f" [{plate}] Connection failed: {e}. Retry in 3s...")
            time.sleep(3)

    try:
        while True:
            curr_lat, curr_lng = route_points[route_index]
            next_index = (route_index + 1) % len(route_points)
            next_lat, next_lng = route_points[next_index]

            d_lat = next_lat - curr_lat
            d_lng = next_lng - curr_lng
            heading_rad = math.atan2(d_lng, d_lat)
            heading_deg = (math.degrees(heading_rad) + 360) % 360

            step_dist_km = _distance_km(curr_lat, curr_lng, next_lat, next_lng)

            # Brief idle stops ~every 40 packets (realistic STOPPED/IDLE on map)
            if idle_steps_left > 0:
                speed_kmh = 0.0
                idle_steps_left -= 1
            else:
                speed_kmh = (step_dist_km / INTERVAL) * 3600.0
                speed_kmh = max(18.0, min(72.0, speed_kmh + 5 * math.sin(seq * 0.17)))
                if seq > 10 and seq % 40 == 0:
                    idle_steps_left = 3
                    speed_kmh = 0.0

            total_mileage += speed_kmh * (INTERVAL / 3600.0)
            altitude = 1280 + 8 * math.sin(route_index * 0.08)
            battery_v = 12.4 + 0.3 * math.sin(seq * 0.2)
            signal_pct = min(100, max(65, 88 + int(10 * math.cos(seq * 0.12))))

            if speed_kmh < 1:
                engine_rpm = 750 + int(50 * math.sin(seq * 0.3))
            else:
                engine_rpm = int(900 + (speed_kmh / 72.0) * 2600 + 120 * math.sin(seq * 0.5))

            if coolant_temp < 88:
                coolant_temp += 0.25
            elif speed_kmh > 50:
                coolant_temp = min(92, coolant_temp + 0.05)

            fuel_level = max(5.0, fuel_level - 0.012)
            throttle_pct = int(8 + (speed_kmh / 72.0) * 42) if speed_kmh >= 1 else 0
            load_pct = int(15 + (speed_kmh / 72.0) * 38) if speed_kmh >= 1 else 12

            dtc_codes = v_info["dtc_list"] if seq >= v_info["dtc_trigger_seq"] else []

            packet = build_0200_packet(
                msg_seq=seq,
                lat=curr_lat,
                lng=curr_lng,
                speed_kmh=speed_kmh,
                direction=heading_deg,
                altitude=altitude,
                mileage_km=total_mileage,
                battery_v=battery_v,
                signal_percent=signal_pct,
                rpm=engine_rpm,
                coolant_c=coolant_temp,
                fuel_pct=fuel_level,
                throttle_pct=throttle_pct,
                load_pct=load_pct,
                dtc_codes=dtc_codes,
                phone_override=phone,
            )

            sock.sendall(packet)
            dtc_str = f"⚠ DTC {dtc_codes}" if dtc_codes else "OK"
            gps_str = f"{curr_lat:.6f}, {curr_lng:.6f}"
            print(
                f"[{time.strftime('%H:%M:%S')}] [{plate}] #{seq:04d} | "
                f"{gps_str} | {speed_kmh:.0f} km/h | {heading_deg:.0f}° | {dtc_str}"
            )

            sock.settimeout(2.0)
            try:
                sock.recv(1024)
            except socket.timeout:
                pass

            seq += 1
            if speed_kmh >= 1:
                route_index = next_index
            time.sleep(INTERVAL)

    except Exception as e:
        print(f" [{plate}] Error: {e}")
    finally:
        sock.close()


def main():
    print("=" * 72)
    print(" JT808 Fleet Simulator → CARQ (Ulaanbaatar center track)")
    print(f" Server       : {SERVER_HOST}:{SERVER_PORT}")
    print(f" Interval     : {INTERVAL}s")
    print(f" Map center   : {UB_CENTER_LAT:.6f}°N, {UB_CENTER_LNG:.6f}°E")
    print(f" Fleet size   : {len(SIMULATED_FLEET)} vehicles")
    for v in SIMULATED_FLEET:
        route = generate_vehicle_route(v)
        print(f"   • {v['plate']} ({v['model']}) phone={v['phone']} route_pts={len(route)}")
    print("=" * 72)

    threads = []
    for v in SIMULATED_FLEET:
        route_points = generate_vehicle_route(v)
        t = threading.Thread(target=simulate_vehicle, args=(v, route_points), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.5)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")


if __name__ == "__main__":
    main()
