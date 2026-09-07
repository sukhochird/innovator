"""JT808 TCP server for hardware device telemetry ingestion."""

import logging
import socket
import socketserver
import threading
from typing import Callable

from apps.telemetry.parsers.jt808 import extract_packets

logger = logging.getLogger(__name__)


class JT808TCPHandler(socketserver.BaseRequestHandler):
    buffers: dict[str, bytearray] = {}
    lock = threading.Lock()

    def handle(self) -> None:
        client_key = f"{self.client_address[0]}:{self.client_address[1]}"
        with self.lock:
            self.buffers.setdefault(client_key, bytearray())

        from apps.telemetry.services.ingestion import TelemetryIngestionService

        service = TelemetryIngestionService()
        client_ip = self.client_address[0]

        logger.info("JT808 device connected: %s", client_key)
        try:
            while True:
                chunk = self.request.recv(4096)
                if not chunk:
                    break

                with self.lock:
                    buf = self.buffers[client_key]
                    buf.extend(chunk)
                    packets, remainder = extract_packets(buf)
                    self.buffers[client_key] = remainder

                for packet in packets:
                    try:
                        result = service.ingest(packet, client_ip=client_ip)
                        if result:
                            logger.debug(
                                "JT808 ingested vehicle=%s speed=%s",
                                result.vehicle_id,
                                result.speed,
                            )
                        else:
                            logger.warning("JT808 packet rejected (unknown device)")
                        # Generic JT808 platform ACK (0x8001)
                        self._send_ack(packet)
                    except Exception:
                        logger.exception("JT808 packet processing error")
        except ConnectionResetError:
            pass
        finally:
            with self.lock:
                self.buffers.pop(client_key, None)
            logger.info("JT808 device disconnected: %s", client_key)

    def _send_ack(self, packet: bytes) -> None:
        """Send minimal 0x8001 general response so devices keep streaming."""
        try:
            from apps.telemetry.parsers.jt808 import unescape_jt808

            raw = unescape_jt808(packet)
            if len(raw) < 12:
                return
            phone = raw[4:10]
            seq = raw[10:12]
            body = seq + b"\x00\x00\x02\x00" + seq + b"\x00"
            header = b"\x80\x01" + len(body).to_bytes(2, "big") + phone
            payload = header + body
            checksum = 0
            for b in payload:
                checksum ^= b
            payload_cs = payload + bytes([checksum])
            escaped = bytearray()
            for b in payload_cs:
                if b == 0x7E:
                    escaped.extend([0x7D, 0x02])
                elif b == 0x7D:
                    escaped.extend([0x7D, 0x01])
                else:
                    escaped.append(b)
            self.request.sendall(b"\x7E" + bytes(escaped) + b"\x7E")
        except Exception:
            pass


class JT808TCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_jt808_server(host: str = "0.0.0.0", port: int = 8080) -> Callable[[], None]:
    server = JT808TCPServer((host, port), JT808TCPHandler)
    thread = threading.Thread(target=server.serve_forever, name="jt808-tcp", daemon=True)
    thread.start()
    logger.info("JT808 TCP server listening on %s:%s", host, port)

    def shutdown() -> None:
        server.shutdown()
        server.server_close()

    return shutdown
