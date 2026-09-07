# CARQ Platform

Vehicle telemetry and fleet management platform.

## Production Deploy

See **[DEPLOY.md](./DEPLOY.md)** for deploying to **carq.autos** (Docker, Caddy, SSL, JT808).

## Quick Start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@carq.local | admin123 |
| Company Admin | company@carq.local | company123 |
| Driver | driver1@carq.local | driver123 |

## Local Development

### Backend

```bash
cd carq_backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

Requires PostgreSQL and Redis (or use SQLite via `DATABASE_URL=sqlite:///db.sqlite3` in `.env`).

### Frontend

```bash
cd carq_frontend
npm install
cp .env.example .env.local
npm run dev
```

### JT808 Hardware Simulator (simulator.py)

The root `simulator.py` sends binary JT808 packets over TCP — the same protocol used by real OBD/GPS hardware.

**Terminal phone → CARQ device mapping** (after `seed_demo`):

| JT808 Phone | CARQ Device | Vehicle |
|-------------|-------------|---------|
| 013800138000 | CARQ-OBD-000001 | UBX-1234 |
| 013800138001 | CARQ-OBD-000002 | UBX-5678 |
| 013800138002 | CARQ-OBD-000003 | UBX-9012 |

```bash
# Terminal 1 — start JT808 TCP server
cd carq_backend
python manage.py run_jt808_server --port 8080

# Terminal 2 — run hardware simulator
python simulator.py
# Or with env vars:
SERVER_HOST=127.0.0.1 SERVER_PORT=8080 INTERVAL=3 python simulator.py
```

Telemetry flows: `simulator.py` → TCP :8080 → JT808 parser → PostgreSQL/Redis → WebSocket → Dashboard

### JSON WebSocket Simulator

## Architecture

- **Backend**: Django, DRF, Channels, Redis, PostgreSQL
- **Frontend**: Next.js, TypeScript, Tailwind, MapLibre, Recharts
- **Realtime**: WebSocket via Django Channels

## API Endpoints

- `POST /api/auth/login/` — JWT login
- `GET /api/dashboard/company/` — Company fleet dashboard
- `GET /api/dashboard/vehicles/:id/` — Vehicle dashboard
- `WS /ws/vehicles/:id/` — Realtime vehicle telemetry
- `WS /ws/device/telemetry/` — Device telemetry ingestion
