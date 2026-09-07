# CARQ Production Deploy Guide — carq.autos

Production deployment guide for the CARQ platform on **carq.autos**.

## Architecture

```
                    Internet
                        │
                   ┌────▼────┐
                   │  Caddy  │  :443 HTTPS (auto SSL)
                   └────┬────┘
          ┌──────────────┼──────────────┐
          │              │              │
   carq.autos      api.carq.autos    (TCP :8080)
   (Next.js)       (Django/Daphne)   JT808 devices
      :3000            :8000
          │              │
          └──────┬───────┘
                 │
        ┌────────┼────────┐
        │        │        │
   PostgreSQL  Redis   JT808 server
```

| Service | URL / Port | Notes |
|---------|------------|-------|
| Frontend | `https://carq.autos` | Next.js dashboard & landing |
| API + WebSocket | `https://api.carq.autos` | REST API, `/ws/*` realtime |
| JT808 hardware | `<server-ip>:8080` | TCP (OBD/GPS devices) |
| API docs | `https://api.carq.autos/api/docs/` | Swagger UI |

---

## Server requirements

- **OS**: Ubuntu 22.04+ / Debian 12+ (recommended)
- **CPU/RAM**: 2 vCPU, 4 GB RAM minimum (8 GB recommended)
- **Disk**: 40 GB SSD
- **Software**: Docker 24+, Docker Compose v2
- **Firewall**: open `80`, `443`, `8080` (JT808 only if using real devices)

---

## 1. DNS setup

Point these records to your server IP:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `<SERVER_IP>` |
| A | `www` | `<SERVER_IP>` |
| A | `api` | `<SERVER_IP>` |

Verify:

```bash
dig +short carq.autos
dig +short api.carq.autos
```

---

## 2. Clone & configure

Clone into your home directory (no `sudo` required on Ubuntu):

```bash
git clone git@github.com:sukhochird/innovator.git ~/carq
cd ~/carq
```

> **Note:** We use `~/carq` (`/home/<user>/carq`) instead of `/opt/carq` because `/opt` is owned by root and regular users cannot write there without extra permissions.

Copy and edit production env:

```bash
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

**Required values** (generate secret: `openssl rand -hex 32`):

```env
# Django
DJANGO_SECRET_KEY=<random-64-char-hex>
DEBUG=False
ALLOWED_HOSTS=api.carq.autos,carq.autos
CORS_ALLOWED_ORIGINS=https://carq.autos,https://www.carq.autos

# Database (change password!)
POSTGRES_USER=carq
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=carq
DATABASE_URL=postgres://carq:<strong-password>@postgres:5432/carq

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend build-time (baked into Next.js bundle)
NEXT_PUBLIC_API_URL=https://api.carq.autos
NEXT_PUBLIC_WS_URL=wss://api.carq.autos
NEXT_PUBLIC_SITE_URL=https://carq.autos

# Caddy
CADDY_EMAIL=admin@carq.autos
```

> **Important:** `NEXT_PUBLIC_*` variables are embedded at **build time**. After changing them, rebuild the frontend image:
> `docker compose -f docker-compose.prod.yml build frontend`

---

## 3. Deploy with Docker Compose

```bash
cd ~/carq
docker compose -f docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy backend
```

---

## 4. First-time database setup

Migrations run automatically on backend start. Create a real admin user (do **not** use demo credentials in production):

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Optional — load demo fleet data (staging only):

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo
```

Collect static files (Django admin):

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## 5. Verify deployment

| Check | Command / URL |
|-------|---------------|
| Frontend | Open `https://carq.autos` |
| API health | `curl -s https://api.carq.autos/api/docs/` |
| Login | POST `https://api.carq.autos/api/auth/login/` |
| WebSocket | Dashboard → vehicle page shows LIVE badge |
| SSL | Browser padlock, no mixed-content warnings |

Login test:

```bash
curl -s -X POST https://api.carq.autos/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carq.local","password":"admin123"}'
```

---

## 6. JT808 device connection

Real OBD/GPS hardware connects via **TCP**, not HTTPS.

- **Host**: your server public IP (or a dedicated A record, e.g. `devices.carq.autos`)
- **Port**: `8080`
- **Protocol**: JT808 binary

Ensure firewall allows inbound TCP 8080:

```bash
# ufw example
sudo ufw allow 8080/tcp
```

Device terminal phone must match a registered CARQ device (see `README.md` simulator table).

---

## 7. Updates & rollback

Pull latest code and redeploy:

```bash
cd ~/carq
git pull
docker compose -f docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

Run migrations after backend updates:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

Rollback to previous git tag/commit, then rebuild:

```bash
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml --env-file deploy/.env.production up -d --build
```

---

## 8. Backups

### PostgreSQL

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U carq carq > backup_$(date +%F).sql
```

Restore:

```bash
cat backup_2026-09-07.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U carq carq
```

### Automated daily backup (cron)

Replace `ubuntu` with your Linux username if different:

```bash
0 3 * * * cd /home/ubuntu/carq && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U carq carq | gzip > /home/ubuntu/backups/carq_$(date +\%F).sql.gz
```

Create the backups folder once:

```bash
mkdir -p ~/backups
```

---

## 9. Monitoring & logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Single service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f caddy
```

Restart a service:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

## 10. Security checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `DJANGO_SECRET_KEY` and Postgres password
- [ ] Demo `seed_demo` **not** run on production (or change all passwords after)
- [ ] Firewall: only `80`, `443`, `8080` (if needed) exposed publicly
- [ ] Postgres/Redis **not** published to host (internal Docker network only)
- [ ] HTTPS enforced via Caddy
- [ ] Regular backups configured
- [ ] Change default demo user passwords if seed data was loaded

---

## Alternative: Nginx + Certbot

If you prefer Nginx instead of Caddy, see `deploy/nginx/carq.autos.conf` and:

```bash
sudo certbot --nginx -d carq.autos -d www.carq.autos -d api.carq.autos
```

Key Nginx requirements:
- Proxy `api.carq.autos` with WebSocket headers (`Upgrade`, `Connection`)
- Proxy `carq.autos` to Next.js on port 3000
- Do **not** proxy JT808 port 8080 through Nginx (raw TCP)

---

## Troubleshooting

### `Permission denied` when cloning to `/opt/carq`

Use the home directory instead (recommended in this guide):

```bash
git clone git@github.com:sukhochird/innovator.git ~/carq
```

### Port 8080 already allocated

Another process or Docker container is using port 8080 (often a previous `docker compose up` dev stack).

**1. Find what uses the port:**

```bash
sudo ss -tlnp | grep 8080
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 8080
```

**2a. Stop the conflicting container** (e.g. old dev stack):

```bash
cd ~/carq
docker compose down
docker compose -f docker-compose.prod.yml --env-file deploy/.env.production up -d
```

**2b. Or use a different host port** — add to `deploy/.env.production`:

```env
JT808_HOST_PORT=18080
```

Then redeploy and point JT808 devices to `<server-ip>:18080`:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.production up -d
```

### CORS errors in browser

Ensure `CORS_ALLOWED_ORIGINS` includes `https://carq.autos` (no trailing slash).

### WebSocket not connecting

- Frontend must use `NEXT_PUBLIC_WS_URL=wss://api.carq.autos` (note `wss://`)
- Rebuild frontend after env change
- Check Caddy/Nginx passes `Upgrade` headers

### API 400 Bad Request (DisallowedHost)

Add domain to `ALLOWED_HOSTS=api.carq.autos,carq.autos`.

### Frontend still calls localhost:8000

`NEXT_PUBLIC_API_URL` was not set at build time. Rebuild:

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### JT808 devices not connecting

- Confirm port 8080 is open on cloud firewall (AWS Security Group, etc.)
- Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`
- Verify device IMEI/phone matches a registered device in admin

---

## File reference

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production stack |
| `deploy/.env.production.example` | Environment template |
| `deploy/Caddyfile` | Reverse proxy + auto SSL |
| `deploy/nginx/carq.autos.conf` | Nginx alternative |
