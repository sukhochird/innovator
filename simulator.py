#!/usr/bin/env python3
"""
JT808 Hardware Device & OBD2 Scanner Simulator (Python 3)

Simulates a physical vehicle GPS/OBD2 terminal communicating with the Node.js JT808 TCP server.
Sends valid binary JT808 packets with:
- GPS Location (Lat, Lng, Speed, Altitude, Direction, Timestamp)
- Basic Telemetry (Mileage 0x01, Battery Voltage 0x82, Signal 0x30)
- OBD2 Engine Diagnostics (Fuel Level 0x02, Engine RPM 0x03, Coolant Temp 0x04, Throttle 0x06, Load 0x07)
- OBD2 Diagnostic Trouble Codes / DTC Fault Codes (0x05, e.g. P0300, P0171)
"""

import socket
import struct
import time
import math
import datetime
import os

SERVER_HOST = os.environ.get("SERVER_HOST", "127.0.0.1")
SERVER_PORT = int(os.environ.get("SERVER_PORT", "8080"))
INTERVAL = float(os.environ.get("INTERVAL", "3"))
DEVICE_PHONE = "013800138000"  # 12-digit BCD Terminal Phone ID

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

def build_0200_packet(msg_seq, lat, lng, speed_kmh, direction, altitude, mileage_km, battery_v, signal_percent, rpm, coolant_c, fuel_pct, throttle_pct, load_pct, dtc_codes=None, phone_override=None):
    """Build a complete binary JT808 0x0200 Location + OBD2 Diagnostic Report packet."""
    
    # 1. Base 0x0200 Body (28 bytes)
    alarm_flag = 0x00000000
    status_flag = 0x00000003  # Bit 0: ACC ON, Bit 1: GPS Valid (3D Fix)
    
    lat_raw = int(abs(lat) * 1000000)
    lng_raw = int(abs(lng) * 1000000)
    altitude_m = int(altitude)
    speed_raw = int(speed_kmh * 10)
    dir_raw = int(direction) % 360
    bcd_time = get_current_bcd_time()

    body = bytearray()
    body.extend(struct.pack(">IIIIHH", alarm_flag, status_flag, lat_raw, lng_raw, altitude_m, speed_raw))
    body.extend(struct.pack(">H", dir_raw))
    body.extend(bcd_time)

    # 2. Basic Telemetry TLVs
    # TLV 0x01: Mileage (4 bytes uint32 BE, 1/10 km)
    body.extend(struct.pack(">BB I", 0x01, 4, int(mileage_km * 10)))

    # TLV 0x82: Battery Voltage (2 bytes uint16 BE, 0.1V)
    body.extend(struct.pack(">BB H", 0x82, 2, int(battery_v * 10)))

    # TLV 0x30: Cellular Signal Strength (1 byte uint8, percentage)
    body.extend(struct.pack(">BB B", 0x30, 1, int(signal_percent)))

    # 3. OBD2 Diagnostic Telemetry TLVs
    # TLV 0x02: Fuel Level (2 bytes uint16 BE, 0.1%)
    body.extend(struct.pack(">BB H", 0x02, 2, int(fuel_pct * 10)))

    # TLV 0x03: Engine Speed RPM (2 bytes uint16 BE)
    body.extend(struct.pack(">BB H", 0x03, 2, int(rpm)))

    # TLV 0x04: Coolant Temperature (1 byte uint8, offset -40 -> temp + 40)
    body.extend(struct.pack(">BB B", 0x04, 1, int(coolant_c + 40)))

    # TLV 0x06: Throttle Position (1 byte uint8, %)
    body.extend(struct.pack(">BB B", 0x06, 1, int(throttle_pct)))

    # TLV 0x07: Engine Load (1 byte uint8, %)
    body.extend(struct.pack(">BB B", 0x07, 1, int(load_pct)))

    # TLV 0x05: Active DTC Diagnostic Fault Codes (2 bytes per DTC)
    if dtc_codes and len(dtc_codes) > 0:
        dtc_bytes = bytearray()
        for code in dtc_codes:
            if code == 'P0300':
                dtc_bytes.extend(struct.pack(">H", 0x0300))
            elif code == 'P0171':
                dtc_bytes.extend(struct.pack(">H", 0x0171))
            elif code == 'P0420':
                dtc_bytes.extend(struct.pack(">H", 0x0420))
            elif code == 'P0115':
                dtc_bytes.extend(struct.pack(">H", 0x0115))
        
        if len(dtc_bytes) > 0:
            body.extend(struct.pack(">BB", 0x05, len(dtc_bytes)))
            body.extend(dtc_bytes)

    # 4. Header Construction (12 bytes)
    msg_id = 0x0200
    body_len = len(body)
    msg_body_attr = body_len & 0x03FF
    target_phone = phone_override if phone_override else DEVICE_PHONE
    phone_bcd = string_to_bcd(target_phone)

    header = bytearray()
    header.extend(struct.pack(">HH", msg_id, msg_body_attr))
    header.extend(phone_bcd)
    header.extend(struct.pack(">H", msg_seq & 0xFFFF))

    # 5. Checksum & Escape Framing
    payload = header + body
    checksum = compute_xor_checksum(payload)
    payload_with_cs = payload + bytes([checksum])
    
    escaped_payload = escape_jt808(payload_with_cs)

    full_packet = b'\x7E' + escaped_payload + b'\x7E'
    return full_packet

def generate_vehicle_route():
    # Ulaanbaatar, Mongolia — matches CARQ demo fleet map
    center_lat, center_lng = 47.918, 106.917
    points = []
    num_steps = 120
    radius_lat = 0.008
    radius_lng = 0.012

    for i in range(num_steps):
        angle = (2 * math.pi / num_steps) * i
        lat = center_lat + radius_lat * math.sin(angle) + 0.001 * math.sin(3 * angle)
        lng = center_lng + radius_lng * math.cos(angle) + 0.001 * math.cos(2 * angle)
        points.append((lat, lng))
    return points

import threading

SIMULATED_FLEET = [
    {
        "phone": "013800138000",
        "plate": "2388 УНР",
        "model": "Lexus CT200h",
        "offset_index": 0,
        "initial_mileage": 1245.0,
        "dtc_trigger_seq": 5,
        "dtc_list": ['P0300', 'P0171']
    },
    {
        "phone": "013800138001",
        "plate": "1102 УБА",
        "model": "Hyundai Porter II",
        "offset_index": 35,
        "initial_mileage": 4820.5,
        "dtc_trigger_seq": 8,
        "dtc_list": ['P0420']
    },
    {
        "phone": "013800138002",
        "plate": "5599 УБН",
        "model": "Toyota HiAce",
        "offset_index": 70,
        "initial_mileage": 8910.2,
        "dtc_trigger_seq": 999,
        "dtc_list": []
    }
]

def simulate_vehicle(v_info, route_points):
    phone = v_info["phone"]
    plate = v_info["plate"]
    model = v_info["model"]
    route_index = v_info["offset_index"] % len(route_points)
    seq = 1
    total_mileage = v_info["initial_mileage"]
    fuel_level = 78.5
    coolant_temp = 72.0

    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((SERVER_HOST, SERVER_PORT))
            print(f" [{plate}] Connected to TCP JT808 Server at {SERVER_HOST}:{SERVER_PORT}")
            break
        except Exception as e:
            print(f" [{plate}] Connection failed: {e}. Retrying in 3 seconds...")
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

            step_dist_km = math.sqrt((d_lat * 111)**2 + (d_lng * 111 * math.cos(math.radians(curr_lat)))**2)
            speed_kmh = (step_dist_km / 3.0) * 3600.0
            speed_kmh = max(20.0, min(85.0, speed_kmh))
            
            total_mileage += (speed_kmh * (3.0 / 3600.0))
            altitude = 42 + 5 * math.sin(route_index * 0.1)
            battery_v = 12.4 + 0.3 * math.sin(seq * 0.2)
            signal_pct = 90 + int(8 * math.cos(seq * 0.15))

            engine_rpm = int(800 + (speed_kmh / 90.0) * 2800 + 150 * math.sin(seq * 0.5))
            if coolant_temp < 90:
                coolant_temp += 0.3
            fuel_level = max(5.0, fuel_level - 0.015)
            throttle_pct = int(12 + (speed_kmh / 90.0) * 45 + 5 * math.cos(seq))
            load_pct = int(18 + (speed_kmh / 90.0) * 40 + 8 * math.sin(seq * 0.3))

            dtc_codes = []
            if seq >= v_info["dtc_trigger_seq"]:
                dtc_codes = v_info["dtc_list"]

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
                phone_override=phone
            )

            sock.sendall(packet)
            dtc_str = f"⚠️ DTC: {dtc_codes}" if dtc_codes else "OK"
            print(f"[{time.strftime('%H:%M:%S')}] [{plate} | {model}] Seq #{seq:04d} | Speed: {speed_kmh:.1f}km/h | RPM: {engine_rpm} | {dtc_str}")

            sock.settimeout(2.0)
            try:
                sock.recv(1024)
            except socket.timeout:
                pass

            seq += 1
            route_index = next_index
            time.sleep(INTERVAL)

    except Exception as e:
        print(f" [{plate}] Error: {e}")
    finally:
        sock.close()

def main():
    print("=" * 70)
    print(" JT808 Multi-Vehicle Fleet Simulator → CARQ Platform")
    print(f" Target Server: {SERVER_HOST}:{SERVER_PORT}")
    print(f" Interval     : {INTERVAL}s")
    print(f" Fleet Size   : {len(SIMULATED_FLEET)} Vehicles")
    for v in SIMULATED_FLEET:
        print(f"   • {v['plate']} ({v['model']}) - BCD Phone: {v['phone']}")
    print("=" * 70)

    route_points = generate_vehicle_route()
    threads = []
    for v in SIMULATED_FLEET:
        t = threading.Thread(target=simulate_vehicle, args=(v, route_points), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.5)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n Simulator stopped by user.")

if __name__ == "__main__":
    main()
