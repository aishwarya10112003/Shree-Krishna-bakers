# 🍰 Shree Krishna Bakers — Full-Stack Ordering System

A production-grade food-ordering platform for a real bakery: a customer storefront
(browse menu, cart, OTP signup, live order tracking) **and** an admin dashboard
(menu management, live kitchen board, sales analytics).

Built as an interview-grade reference project — fully containerized, tested, and
runnable on any machine in a few commands.

> **New to the codebase?** Read [`docs/LEARNINGS.md`](docs/LEARNINGS.md) — a guided
> tour of TypeScript and every enterprise pattern used here, explained from basics
> to advanced. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) has the diagrams.

---

## ✨ Engineering highlights

| Area | What it does |
|------|--------------|
| 🔒 **Price integrity** | The server recomputes every order total from the DB — a tampered client price (₹1 for a ₹500 cake) is impossible. |
| 🧮 **Atomic stock** | Concurrent checkouts for the last unit can't oversell — a conditional `UPDATE` inside a transaction guarantees one winner. |
| 🔁 **Idempotent checkout** | An `Idempotency-Key` makes double-taps / network retries return the same order instead of duplicating it. |
| 🔑 **Secure auth** | Short-lived JWT access token + rotating, revocable refresh token in an httpOnly cookie; bcrypt passwords; hashed OTPs. |
| ⚡ **Redis caching** | Read-heavy menu served from a Redis cache-aside layer with invalidation on every write. |
| 🗑️ **Soft deletes** | Products are archived (not destroyed), so historical orders never break. |
| 📝 **Audit log** | Every admin mutation is recorded (who, what, when, from where). |
| 🛵 **Delivery serviceability** | Customer geolocation + Haversine distance; **admin-configurable** delivery radius / fee / hours; out-of-range orders blocked on the client *and* re-checked on the server. |
| 🎟️ **Offers & content** | Auto/coded coupons, "coming soon" items, a blog, and legal pages — full live-site parity. |
| ✅ **Tested + CI** | Vitest + Supertest cover the security-critical paths; GitHub Actions runs lint, typecheck, tests, and build. |

---

## 🧱 Tech stack

- **Frontend:** React 19, Vite, React Router, **TanStack Query**, Tailwind, framer-motion, axios
- **Backend:** Node 22, **TypeScript**, Express 5, **Prisma**, **PostgreSQL 16**, **Redis 7**, Zod, JWT, bcrypt, pino, helmet
- **Tooling:** Docker (via Colima), Vitest + Supertest, ESLint + Prettier, GitHub Actions

---

## 🚀 Quick start

**Prerequisites:** Node 22, and a Docker runtime. On macOS without Docker Desktop:

```bash
brew install colima docker docker-compose
colima start
```

**1. Start the databases (Postgres + Redis):**

```bash
docker compose up -d
```

**2. Backend:**

```bash
cd backend
cp .env.example .env        # defaults already match docker-compose
npm install
npm run prisma:migrate      # create tables
npm run seed                # load mock data
npm run dev                 # http://localhost:5001
```

**3. Frontend (new terminal, from repo root):**

```bash
npm install
npm run dev                 # http://localhost:5173
```

> Or run both at once from the repo root with `npm run dev:all`.

### Seeded logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@krishna.test` | `Admin@123` |
| Customer | `aarav@test.com` | `Password@123` |

In dev, signup OTPs are **printed to the backend console** (no email setup needed).

---

## 📜 Scripts

**Root**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (frontend) |
| `npm run dev:all` | Run frontend + backend together |
| `npm run db:up` / `db:down` | Start / stop Postgres + Redis |
| `npm run build` | Production build (frontend) |

**Backend** (`cd backend`)

| Command | Description |
|---------|-------------|
| `npm run dev` | API with hot reload (tsx) |
| `npm run build` / `start` | Compile to JS / run compiled |
| `npm run prisma:migrate` | Create/apply a migration |
| `npm run seed` | Seed mock data |
| `npm test` | Run the test suite |
| `npm run lint` / `typecheck` | Lint / type-check |

---

## 🧪 Testing & CI

```bash
cd backend && npm test
```

Tests run against an **isolated schema** (`krishna_test`) in the same Postgres
instance, so they never touch dev data. Coverage focuses on the things that
matter: price tampering, stock concurrency, idempotency, and auth/RBAC.

CI (`.github/workflows/ci.yml`) spins up Postgres + Redis service containers and
runs lint → typecheck → tests → build on every push and PR.

---

## 📁 Project structure

```
.
├─ src/                      # React frontend (UI unchanged from the live site)
│  ├─ api/ hooks/            # React Query data layer
│  ├─ context/               # Auth + Cart providers
│  └─ pages/ components/ admin/
├─ backend/
│  ├─ prisma/schema.prisma   # data model (source of truth)
│  └─ src/
│     ├─ config/ db/ lib/ middleware/
│     ├─ modules/{auth,order,product,admin}/   # feature modules (routes→controller→service)
│     ├─ app.ts server.ts
│     └─ tests/
├─ docker-compose.yml        # local Postgres + Redis
└─ docs/                     # LEARNINGS.md, ARCHITECTURE.md
```
