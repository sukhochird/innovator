from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.companies.models import Company, CompanyStatus
from apps.devices.models import Device, DeviceStatus
from apps.telemetry.services.ingestion import TelemetryIngestionService
from apps.vehicles.models import DriverVehicleAssignment, Vehicle, VehicleStatus
from apps.vehicles.services import assign_driver_to_vehicle
from apps.devices.services import assign_device_to_vehicle


DEMO_VEHICLES = [
    ("UBX-1234", "Toyota", "Prius", 2021, "moving"),
    ("UBX-5678", "Honda", "Civic", 2020, "moving"),
    ("UBX-9012", "Ford", "Transit", 2019, "idle"),
    ("UBX-3456", "Mercedes", "Sprinter", 2022, "stopped"),
    ("UBX-7890", "Nissan", "Leaf", 2023, "offline"),
    ("UBX-2345", "Toyota", "Camry", 2021, "alert"),
    ("UBX-6789", "Hyundai", "Tucson", 2022, "moving"),
    ("UBX-0123", "BMW", "X5", 2020, "idle"),
    ("UBX-4567", "Volkswagen", "Golf", 2019, "stopped"),
    ("UBX-8901", "Lexus", "RX350", 2021, "moving"),
]

DEMO_DRIVERS = [
    ("John", "Smith", "driver1@carq.local"),
    ("Jane", "Doe", "driver2@carq.local"),
    ("Mike", "Johnson", "driver3@carq.local"),
]

# JT808 simulator.py terminal phone IDs -> CARQ device mapping
JT808_TERMINAL_PHONES = [
    (f"0138001380{i:02d}", i) for i in range(10)
]


class Command(BaseCommand):
    help = "Seed demo data for CARQ platform"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        admin, _ = User.objects.get_or_create(
            email="admin@carq.local",
            defaults={
                "first_name": "Super",
                "last_name": "Admin",
                "role": UserRole.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("admin123")
        admin.save()

        company, _ = Company.objects.get_or_create(
            registration_number="CARQ-DEMO-001",
            defaults={
                "name": "CARQ Demo Logistics",
                "email": "company@carq.local",
                "phone": "+976 9911 2233",
                "address": "Ulaanbaatar, Mongolia",
                "status": CompanyStatus.ACTIVE,
                "approved_at": timezone.now(),
                "approved_by": admin,
            },
        )

        company_admin, _ = User.objects.get_or_create(
            email="company@carq.local",
            defaults={
                "first_name": "Company",
                "last_name": "Admin",
                "role": UserRole.COMPANY_ADMIN,
                "company": company,
            },
        )
        company_admin.set_password("company123")
        company_admin.company = company
        company_admin.role = UserRole.COMPANY_ADMIN
        company_admin.save()

        drivers = []
        for first, last, email in DEMO_DRIVERS:
            driver, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "role": UserRole.DRIVER,
                    "company": company,
                },
            )
            driver.set_password("driver123")
            driver.company = company
            driver.role = UserRole.DRIVER
            driver.save()
            drivers.append(driver)

        ingestion = TelemetryIngestionService()
        for i, (plate, make, model, year, scenario) in enumerate(DEMO_VEHICLES):
            serial = f"CARQ-OBD-{i + 1:06d}"
            device, _ = Device.objects.get_or_create(
                serial_number=serial,
                defaults={
                    "imei": f"86012345678901{i}",
                    "model": "CARQ OBD Pro",
                    "firmware_version": "1.0.0",
                    "status": DeviceStatus.UNASSIGNED,
                    "company": company,
                },
            )

            vehicle, _ = Vehicle.objects.get_or_create(
                company=company,
                plate_number=plate,
                defaults={
                    "make": make,
                    "model": model,
                    "year": year,
                    "vin": f"VIN{100000 + i}",
                    "color": "White",
                    "status": VehicleStatus.OFFLINE if scenario == "offline" else VehicleStatus.STOPPED,
                },
            )

            assign_device_to_vehicle(device, vehicle, admin)
            if i < len(drivers):
                assign_driver_to_vehicle(vehicle, drivers[i % len(drivers)], company_admin)

            if scenario != "offline":
                base_lat = 47.921483 + (i * 0.003)
                base_lng = 106.916858 + (i * 0.004)
                speed = 65 if scenario == "moving" else (0 if scenario in ("stopped", "idle") else 55)
                rpm = 2400 if speed > 0 else (850 if scenario == "idle" else 0)
                coolant = 108 if scenario == "alert" else 88
                payload = {
                    "serial_number": serial,
                    "timestamp": timezone.now().isoformat(),
                    "latitude": base_lat,
                    "longitude": base_lng,
                    "speed": speed,
                    "heading": 180,
                    "rpm": rpm,
                    "coolant_temperature": coolant,
                    "engine_load": 42,
                    "throttle_position": 28,
                    "battery_voltage": 13.8,
                    "fuel_level": 64,
                    "intake_air_temperature": 28,
                    "engine_runtime": 3600,
                    "odometer": 12450 + i * 100,
                    "ignition": scenario != "stopped",
                    "dtc_codes": ["P0420"] if scenario == "alert" else [],
                }
                ingestion.ingest(payload)

        # Link JT808 hardware simulator terminal phones to devices
        for phone, vehicle_index in JT808_TERMINAL_PHONES:
            serial = f"CARQ-OBD-{vehicle_index + 1:06d}"
            Device.objects.filter(serial_number=serial).update(terminal_phone=phone)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("  admin@carq.local / admin123")
        self.stdout.write("  company@carq.local / company123")
        self.stdout.write("  driver1@carq.local / driver123")
