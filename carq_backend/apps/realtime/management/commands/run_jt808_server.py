import logging

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.realtime.jt808_server import start_jt808_server

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run JT808 TCP server for hardware OBD/GPS device telemetry"

    def add_arguments(self, parser):
        parser.add_argument("--host", default=getattr(settings, "JT808_HOST", "0.0.0.0"))
        parser.add_argument("--port", type=int, default=getattr(settings, "JT808_PORT", 8080))

    def handle(self, *args, **options):
        host = options["host"]
        port = options["port"]
        self.stdout.write(f"Starting JT808 server on {host}:{port}")
        shutdown = start_jt808_server(host, port)
        try:
            import time

            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stdout.write("Stopping JT808 server...")
            shutdown()
