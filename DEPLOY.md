# CARQ Deploy Guide — carq.autos

Хоосон Ubuntu server дээр **carq.autos** production deploy хийх богино заавар.

| URL | Юу вэ |
|-----|--------|
| `https://carq.autos` | Frontend (dashboard) |
| `https://api.carq.autos` | API + WebSocket |
| `https://api.carq.autos/api/docs/` | API docs |
| `<server-ip>:8080` | JT808 төхөөрөмж (TCP) |

---

## Урьдчилсан нөхцөл

- Ubuntu 22.04+ (шинэ EC2 instance)
- Domain DNS server IP рүү заасан
- GitHub SSH key холбогдсон

**DNS A records** (Route53 / Cloudflare гэх мэт):

| Name | Value |
|------|-------|
| `@` | `<SERVER_IP>` |
| `www` | `<SERVER_IP>` |
| `api` | `<SERVER_IP>` |

---

## 1. Server бэлдэх

SSH-ээр server рүү орно:

```bash
ssh ubuntu@<SERVER_IP>
```

Систем шинэчлэх, firewall нээх:

```bash
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable
```

> **AWS:** Security Group дээр ч `80`, `443`, `8080`, `22` port нээсэн байх.

Docker суулгах:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
docker --version
docker compose version
```

---

## 2. Repo clone

```bash
git clone git@github.com:sukhochird/innovator.git ~/carq
cd ~/carq
```

GitHub SSH key байхгүй бол:

```bash
ssh-keygen -t ed25519 -C "ubuntu@carq.autos" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# → GitHub Settings → SSH keys дээр нэмнэ
ssh -T git@github.com
git clone git@github.com:sukhochird/innovator.git ~/carq
cd ~/carq
```

---

## 3. Environment тохируулах

```bash
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

**Заавал солих** (secret үүсгэх: `openssl rand -hex 32`):

```env
DJANGO_SECRET_KEY=<openssl rand -hex 32 үр дүн>
POSTGRES_PASSWORD=<хүчтэй нууц үг>
DATABASE_URL=postgres://carq:<ижил password>@postgres:5432/carq
CADDY_EMAIL=admin@carq.autos
COMPOSE_PROFILES=caddy
```

> `POSTGRES_PASSWORD` болон `DATABASE_URL` доторх password **яг ижил** байх ёстой.

Бусад утгууд (`NEXT_PUBLIC_*`, `ALLOWED_HOSTS`, `CORS_*`) example файл дээр carq.autos-д тохирсон байна.

---

## 4. Deploy

```bash
cd ~/carq
chmod +x deploy/carq.sh
./deploy/carq.sh up -d --build
```

`deploy/carq.sh` нь `--env-file deploy/.env.production`-ийг автоматаар дамжуулна.

Статус шалгах (бүгд `running` / `healthy`):

```bash
./deploy/carq.sh ps
./deploy/carq.sh logs -f caddy backend
```

`Ctrl+C` — log-оос гарна.

---

## 5. Admin user үүсгэх

```bash
./deploy/carq.sh exec backend python manage.py createsuperuser
```

Demo өгөгдөл (зөвхөн test/staging):

```bash
./deploy/carq.sh exec backend python manage.py seed_demo
```

---

## 6. Шалгах

```bash
curl -I https://carq.autos
curl -I https://api.carq.autos/api/docs/
```

Browser: `https://carq.autos` → login page харагдана.

Caddy SSL анх удаа 1–2 минут авч болно. DNS propagate хийгдээгүй бол SSL алдаа гарна — `dig +short carq.autos` server IP-тай таарч байгаа эсэхийг шалга.

---

## Шинэчлэх (update)

```bash
cd ~/carq
git pull
./deploy/carq.sh up -d --build
./deploy/carq.sh exec backend python manage.py migrate
```

---

## Backup

```bash
mkdir -p ~/backups
./deploy/carq.sh exec -T postgres pg_dump -U carq carq | gzip > ~/backups/carq_$(date +%F).sql.gz
```

---

## Асуудал гарвал

**Container статус:**
```bash
./deploy/carq.sh ps
./deploy/carq.sh logs backend
./deploy/carq.sh logs caddy
```

**`password authentication failed for user "carq"`**

Ихэвчлэн 2 шалтгаан:
1. `POSTGRES_PASSWORD` ≠ `DATABASE_URL` доторх password
2. Postgres volume **өмнө өөр password-оор** эхэлсэн (password-ийг дараа нь `.env`-ээс солиход DB өөрчлөгддөггүй)

Шалгах:
```bash
grep -E 'POSTGRES_PASSWORD|DATABASE_URL' deploy/.env.production
```

**Шийдэл A — өгөгдөл хадгалахгүй (шинэ deploy, хамгийн хялбар):**
```bash
cd ~/carq
# deploy/.env.production дотор password-үүд таарч байгаа эсэхийг засна
./deploy/carq.sh down -v
./deploy/carq.sh up -d --build
./deploy/carq.sh exec backend python manage.py createsuperuser
```

**Шийдэл B — volume хадгалах, DB password sync:**
```bash
# .env доторх шинэ password-ийг NEW_PASS гэж үзнэ
./deploy/carq.sh exec postgres psql -U carq -d postgres \
  -c "ALTER USER carq WITH PASSWORD 'NEW_PASS';"
# deploy/.env.production: POSTGRES_PASSWORD=NEW_PASS, DATABASE_URL=postgres://carq:NEW_PASS@postgres:5432/carq
./deploy/carq.sh up -d --force-recreate backend
```

**Port давхцал** (хоосон server дээр ховор, гэхдээ dev stack ажиллуулсан бол):
```bash
cd ~/carq
docker compose down
./deploy/carq.sh up -d --build
```

**Frontend localhost руу холбогдож байна** — env өөрчлөөд rebuild:
```bash
./deploy/carq.sh build --no-cache frontend
./deploy/carq.sh up -d frontend
```

**CORS / WebSocket** — `deploy/.env.production` дотор:
```env
CORS_ALLOWED_ORIGINS=https://carq.autos,https://www.carq.autos
NEXT_PUBLIC_WS_URL=wss://api.carq.autos
```

---

## Appendix: Өөр вебтэй server (optional)

Server дээр Nginx/Apache аль хэдийн port 80/443 эзэлсэн бол **Caddy ажиллуулахгүй**. `DEPLOY.md`-ийн shared mode:

```bash
# deploy/.env.production дотор COMPOSE_PROFILES=caddy comment хий
docker compose -f docker-compose.prod.yml -f docker-compose.shared.yml \
  --env-file deploy/.env.production up -d --build
```

Дараа нь `deploy/nginx/carq.autos.conf`-ийг одоо байгаа Nginx-д нэмнэ. Дэлгэрэнгүй: `docker-compose.shared.yml`, `deploy/nginx/carq.autos.conf`.

---

## Файлууд

| File | Зориулалт |
|------|-----------|
| `docker-compose.prod.yml` | Production stack |
| `deploy/.env.production.example` | Env template |
| `deploy/Caddyfile` | HTTPS reverse proxy |
| `deploy/nginx/carq.autos.conf` | Shared server Nginx (optional) |
