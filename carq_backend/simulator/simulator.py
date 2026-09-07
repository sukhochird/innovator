import math
import os
import random
import time
from datetime import datetime, timezone

import asyncio
import json

try:
    import websockets
except ImportError:
    websockets = None


class VehicleSimulator:
    def __init__(self, serial_number: str, scenario: str = "moving"):
        self.serial_number = serial_number
        self.scenario = scenario
        self.lat = 47.918 + random.uniform(-0.05, 0.05)
        self.lng = 106.917 + random.uniform(-0.05, 0.05)
        self.speed = 0.0
        self.rpm = 800.0
        self.coolant = 72.0
        self.battery = 13.2
        self.fuel = random.uniform(40, 90)
        self.heading = random.uniform(0, 360)
        self.odometer = random.uniform(1000, 50000)
        self.seq = 0

    def tick(self) -> dict:
        self.seq += 1
        if self.scenario == "moving":
            self.speed = min(85, max(20, self.speed + random.uniform(-2, 3)))
            self.rpm = 800 + (self.speed / 85) * 2800 + random.uniform(-100, 100)
            self.heading = (self.heading + random.uniform(-5, 5)) % 360
            rad = math.radians(self.heading)
            self.lat += math.cos(rad) * 0.0001 * (self.speed / 60)
            self.lng += math.sin(rad) * 0.0001 * (self.speed / 60)
            self.odometer += self.speed / 3600
            ignition = True
        elif self.scenario == "idle":
            self.speed = max(0, self.speed - 5) if self.speed > 0 else 0
            self.rpm = 850 + random.uniform(-50, 50)
            ignition = True
        elif self.scenario == "stopped":
            self.speed = 0
            self.rpm = 0
            ignition = False
        elif self.scenario == "offline":
            return None
        elif self.scenario == "alert":
            self.speed = min(75, max(30, self.speed + random.uniform(-1, 2)))
            self.rpm = 800 + (self.speed / 85) * 2800
            self.coolant = min(115, self.coolant + 0.5)
            ignition = True
        else:
            self.speed = 0
            self.rpm = 0
            ignition = False

        if self.scenario != "alert":
            self.coolant = min(95, max(70, self.coolant + random.uniform(-0.2, 0.3)))
        self.battery = 12.4 + random.uniform(0.8, 1.4)
        self.fuel = max(5, self.fuel - 0.01)
        throttle = int(12 + (self.speed / 85) * 45)
        load = int(18 + (self.speed / 85) * 40)

        payload = {
            "serial_number": self.serial_number,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": round(self.lat, 7),
            "longitude": round(self.lng, 7),
            "speed": round(self.speed, 1),
            "heading": round(self.heading, 1),
            "rpm": round(self.rpm),
            "coolant_temperature": round(self.coolant, 1),
            "engine_load": load,
            "throttle_position": throttle,
            "battery_voltage": round(self.battery, 1),
            "fuel_level": round(self.fuel, 1),
            "intake_air_temperature": round(25 + random.uniform(-2, 5), 1),
            "engine_runtime": self.seq * 3,
            "odometer": round(self.odometer, 2),
            "ignition": ignition,
            "dtc_codes": ["P0420"] if self.scenario == "alert" and self.seq > 5 else [],
        }
        return payload


async def run_simulator(ws_url: str, serial_number: str, interval: float, scenario: str):
    sim = VehicleSimulator(serial_number, scenario)
    while True:
        try:
            async with websockets.connect(ws_url) as ws:
                print(f"[{serial_number}] Connected to {ws_url}")
                while True:
                    payload = sim.tick()
                    if payload is None:
                        await asyncio.sleep(interval)
                        continue
                    await ws.send(json.dumps(payload))
                    response = await ws.recv()
                    print(f"[{serial_number}] Sent seq={sim.seq} speed={payload['speed']} -> {response}")
                    await asyncio.sleep(interval)
        except Exception as exc:
            print(f"[{serial_number}] Error: {exc}. Reconnecting in 3s...")
            await asyncio.sleep(3)


async def main():
    ws_url = os.environ.get("WS_URL", "ws://localhost:8000/ws/device/telemetry/")
    interval = float(os.environ.get("INTERVAL", "1"))
    devices = os.environ.get("DEVICES", "CARQ-OBD-000001").split(",")
    scenarios = os.environ.get(
        "SCENARIOS",
        "moving,moving,idle,stopped,offline,alert,moving,idle,stopped,moving",
    ).split(",")

    tasks = []
    for i, serial in enumerate(devices):
        scenario = scenarios[i % len(scenarios)]
        tasks.append(run_simulator(ws_url, serial.strip(), interval, scenario.strip()))
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    if websockets is None:
        raise SystemExit("Install websockets: pip install websockets")
    asyncio.run(main())
