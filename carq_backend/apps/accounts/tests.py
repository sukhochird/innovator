from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.companies.models import Company, CompanyStatus
from apps.devices.models import Device, DeviceStatus
from apps.vehicles.models import Vehicle


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            role=UserRole.SUPER_ADMIN,
        )

    def test_login(self):
        response = self.client.post("/api/auth/login/", {"email": "admin@test.com", "password": "testpass123"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)


class CompanyIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.company_a = Company.objects.create(
            name="Company A",
            registration_number="REG-A",
            email="a@test.com",
            status=CompanyStatus.ACTIVE,
        )
        self.company_b = Company.objects.create(
            name="Company B",
            registration_number="REG-B",
            email="b@test.com",
            status=CompanyStatus.ACTIVE,
        )
        self.admin_a = User.objects.create_user(
            email="admina@test.com",
            password="testpass123",
            first_name="A",
            last_name="Admin",
            role=UserRole.COMPANY_ADMIN,
            company=self.company_a,
        )
        self.vehicle_b = Vehicle.objects.create(
            company=self.company_b,
            plate_number="B-001",
            make="Toyota",
            model="Prius",
        )

    def test_company_admin_cannot_access_other_company_vehicle(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get(f"/api/vehicles/{self.vehicle_b.id}/")
        self.assertEqual(response.status_code, 404)


class DeviceTelemetryTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            name="Test Co",
            registration_number="REG-T",
            email="t@test.com",
            status=CompanyStatus.ACTIVE,
        )
        self.vehicle = Vehicle.objects.create(
            company=self.company,
            plate_number="T-001",
            make="Toyota",
            model="Prius",
        )
        self.device = Device.objects.create(
            serial_number="CARQ-OBD-TEST001",
            model="CARQ OBD Pro",
            status=DeviceStatus.ACTIVE,
            company=self.company,
            vehicle=self.vehicle,
        )

    def test_unknown_device_cannot_submit_telemetry(self):
        from apps.telemetry.services.ingestion import TelemetryIngestionService

        service = TelemetryIngestionService()
        result = service.ingest({"serial_number": "UNKNOWN-DEVICE", "speed": 50})
        self.assertIsNone(result)

    def test_valid_device_submits_telemetry(self):
        from apps.telemetry.services.ingestion import TelemetryIngestionService

        service = TelemetryIngestionService()
        result = service.ingest(
            {
                "serial_number": "CARQ-OBD-TEST001",
                "speed": 60,
                "rpm": 2000,
                "latitude": 47.918,
                "longitude": 106.917,
                "ignition": True,
            }
        )
        self.assertIsNotNone(result)
        self.assertEqual(result.speed, 60.0)
