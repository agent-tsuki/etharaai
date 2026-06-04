# EtharaAI — Inventory & Order Management System

A full-stack web application for managing products, customers, and orders — built with FastAPI and React, deployed across Vercel and Railway.

**Live Demo**
- Frontend: https://etharaai-frontend-blush.vercel.app/
- Backend API: https://etharaai-backend.vercel.app/docs
- Default login: `admin@admin.in` / `Admin@123`

---

## What it does

EtharaAI is an internal operations tool that lets a business manage its inventory lifecycle end to end:

- **Products** — add stock, update pricing, track low-inventory alerts
- **Customers** — maintain a customer directory linked to purchase history
- **Orders** — place orders with automatic stock deduction and real-time total calculation
- **Users** — role-based access control (admin / manager / agent) with per-user permission overrides
- **Dashboard** — aggregate view of total products, customers, orders, and low-stock warnings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Vite |
| Backend | FastAPI 0.111, Python 3.12 |
| ORM | SQLAlchemy 2.0 (Mapped column syntax) |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | JWT (access + refresh token rotation), bcrypt |
| Rate Limiting | SlowAPI |
| Containerisation | Docker, Docker Compose |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway (Docker) / Vercel serverless |

---

## Architecture

```
etharaai/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── pages/     # Dashboard, Products, Customers, Orders, Users
│       ├── components/
│       └── context/   # AuthContext, NotificationContext
└── backend/
    └── app/
        ├── api/v1/    # Route handlers (auth, products, customers, orders, users)
        ├── services/  # Business logic layer
        ├── repositories/  # Data access layer (repository pattern)
        ├── models/    # SQLAlchemy ORM models
        ├── schemas/   # Pydantic request/response validation
        └── core/      # Security, exceptions, logging, bloom filter
```

The backend follows a strict **layered architecture**: routes call services, services call repositories, repositories talk to the database. No repository code in routes, no ORM queries in services.

### Notable engineering decisions

**Bloom filter caching** — `EntityBloomCache` in `app/core/bloom_filter.py` wraps a probabilistic bit-array in front of every product SKU/ID and customer email lookup. False positives trigger a DB round-trip (handled), false negatives are impossible — so a cache miss short-circuits a DB query entirely. Filters rebuild from a lightweight `(id, sku)` query every 5 minutes per worker, thread-safe via `RLock`.

**SELECT FOR UPDATE on stock** — `create_order` locks product rows with `WITH FOR UPDATE` before decrementing stock, preventing oversell under concurrent requests.

**JWT refresh token rotation** — access tokens expire in 60 minutes; refresh tokens are opaque SHA-256 hashes stored server-side and rotated on every use. Password reset invalidates all active sessions.

**Rate limiting** — login is limited to 10 requests/minute, forgot-password to 5 requests/minute via SlowAPI.

**Alembic migrations with idempotent seed** — the admin user is seeded with an `ON CONFLICT DO UPDATE` upsert so re-running migrations never duplicates data.

---

## Running locally

### Option 1 — Docker Compose (recommended)

Requires: Docker, Docker Compose

```bash
git clone https://github.com/your-username/etharaai.git
cd etharaai
cp .env.example .env          # edit passwords if needed
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

The backend container waits for PostgreSQL to be healthy, then runs `alembic upgrade head` automatically before starting.

---

### Option 2 — Manual setup

**Prerequisites:** Python 3.12+, Node 18+, PostgreSQL 16

**Backend**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set environment variables (copy from .env.example and fill in)
export DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
export SECRET_KEY=your-random-secret-key
export DEBUG=true                  # exposes reset token in API response for local testing

alembic upgrade head               # creates tables + seeds admin user
uvicorn app.main:app --reload
```

API available at http://localhost:8000 — interactive docs at http://localhost:8000/docs

**Frontend**

```bash
cd frontend
npm install
# create frontend/.env with:
# VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend available at http://localhost:5173

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes (prod) | JWT signing key — app refuses to start without it in production |
| `ALLOWED_ORIGINS` | Yes | Comma or JSON array of allowed CORS origins |
| `DEBUG` | No | `true` returns reset token in API response; omit in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: 60 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Default: 7 |
| `LOG_LEVEL` | No | Default: INFO |

---

## API overview

All endpoints return a consistent envelope:

```json
{ "status": "ok", "data": { ... } }
{ "status": "fail", "msg": "...", "error_code": "..." }
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | — | Create account |
| POST | `/api/v1/auth/login` | — | Get access + refresh tokens |
| POST | `/api/v1/auth/refresh` | — | Rotate refresh token |
| POST | `/api/v1/auth/forgot-password` | — | Request password reset |
| POST | `/api/v1/auth/reset-password` | — | Reset password (invalidates all sessions) |
| GET | `/api/v1/products` | — | List products (filterable by name, SKU, stock, price) |
| POST | `/api/v1/products` | admin/manager | Create product |
| PUT | `/api/v1/products/{id}` | admin/manager | Update product |
| DELETE | `/api/v1/products/{id}` | admin/manager | Delete product |
| GET | `/api/v1/customers` | — | List customers |
| POST | `/api/v1/customers` | admin/manager | Create customer |
| GET | `/api/v1/orders` | — | List orders (filterable by status, date, amount) |
| POST | `/api/v1/orders` | authenticated | Place order (auto-deducts stock) |
| DELETE | `/api/v1/orders/{id}` | admin/manager | Cancel order (restores stock) |
| GET | `/api/v1/users` | admin | List users |
| PATCH | `/api/v1/users/{id}/role` | admin | Change user role |
| GET | `/api/v1/dashboard` | authenticated | Aggregated stats + low-stock alerts |

Full interactive documentation: https://etharaai-backend.vercel.app/docs

---

## Deployment

### Frontend — Vercel

```bash
cd frontend
vercel --prod
# Set VITE_API_URL to your backend URL in the Vercel dashboard
```

### Backend — Railway (Docker)

Push to your Railway project — the `railway.toml` and `Dockerfile` handle the rest. Set `DATABASE_URL`, `SECRET_KEY`, and `ALLOWED_ORIGINS` as Railway service variables.

### Backend — Vercel (serverless)

```bash
cd backend
vercel --prod
# Set DATABASE_URL and SECRET_KEY as Vercel environment variables
```

---

## User roles

| Role | Capabilities |
|---|---|
| `admin` | Full access including user management, role changes, deletions |
| `manager` | Create/update products, customers, orders; no user management |
| `agent` | Read-only access + place orders |

Roles can be combined with per-user permission overrides set by admins.

---

## Database schema

```
users            — id, email, hashed_password, full_name, role, is_active, permissions
products         — id, name, sku (unique), price, quantity, created_at, updated_at
customers        — id, full_name, email (unique), phone, created_at
orders           — id, customer_id, total_amount, status, created_at
order_items      — id, order_id, product_id, quantity, unit_price
refresh_tokens   — id, token_hash, user_id, expires_at, revoked
password_reset_tokens — id, token_hash, user_id, expires_at, used
```

Migrations are in `backend/alembic/versions/` and run automatically on container start.
