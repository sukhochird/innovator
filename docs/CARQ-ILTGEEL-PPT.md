# CARQ — Илтгэлийн PPT текст

> Ухаалаг автомашины хяналт, оношилгоо, флот удирдлагын платформ  
> Demo: https://carq.autos | company@carq.local / company123

---

## Slide 1 — Гарчиг

**CARQ**  
Ухаалаг флот удирдлагын платформ

GPS + OBD Telemetry + Оношилгоо + Realtime Dashboard

---

## Slide 2 — Асуудал

Таны машинууд ажиллаж байна. Харин яг юу болж байгааг та мэдэж байна уу?

- Машины байршил, төлөвийг бодит хугацаанд харах боломж хязгаарлагдмал
- Excel, утас, тусдаа GPS системээр флот удирдах нь төвөгтэй
- Жижиг доголдол том эвдрэл, өндөр зардал болж хувирдаг
- Мэдээлэл төхөөрөмж, жолооч, засварын бүртгэлд тархсан байдаг

---

## Slide 3 — Шийдэл (CARQ)

**Нэг платформ. Бүх машин.**

CARQ нь GPS, OBD telemetry, оношилгоо, анхааруулга, флот dashboard-ийг нэг SaaS системд нэгтгэнэ.

**Гол давуу тал:**
- Зөвхөн GPS биш — RPM, температур, батарей, DTC
- Realtime WebSocket шинэчлэл
- Fleet map + geofence + track history
- Компани, жолооч, super admin role

---

# 🧑‍💻 ТЕХНОЛОГИЙН ЧИГЛЭЛ

---

## Slide 4 — Товч танилцуулга

**Юу хийсэн бэ?**

CARQ нь JT808 протокол дээр суурилсан GPS/OBD төхөөрөмжөөс мэдээлэл хүлээн авч, PostgreSQL/Redis дээр хадгалж, WebSocket-ээр frontend dashboard руу realtime дамжуулдаг флот удирдлагын платформ юм.

**Гол модуль:**
- JT808 TCP server + parser
- Telemetry ingestion + alert engine
- Fleet Command Center (map, tracking, playback)
- DTC / Alerts / Devices hub
- Geofence entry/exit detection

---

## Slide 5 — Технологи ба сонгосон шалтгаан

| Технологи | Ямар зориулалт | Яагаад сонгосон |
|-----------|----------------|-----------------|
| **Django + DRF** | REST API, auth, business logic | Хурдан хөгжүүлэлт, найдвартай ecosystem |
| **Django Channels** | WebSocket realtime | Telemetry push, dashboard live update |
| **PostgreSQL** | Telemetry түүх, флот өгөгдөл | Relational data, query, migration |
| **Redis** | Cache, channel layer | Realtime performance |
| **Next.js + TypeScript** | Dashboard UI, landing | SSR/SEO, production deploy |
| **MapLibre + OpenFreeMap** | Fleet map | API key шаардахгүй, WebGL map |
| **Docker + Caddy** | Production deploy | carq.autos HTTPS, масштаб |

---

## Slide 6 — Прототайп үзүүлбэр (гол онцлог)

### 1. Fleet Command Center (`/fleet`)
- Бүх машины GPS marker, live trail
- Машин дарахад map focus (zoom 18)
- Track history + playback
- Geofence зурах, хадгалах, alert

### 2. Company Dashboard (`/dashboard`)
- KPI: online, moving, idle, alert
- AI insight, recent alerts/DTC
- Fleet status overview

### 3. Vehicle Detail (`/vehicle/[id]`)
- Live map, telemetry gauges
- DTC codes, alert timeline
- Raw JT808 log panel

### 4. JT808 Simulator (`simulator.py`)
- 3 машин — Улаанбаатар төвийг тойрсон demo route
- Бодит төхөөрөмжийн протоколыг дуурайлган туршилт

---

## Slide 7 — Demo заавар

**Live demo алхмууд:**

1. https://carq.autos/login → `company@carq.local` / `company123`
2. `/fleet` — map дээр машинууд, trail
3. Sidebar-аас машин сонгох → focus + telemetry
4. Geofence үүсгэх → map дээр зурах
5. `/dashboard` — KPI, alerts, fleet table
6. (Local) `python simulator.py` → live GPS update

**Architecture flow:**
```
simulator.py → TCP :8080 → JT808 parser → DB/Redis → WebSocket → Dashboard
```

---

## Slide 8 — Ирээдүйн төлөв

CARQ платформыг дараах чиглэлд ашиглах боломжтой:

1. **Логистик / хүргэлт** — маршрут, хүргэлтийн SLA хяналт
2. **Барилга / уул уурхай** — талбайн техникийн байршил, ашиглалт
3. **Корпораци флот** — ажилчдын машин, засварын төлөвлөлт
4. **Түрээсийн компани** — машины эрүүл мэнд + GPS
5. **Predictive maintenance** — telemetry trend → засвар урьдчилан төлөвлөх
6. **ERP/TMS интеграци** — API-ээр бизнес системтэй холбох

---

# 🪙 БИЗНЕСИЙН ЧИГЛЭЛ

---

## Slide 9 — Бизнесийн тодорхойлолт

**Зорилтот хэрэглэгч:**
- Логистик, хүргэлтийн компани (5–500+ машин)
- Такси, автобус, тээврийн оператор
- Барилга, уул уурхайн техникийн флот
- Корпораци үйлчилгээний машин
- Автомашин түрээс

**Тэдний асуудал:**
- Флотын нэгдсэн харагдац байхгүй
- Жолооч бүрт утасдах, Excel удирдах
- Засварын зардал өндөр, эрт илрүүлэхгүй

**CARQ-ийн шийдэл:**
- GPS + OBD + DTC + alert нэг dashboard
- Realtime map, geofence, history
- SaaS — хурдан суулгалт, масштаблах боломж

---

## Slide 10 — Бизнес загвар ба зах зээл

### Зах зээлийн дүн шинжилгээ (Монгол)

| Сегмент | Тойм |
|---------|------|
| Логистик / хүргэлт | E-commerce өсөлттэй, флот хяналтын хэрэгцээ өндөр |
| Барилга / уул уурхай | Талбайн машин олон, GPS + ашиглалт чухал |
| Корпораци флот | 10–200 машин, төвлөрсөн системгүй |
| Уламжлалт GPS | Зөвхөн байршил — CARQ telemetry нэмж өгнө |

### Ашиг олох бүтэц

1. **SaaS subscription** — машин/сар (₮15,000–₮45,000/machin)
2. **Төхөөрөмж + суулгалт** — OBD/GPS hardware margin
3. **Enterprise** — 100+ машин, custom integration
4. **API төсөл** — ERP, TMS холболт

---

## Slide 11 — Хэрэгжүүлэх төлөвлөгөө (PL)

**3 жилийн энгийн P&L (сая ₮)**

| Мөр | Жил 1 | Жил 2 | Жил 3 |
|-----|-------|-------|-------|
| **Орлого** | 45 | 180 | 420 |
| Төхөөрөмж + COGS | (18) | (54) | (105) |
| Хөгжүүлэлт, cloud | (12) | (24) | (36) |
| Борлуулалт, маркетинг | (8) | (20) | (35) |
| **Цэвэр ашиг** | **7** | **82** | **244** |

**Төлөвлөгөө:**
- **Жил 1:** 2 pilot компани, 50 машин, product-market fit
- **Жил 2:** 8 компани, 200 машин, борлуулалтын баг
- **Жил 3:** 20 компани, 500+ машин, enterprise deals

---

## Slide 12 — Roadmap

| Улирал | Үйл ажиллагаа |
|--------|---------------|
| Q1 | Pilot 2 компани, feedback, mobile view |
| Q2 | ERP интеграци POC, driver app |
| Q3 | 100+ машин, enterprise pricing |
| Q4 | Predictive maintenance MVP |

---

## Slide 13 — Дүгнэлт

**CARQ** нь:
- ✅ Ажиллаж буу **прототайп** (carq.autos)
- ✅ **JT808** бодит төхөөрөмжийн протокол дэмжинэ
- ✅ **SaaS** бизнес загарт тохирсон
- ✅ Монголын логистик, барилга, уул уурхайд **шууд хэрэглэх** боломжтой

**Дараагийн алхам:** Pilot компани onboard → telemetry value баталгаажуулах → масштаб

---

## Slide 14 — Q&A

**Холбоо барих:**
- Website: https://carq.autos
- Demo: company@carq.local / company123
- Landing: `#presentation` хэсэг

**Асуулт?**

---

## Хавсралт — Илтгэлийн шаардлагын checklist

### 🧑‍💻 Технологийн чиглэл
- [x] Товч танилцуулга — технологи + сонгосон шалтгаан
- [x] Прототайп үзүүлбэр — demo URL, simulator, кодын architecture
- [x] Ирээдүйн төлөв — салбар, интеграци, масштаб

### 🪙 Бизнесийн чиглэл
- [x] Бизнесийн тодорхойлолт — хэрэглэгч, асуудал, шийдэл
- [x] Бизнес загвар ба зах зээл — revenue streams, market
- [x] Хэрэгжүүлэх төлөвлөгөө — 3 жилийн PL
