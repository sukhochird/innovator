#!/usr/bin/env python3
"""
JT808 Hardware Device & OBD2 Scanner Simulator (Python 3)

Simulates physical GPS/OBD2 terminals sending JT808 0x0200 packets.
Vehicles drive along realistic Ulaanbaatar road networks with realistic
ignition states (ACC ON/OFF), engine RPM, telemetry diagnostics, and smooth motion.

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
INTERVAL = float(os.environ.get("INTERVAL", "2.0"))
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
    now = datetime.datetime.now(datetime.timezone.utc)
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
    ignition=True,
    dtc_codes=None,
    phone_override=None,
):
    alarm_flag = 0x00000000
    # Bit 0: ACC (Ignition) — 1 = ON, 0 = OFF
    # Bit 1: Positioning — 1 = Valid GPS fix
    acc_bit = 1 if ignition else 0
    status_flag = 0x00000002 | acc_bit

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


def _interpolate_waypoints(waypoints, steps_per_segment=35):
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


def generate_peace_avenue_loop():
    """Route along Peace Avenue, Sukhbaatar Square, and Central UB arteries."""
    waypoints = [
        (47.918800, 106.917600),  # Sukhbaatar Square
        (47.919200, 106.924500),  # Peace Ave East (towards Wrestling Palace)
        (47.919500, 106.932000),  # Peace Ave / East Crossroads
        (47.924800, 106.931500),  # North to Beijing Street
        (47.925500, 106.922000),  # Beijing Street West towards Embassy area
        (47.925200, 106.914000),  # Near Government Palace North
        (47.921500, 106.910000),  # West to Flower Center / Peace Ave
        (47.918200, 106.905000),  # State Department Store (Ikh Delguur)
        (47.915000, 106.906000),  # South to Seoul Street
        (47.914200, 106.915000),  # Seoul Street East towards Children's Park
        (47.915500, 106.921000),  # Shangri-La / Olympic Street
        (47.918000, 106.918500),  # North back to Sukhbaatar Square
    ]
    return _interpolate_waypoints(waypoints, steps_per_segment=30)


def generate_seoul_street_loop():
    """Loop covering Seoul Street, Olympic Street, Peace Bridge area."""
    waypoints = [
        (47.914200, 106.915000),  # Seoul Street Center
        (47.913500, 106.923000),  # Olympic Street corner
        (47.908000, 106.922500),  # South towards Peace Bridge
        (47.905500, 106.917000),  # Khan-Uul entrance
        (47.907000, 106.911000),  # West bank along river
        (47.912500, 106.910000),  # North towards Drama Theatre
        (47.914500, 106.912000),  # Central park west
    ]
    return _interpolate_waypoints(waypoints, steps_per_segment=32)


def generate_outer_ring_loop():
    """Larger circuit representing Transit / Delivery delivery routes."""
    waypoints = [
        (47.931000, 106.916000),  # North Ikh Toiruu
        (47.930000, 106.932000),  # North-East Ring
        (47.922000, 106.940000),  # Sansar / East Ring
        (47.914000, 106.938000),  # South-East near Sun Road (Narny Zam)
        (47.911000, 106.923000),  # Sun Road / Narny Zam Central
        (47.910000, 106.903000),  # West Sun Road
        (47.917000, 106.895000),  # West Ring (Baruun 4 Zam)
        (47.926000, 106.902000),  # Tasganii Ovoo / North-West
    ]
    return _interpolate_waypoints(waypoints, steps_per_segment=40)


def generate_orbit_route(center_lat, center_lng, radius_lat, radius_lng, num_steps=180, phase=0.0):
    """Elliptical circuit around reference center."""
    points = []
    for i in range(num_steps):
        angle = (2 * math.pi / num_steps) * i + phase
        lat = center_lat + radius_lat * math.sin(angle)
        lng = center_lng + radius_lng * math.cos(angle)
        lat += 0.00012 * math.sin(3 * angle)
        lng += 0.00015 * math.cos(2 * angle)
        points.append((lat, lng))
    return points


def generate_static_point(lat, lng):
    """Static coordinates for idle / parked vehicles."""
    return [(lat, lng)]


SIMULATED_FLEET = [
    {
        "phone": "013800138000",
        "plate": "UBX-1234",
        "model": "Toyota Prius",
        "scenario": "moving_active",
        "initial_mileage": 14250.0,
        "route_type": "peace_ave",
        "phase": 0.0,
        "dtc_list": [],
    },
    {
        "phone": "013800138001",
        "plate": "UBX-5678",
        "model": "Honda Civic",
        "scenario": "moving_active",
        "initial_mileage": 21850.0,
        "route_type": "seoul_st",
        "phase": 0.4,
        "dtc_list": [],
    },
    {
        "phone": "013800138002",
        "plate": "UBX-9012",
        "model": "Ford Transit",
        "scenario": "moving_active",
        "initial_mileage": 58900.0,
        "route_type": "outer_ring",
        "phase": 0.8,
        "dtc_list": [],
    },
    {
        "phone": "013800138003",
        "plate": "UBX-3456",
        "model": "Mercedes Sprinter",
        "scenario": "stopped",  # Parked with Engine/Ignition OFF
        "initial_mileage": 43200.0,
        "lat": 47.927500,
        "lng": 106.908000,
        "dtc_list": [],
    },
    {
        "phone": "013800138005",
        "plate": "UBX-2345",
        "model": "Toyota Camry",
        "scenario": "alert",  # Engine ON, has DTC alert
        "initial_mileage": 31400.0,
        "route_type": "orbit_inner",
        "radius_lat": 0.0035,
        "radius_lng": 0.0048,
        "phase": 1.2,
        "dtc_list": ["P0420"],
    },
    {
        "phone": "013800138006",
        "plate": "UBX-6789",
        "model": "Hyundai Tucson",
        "scenario": "moving_active",
        "initial_mileage": 19700.0,
        "route_type": "orbit_wide",
        "radius_lat": 0.0050,
        "radius_lng": 0.0068,
        "phase": 2.1,
        "dtc_list": [],
    },
    {
        "phone": "013800138007",
        "plate": "UBX-0123",
        "model": "BMW X5",
        "scenario": "idle",  # Idling at VIP entrance with Engine/Ignition ON, 0 km/h, RPM ~780
        "initial_mileage": 28100.0,
        "lat": 47.915800,
        "lng": 106.920500,  # Near Shangri-La
        "dtc_list": [],
    },
    {
        "phone": "013800138009",
        "plate": "UBX-8901",
        "model": "Lexus RX350",
        "scenario": "moving_active",
        "initial_mileage": 16400.0,
        "route_type": "orbit_inner",
        "radius_lat": 0.0042,
        "radius_lng": 0.0058,
        "phase": 3.4,
        "dtc_list": [],
    },
]


def _distance_km(lat1, lng1, lat2, lng2):
    d_lat = (lat2 - lat1) * 111.0
    d_lng = (lng2 - lng1) * 111.0 * math.cos(math.radians(lat1))
    return math.sqrt(d_lat * d_lat + d_lng * d_lng)


def get_vehicle_route(v_info):
    scenario = v_info.get("scenario", "moving_active")
    if scenario in ("idle", "stopped"):
        lat = v_info.get("lat", UB_CENTER_LAT)
        lng = v_info.get("lng", UB_CENTER_LNG)
        return generate_static_point(lat, lng)

    rtype = v_info.get("route_type", "peace_ave")
    if rtype == "peace_ave":
        return generate_peace_avenue_loop()
    if rtype == "seoul_st":
        return generate_seoul_street_loop()
    if rtype == "outer_ring":
        return generate_outer_ring_loop()

    r_lat = v_info.get("radius_lat", 0.004)
    r_lng = v_info.get("radius_lng", 0.0055)
    phase = v_info.get("phase", 0.0)
    return generate_orbit_route(UB_CENTER_LAT, UB_CENTER_LNG, r_lat, r_lng, phase=phase)


def simulate_vehicle(v_info, route_points):
    phone = v_info["phone"]
    plate = v_info["plate"]
    model = v_info["model"]
    scenario = v_info.get("scenario", "moving_active")

    route_len = len(route_points)
    route_index = int((v_info.get("phase", 0.0) / (2 * math.pi)) * route_len) % route_len if route_len > 1 else 0
    seq = 1
    total_mileage = v_info["initial_mileage"]
    fuel_level = 82.0
    coolant_temp = 89.0
    current_speed = 0.0
    target_speed = 42.0
    idle_pause_packets = 0

    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((SERVER_HOST, SERVER_PORT))
            print(f"[{plate}] Connected → {SERVER_HOST}:{SERVER_PORT}")
            break
        except Exception as e:
            print(f"[{plate}] Connection failed: {e}. Retrying in 3s...")
            time.sleep(3)

    try:
        while True:
            curr_lat, curr_lng = route_points[route_index]

            if route_len > 1:
                next_index = (route_index + 1) % route_len
                next_lat, next_lng = route_points[next_index]
                d_lat = next_lat - curr_lat
                d_lng = next_lng - curr_lng
                heading_rad = math.atan2(d_lng, d_lat)
                heading_deg = (math.degrees(heading_rad) + 360) % 360
            else:
                heading_deg = 0.0

            # State logic
            if scenario == "stopped":
                # Parked, Ignition OFF
                ignition = False
                speed_kmh = 0.0
                engine_rpm = 0
                battery_v = 12.4
                signal_pct = 85
                coolant_temp = max(22.0, coolant_temp - 0.1)
                throttle_pct = 0
                load_pct = 0

            elif scenario == "idle":
                # Stopped at curb/VIP, Engine running, Ignition ON
                ignition = True
                speed_kmh = 0.0
                engine_rpm = int(760 + 25 * math.sin(seq * 0.2))
                battery_v = 13.9 + 0.1 * math.sin(seq * 0.1)
                signal_pct = 95
                coolant_temp = 88.0 + 1.0 * math.sin(seq * 0.05)
                throttle_pct = 0
                load_pct = 14
                fuel_level = max(5.0, fuel_level - 0.002)

            else:
                # Active moving with realistic red-light stops and acceleration
                ignition = True
                # Periodic red light stop every ~35 packets
                if seq > 10 and seq % 35 == 0 and idle_pause_packets == 0:
                    idle_pause_packets = 4  # Stop for ~8 seconds

                if idle_pause_packets > 0:
                    idle_pause_packets -= 1
                    target_speed = 0.0
                    current_speed = max(0.0, current_speed - 15.0)
                else:
                    target_speed = 36.0 + 18.0 * math.sin(seq * 0.14)
                    current_speed = current_speed + (target_speed - current_speed) * 0.35

                speed_kmh = max(0.0, current_speed)

                if speed_kmh < 1.0:
                    # Idling at traffic light: engine still on!
                    engine_rpm = int(780 + 30 * math.sin(seq * 0.3))
                    throttle_pct = 0
                    load_pct = 16
                else:
                    engine_rpm = int(1100 + (speed_kmh / 65.0) * 2200 + 80 * math.sin(seq * 0.4))
                    throttle_pct = int(12 + (speed_kmh / 65.0) * 45)
                    load_pct = int(20 + (speed_kmh / 65.0) * 40)

                total_mileage += speed_kmh * (INTERVAL / 3600.0)
                battery_v = 14.1 + 0.2 * math.sin(seq * 0.15)
                signal_pct = min(100, max(75, int(92 + 8 * math.sin(seq * 0.08))))

                if v_info.get("scenario") == "alert":
                    coolant_temp = 106.5 + 2.0 * math.sin(seq * 0.1)
                else:
                    coolant_temp = 89.0 + 2.0 * math.sin(seq * 0.08)

                fuel_level = max(5.0, fuel_level - 0.008)

            altitude = 1285 + 6 * math.sin(route_index * 0.05)
            dtc_codes = v_info.get("dtc_list", [])

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
                ignition=ignition,
                dtc_codes=dtc_codes,
                phone_override=phone,
            )

            sock.sendall(packet)

            acc_str = "🟢 ACC ON" if ignition else "⚪ ACC OFF"
            status_desc = "MOVING" if speed_kmh > 5 else ("IDLE" if ignition else "STOPPED")
            dtc_str = f" ⚠ DTC {dtc_codes}" if dtc_codes else ""
            print(
                f"[{time.strftime('%H:%M:%S')}] [{plate}] #{seq:04d} | "
                f"{curr_lat:.6f}, {curr_lng:.6f} | {speed_kmh:4.1f} km/h | {heading_deg:3.0f}° | "
                f"{acc_str} ({status_desc}, {engine_rpm} RPM){dtc_str}"
            )

            sock.settimeout(1.5)
            try:
                sock.recv(1024)
            except socket.timeout:
                pass

            seq += 1
            if route_len > 1 and speed_kmh > 0.5:
                route_index = next_index

            time.sleep(INTERVAL)

    except Exception as e:
        print(f"[{plate}] Error: {e}")
    finally:
        sock.close()


def main():
    print("=" * 76)
    print(" CARQ JT808 Multi-Vehicle Fleet Simulator (Ulaanbaatar Realtime Routes)")
    print(f" Server       : {SERVER_HOST}:{SERVER_PORT}")
    print(f" Interval     : {INTERVAL}s")
    print(f" Map center   : {UB_CENTER_LAT:.6f}°N, {UB_CENTER_LNG:.6f}°E")
    print(f" Active Fleet : {len(SIMULATED_FLEET)} vehicles")
    print("=" * 76)

    threads = []
    for v in SIMULATED_FLEET:
        route_points = get_vehicle_route(v)
        t = threading.Thread(target=simulate_vehicle, args=(v, route_points), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.2)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")


if __name__ == "__main__":
    main()
