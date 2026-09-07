from django.test import TestCase

from apps.companies.models import Company, CompanyStatus
from apps.devices.models import Device, DeviceStatus
from apps.telemetry.parsers.jt808 import JT808Parser
from apps.telemetry.services.ingestion import TelemetryIngestionService
from apps.vehicles.models import Vehicle


class JT808ParserTests(TestCase):
    def test_parse_simulator_packet(self):
        # Build packet using same logic as simulator.py
        import struct

        def string_to_bcd(phone_str):
            phone_str = phone_str.zfill(12)
            bcd_bytes = bytearray()
            for i in range(0, 12, 2):
                high = int(phone_str[i])
                low = int(phone_str[i + 1])
                bcd_bytes.append((high << 4) | low)
            return bytes(bcd_bytes)

        def escape(data_bytes):
            escaped = bytearray()
            for b in data_bytes:
                if b == 0x7E:
                    escaped.extend([0x7D, 0x02])
                elif b == 0x7D:
                    escaped.extend([0x7D, 0x01])
                else:
                    escaped.append(b)
            return bytes(escaped)

        phone = "013800138000"
        body = bytearray()
        body.extend(struct.pack(">IIIIHH", 0, 3, 47918096, 106917000, 42, 650))
        body.extend(struct.pack(">H", 180))
        body.extend(string_to_bcd("260907120000"))
        body.extend(struct.pack(">BB H", 0x82, 2, 138))
        body.extend(struct.pack(">BB B", 0x30, 1, 90))
        body.extend(struct.pack(">BB H", 0x02, 2, 785))
        body.extend(struct.pack(">BB H", 0x03, 2, 2400))
        body.extend(struct.pack(">BB B", 0x04, 1, 128))
        body.extend(struct.pack(">BB B", 0x06, 1, 28))
        body.extend(struct.pack(">BB B", 0x07, 1, 42))

        header = struct.pack(">HH", 0x0200, len(body)) + string_to_bcd(phone) + struct.pack(">H", 1)
        payload = header + body
        checksum = 0
        for b in payload:
            checksum ^= b
        packet = b"\x7E" + escape(payload + bytes([checksum])) + b"\x7E"

        parser = JT808Parser()
        data = parser.parse(packet[1:-1])  # inner without framing

        self.assertEqual(data.serial_number, phone)
        self.assertAlmostEqual(data.latitude, 47.918096, places=3)
        self.assertAlmostEqual(data.longitude, 106.917, places=3)
        self.assertAlmostEqual(data.speed, 65.0)
        self.assertEqual(data.rpm, 2400)
        self.assertAlmostEqual(data.coolant_temperature, 88.0)


class JT808IngestionTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(
            name="JT808 Co",
            registration_number="JT808-001",
            email="jt808@test.com",
            status=CompanyStatus.ACTIVE,
        )
        self.vehicle = Vehicle.objects.create(
            company=self.company,
            plate_number="JT-001",
            make="Toyota",
            model="Prius",
        )
        self.device = Device.objects.create(
            serial_number="CARQ-OBD-JT808",
            terminal_phone="013800138000",
            model="JT808 OBD",
            status=DeviceStatus.ACTIVE,
            company=self.company,
            vehicle=self.vehicle,
        )

    def test_ingest_jt808_by_terminal_phone(self):
        import struct

        def string_to_bcd(phone_str):
            phone_str = phone_str.zfill(12)
            return bytes([(int(phone_str[i]) << 4) | int(phone_str[i + 1]) for i in range(0, 12, 2)])

        body = bytearray()
        body.extend(struct.pack(">IIIIHH", 0, 3, 47918096, 106917000, 42, 720))
        body.extend(struct.pack(">H", 90))
        body.extend(string_to_bcd("260907120000"))
        body.extend(struct.pack(">BB H", 0x03, 2, 2500))

        phone = "013800138000"
        header = struct.pack(">HH", 0x0200, len(body)) + string_to_bcd(phone) + struct.pack(">H", 1)
        payload = header + body
        cs = 0
        for b in payload:
            cs ^= b
        inner = payload + bytes([cs])

        service = TelemetryIngestionService()
        result = service.ingest(inner)
        self.assertIsNotNone(result)
        self.assertEqual(result.speed, 72.0)
        self.assertEqual(result.rpm, 2500)
