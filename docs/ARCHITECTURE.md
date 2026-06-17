# Architecture

## System overview

```mermaid
flowchart LR
  subgraph Browser
    UI["React 19 + Vite SPA<br/>(React Query, AuthContext)"]
  end
  subgraph Server["Node 22 · Express 5 · TypeScript"]
    API["REST API<br/>routes → controller → service"]
  end
  PG[("PostgreSQL 16<br/>(Prisma)")]
  RD[("Redis 7<br/>(cache)")]

  UI -- "axios + JWT (x-auth-token)" --> API
  UI -. "httpOnly refresh cookie" .-> API
  API --> PG
  API -- "cache-aside (menu)" --> RD
```

The frontend talks to the API over JSON. The **access token** rides in the
`x-auth-token` header; the **refresh token** lives in an httpOnly cookie the
browser sends automatically. Postgres is the source of truth; Redis is a
read-through cache for the menu only.

## Request lifecycle (middleware order)

```
helmet → cors(credentials) → cookieParser → json body parser
       → pino-http (logging) → rate limiter
       → route → [requireAuth] → [adminOnly] → [validate(zod)] → [idempotency]
       → controller → service → Prisma/Redis
       → (on throw) asyncHandler → central errorHandler
```

Every async handler is wrapped so thrown errors land in **one** error handler
that returns a consistent `{ error, msg }` shape.

## Backend layering

```
routes/         URL + middleware wiring only
modules/<x>/
  schemas.ts    Zod input validation (+ inferred TS types)
  controller.ts HTTP in/out only (req → service → res)
  service.ts    business logic + data access (no req/res → unit-testable)
lib/            cross-cutting: ApiError, asyncHandler, jwt, serialize, cache, audit, logger, mailer
middleware/     auth, adminOnly, validate, idempotency, errorHandler, notFound
db/             Prisma client (+ soft-delete extension), seed
config/         Zod-validated env
```

## Data model

```mermaid
erDiagram
  User ||--o{ Order : places
  User ||--o{ RefreshToken : has
  Order ||--o{ OrderItem : contains
  Product ||--o{ OrderItem : "snapshotted in"
  User {
    string id PK
    string email UK
    string password
    Role   role
    bool   isVerified
    string otpHash
  }
  Product {
    string id PK
    int    price
    string category
    int    stockQuantity
    bool   isBestseller
    datetime deletedAt "soft delete"
  }
  Order {
    string id PK
    int    totalAmount "server-computed"
    OrderStatus status
  }
  OrderItem {
    string id PK
    string productId FK "nullable (history-safe)"
    int    price "snapshot"
    int    quantity
  }
```

`AuditLog` and `IdempotencyKey` are standalone tables (not shown) supporting
admin action history and duplicate-order prevention.

## Checkout flow (the critical path)

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as Postgres
  C->>A: POST /place-order (Idempotency-Key, items)
  A->>DB: reserve idempotency key (unique)
  Note over A,DB: replay? → return stored response
  A->>DB: BEGIN TRANSACTION
  loop each item
    A->>DB: read product (price, availability)
    A->>DB: UPDATE stock WHERE stock >= qty (atomic)
    Note over A: total += DB price (client price ignored)
  end
  A->>DB: create order + items, COMMIT
  A-->>C: 201 { order } (persisted under the idempotency key)
```

## Compatibility shim (why the UI never changed)

The original frontend was built for MongoDB. The Prisma backend keeps it working
untouched via `lib/serialize.ts`:

- Prisma `id` (cuid) → exposed as **`_id`**
- `OrderStatus` enum (`ORDER_PLACED`) → **`"Order Placed"`** display strings
- `Role` enum (`ADMIN`) → lowercase **`"admin"`**
- loaded `user` relation → nested **`userId`** object (mimics Mongoose populate)
