# LEARNINGS — TypeScript & Enterprise Patterns, explained

This is your guided tour of everything we built. It assumes you know JavaScript
and React but **not** TypeScript, and goes basics → advanced. Every concept is
tied to a real file in this repo so you can read the code right after.

> How to use it: read a section, then open the file it points to. The code has
> short comments that reinforce the same ideas.

**Contents**
1. [TypeScript from zero](#part-1--typescript-from-zero)
2. [Backend patterns](#part-2--backend-patterns)
3. [Frontend patterns](#part-3--frontend-patterns)
4. [Infra, testing, CI](#part-4--infra-testing-ci)
5. [Interview talking points](#part-5--interview-talking-points)

---

## PART 1 — TypeScript from zero

### 1.1 What it is and why we use it

TypeScript is JavaScript **plus types**. You annotate what shape your data has,
and a compiler checks — *before the code runs* — that you never use it wrong.
The `i.qty` vs `i.quantity` bug that existed in the old frontend? TypeScript
catches that the instant you type it.

Types are erased at build time: the thing that actually runs is plain JS.

### 1.2 How TypeScript runs here

- **`tsx`** runs `.ts` files directly in dev (`npm run dev` → `tsx watch src/server.ts`). No build step while developing.
- **`tsc`** (the compiler) does two jobs: `npm run typecheck` (check types, emit nothing) and `npm run build` (emit JS to `dist/`).
- **`tsconfig.json`** configures both. Key flags (see [backend/tsconfig.json](../backend/tsconfig.json)):
  - `"strict": true` — the whole point; turns on all the safety checks.
  - `"target": "ES2022"`, `"module": "CommonJS"` — modern JS, simple module system (so `__dirname` works and imports need no `.js` extensions).
  - `"esModuleInterop": true` — lets `import express from "express"` work with CommonJS packages.

### 1.3 Basic types & inference

```ts
let name: string = "Krishna";   // explicit annotation
let price = 260;                // inferred as number — no annotation needed
const items: string[] = [];     // array of strings
```

Rule of thumb: **annotate function inputs and public boundaries; let TS infer
the rest.** Over-annotating is noise.

### 1.4 `interface` vs `type`

Both describe object shapes. `interface` is for objects you might extend;
`type` is more flexible (unions, primitives, etc.). We use `type` for inputs and
`interface` for structured payloads — e.g. [backend/src/lib/jwt.ts](../backend/src/lib/jwt.ts):

```ts
export type AccessTokenPayload = { id: string; role: Role };
```

### 1.5 Union & literal types, enums

A **union** is "one of these":

```ts
type MailDriver = "console" | "smtp";   // string literal union
```

Used in [config/env.ts](../backend/src/config/env.ts) so `MAIL_DRIVER` can only
ever be those two values. Prisma generates real **enums** (`Role`,
`OrderStatus`) from the schema — see how we map them to display strings in
[lib/serialize.ts](../backend/src/lib/serialize.ts).

### 1.6 `null`/`undefined`, optional, `unknown` vs `any`, narrowing

- `field?: string` — the property may be absent (`string | undefined`).
- **`any`** = "turn off type checking" (avoid it). **`unknown`** = "I don't know
  the type yet — prove it before using it." We catch errors as `unknown` and
  *narrow*:

```ts
} catch (err) {
  if (err instanceof Error && err.name === "TokenExpiredError") { ... }
}
```

That `if` is **type narrowing**: inside the block, TS knows `err` is an `Error`.
See [middleware/auth.ts](../backend/src/middleware/auth.ts).

### 1.7 Generics

A generic is a **type parameter** — a function that works for many types while
staying type-safe. Our cache helper ([lib/cache.ts](../backend/src/lib/cache.ts)):

```ts
export async function cached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T>
```

`<T>` means "whatever type `fetcher` returns, `cached` returns the same." Call it
with a product fetcher → you get `Product[]` back, fully typed. No casting.

`asyncHandler` ([lib/asyncHandler.ts](../backend/src/lib/asyncHandler.ts)) uses
Express's own generic handler types the same way.

### 1.8 Utility types

TypeScript ships helpers that transform types:

- `Partial<T>` — all fields optional
- `Pick<T, "a" | "b">` — keep only some fields
- `Omit<T, "a">` — drop some fields
- `Record<K, V>` — a map from keys `K` to values `V`

Real examples in [lib/serialize.ts](../backend/src/lib/serialize.ts):

```ts
const STATUS_TO_DISPLAY: Record<OrderStatus, string> = { ... };
user?: Pick<User, "id" | "name" | "email" | "phone"> | null;
```

`Record<OrderStatus, string>` forces us to handle *every* status (miss one → compile error).

### 1.9 Typing Express + declaration merging

Express's `Request` doesn't know about our `req.user`. We **merge** a new field
into its type without editing the library — [src/types/express.d.ts](../backend/src/types/express.d.ts):

```ts
declare global {
  namespace Express {
    interface Request { user?: AccessTokenPayload; }
  }
}
```

Now `req.user.id` is typed everywhere after `requireAuth` runs.

### 1.10 Zod + `z.infer` — one source of truth

Zod validates untrusted input *at runtime*. `z.infer` derives the *compile-time*
type from the same schema, so the two can never drift. See
[modules/auth/schemas.ts](../backend/src/modules/auth/schemas.ts):

```ts
export const signupSchema = z.object({ email: z.string().email(), /* ... */ });
export type SignupInput = z.infer<typeof signupSchema>;  // type derived from the validator
```

One definition → both the runtime check and the static type. This is one of the
most elegant patterns in the whole codebase.

---

## PART 2 — Backend patterns

### 2.1 Layered / modular architecture

Each request flows **routes → controller → service → database**, each layer with
one job (see any folder under [backend/src/modules/](../backend/src/modules/)):

- **routes** declare URLs + attach middleware.
- **controller** handles HTTP only (read `req`, send `res`).
- **service** holds business logic + data access — *no `req`/`res`*, so it's
  trivially unit-testable and reusable.

Why it matters: you can test `placeOrder()` without Express, and swap the DB by
touching only services. This separation is the #1 "this person has built real
systems" signal.

### 2.2 Validated config

`process.env.X` is `string | undefined` and easy to typo. We parse the whole
environment **once** with Zod at boot ([config/env.ts](../backend/src/config/env.ts)).
Missing/invalid var → the app exits immediately with a clear message, never
fails mysteriously at runtime.

### 2.3 Prisma — the data layer

- **Schema** ([prisma/schema.prisma](../backend/prisma/schema.prisma)) is the single
  source of truth. `prisma migrate` turns it into versioned SQL + a fully typed
  client.
- **Indexes** (`@@index([category])`, `@@index([userId])`, …) make lookups
  O(log n) instead of full table scans. Index what you filter/sort by.
- **Relations** (`Order` ↔ `OrderItem` ↔ `Product`) are declared once and give
  you type-safe `include`.
- **Client singleton** ([db/prisma.ts](../backend/src/db/prisma.ts)) — one client,
  reused. Creating many exhausts the DB connection pool (a classic prod bug).
- **Client extension (soft delete)** — the same file teaches Prisma to auto-filter
  `deletedAt: null` on reads, so deleted products vanish from queries while
  staying in the DB.

### 2.4 The four correctness/security patterns

These live mostly in [modules/order/service.ts](../backend/src/modules/order/service.ts)
and the product/admin services. Each has a test.

**(a) Price integrity.** The server *recomputes* every line from the DB and
ignores the client's price/total. Try it: the test in
[tests/order.integrity.test.ts](../backend/tests/order.integrity.test.ts) sends
₹1 for a ₹500 item and asserts the stored total is ₹500.

**(b) Atomic stock (concurrency).** To avoid overselling the last cake under two
simultaneous orders, we don't "read then write" (that races). We do an **atomic
conditional update** inside a transaction:

```ts
UPDATE product SET stock = stock - qty WHERE id = ? AND stock >= qty
```

Exactly one concurrent statement matches → one winner. See
[tests/order.concurrency.test.ts](../backend/tests/order.concurrency.test.ts):
5 parallel orders for 1 unit → 1 success, 4 rejected, stock = 0.

**(c) Idempotency.** [middleware/idempotency.ts](../backend/src/middleware/idempotency.ts)
"reserves" the client's `Idempotency-Key` (a unique DB row) before processing,
then stores the response. A replay returns the stored response → no duplicate
order. The unique constraint also defeats concurrent duplicates.

**(d) Soft delete + audit.** Deleting a product sets `deletedAt` (history-safe);
every admin mutation writes an `AuditLog` row ([lib/audit.ts](../backend/src/lib/audit.ts)).

### 2.5 Auth deep-dive

- **Passwords**: hashed with bcrypt (slow on purpose → brute-force resistant).
- **OTP**: generated with `crypto.randomInt` (not `Math.random`) and stored
  *hashed*.
- **Two-token model** ([lib/jwt.ts](../backend/src/lib/jwt.ts),
  [modules/auth/service.ts](../backend/src/modules/auth/service.ts)):
  - *Access token* — short-lived (15 min), sent on every request. Stateless.
  - *Refresh token* — long-lived, in an **httpOnly cookie** (invisible to JS →
    safe from XSS), stored **hashed** in the DB so it can be **revoked** (logout)
    and **rotated** (each refresh issues a new one and revokes the old). A stolen,
    replayed refresh token is already revoked → access denied.

### 2.6 Error handling

`throw ApiError.notFound("Order not found")` anywhere; `asyncHandler` forwards it;
one central [errorHandler.ts](../backend/src/middleware/errorHandler.ts) formats
*every* response identically and hides internal details in production. No more
repetitive try/catch, no more inconsistent `{ error }` vs `{ msg }` shapes (it
sends both, because the frontend reads each in different places).

### 2.7 Hardening & observability

- **helmet** — sets ~12 protective HTTP headers.
- **cors** with `credentials: true` — needed for the refresh cookie; dev allows
  any localhost port, prod only configured origins.
- **rate limiting** — global + a stricter limit on auth endpoints.
- **pino** — structured, leveled logging (pretty in dev, JSON in prod) replacing
  `console.log`.
- **graceful shutdown** ([server.ts](../backend/src/server.ts)) — on SIGTERM,
  stop accepting connections, drain, close DB/Redis, exit.

### 2.8 Redis cache-aside

The menu is read constantly and changes rarely → perfect cache candidate. The
pattern ([lib/cache.ts](../backend/src/lib/cache.ts)): check Redis → on miss hit
the DB, store with a TTL → on every product write, **invalidate** the keys. Every
Redis call is wrapped so a cache outage degrades gracefully to the DB.

---

## PART 3 — Frontend patterns

> The visual UI is byte-for-byte unchanged. Everything below is *under the hood*.

### 3.1 TanStack Query (React Query)

Replaces the repeated `useState(loading)` + `useEffect(fetch)` + `try/catch` in
every page with one declarative hook ([src/hooks/](../src/hooks/)):

```js
export const useMenu = () => useQuery({ queryKey: ["menu"], queryFn: ... });
```

You get caching, request dedupe, retries, and background refetch for free.
`refetchInterval: 10_000` gives live order tracking and *pauses when the tab is
hidden* — better than the old `setInterval`. **Mutations** (`usePlaceOrder`,
`useToggleStock`, …) invalidate the relevant query keys so the UI updates itself.

### 3.2 AuthContext — single source of truth

Previously `ProtectedRoute`, `CartPage`, and `Accounts` each read `localStorage`
independently and could drift. Now they all read
[context/AuthContext.jsx](../src/context/AuthContext.jsx) (`user`, `isAuthenticated`,
`isAdmin`, `login`, `logout`).

### 3.3 ErrorBoundary

A render-time crash now shows a recovery screen instead of a blank page
([components/ErrorBoundary.jsx](../src/components/ErrorBoundary.jsx)). Error
boundaries are the one place React still needs class components.

### 3.4 Silent token refresh

The access token expires in 15 min, but users never get logged out: the axios
interceptor ([utils/api.js](../src/utils/api.js)) catches a `401`, calls
`/user/refresh` once, retries the original request, and **queues** any
concurrent requests so it only refreshes once. No hard page reloads.

### 3.5 The serialization shim (how the UI stayed identical)

We swapped MongoDB → Postgres without touching a single component, because
[backend/src/lib/serialize.ts](../backend/src/lib/serialize.ts) translates the new
shapes into exactly what the old UI expects (`id`→`_id`, enum→display string,
role→lowercase, relation→nested `userId`). When you must preserve a contract,
adapt at the boundary — don't rewrite the consumers.

---

## PART 4 — Infra, testing, CI

- **Docker + Colima** — [docker-compose.yml](../docker-compose.yml) runs Postgres +
  Redis as isolated containers. Same versions for everyone; nothing installed
  system-wide. This is the "isolated local DB with mock data" requirement.
- **Seeding** — [db/seed.ts](../backend/src/db/seed.ts) fills an empty DB with
  realistic data so the app runs the moment you clone it.
- **Testing** — Vitest (runner) + Supertest (HTTP-level requests against the app
  with no real port). Tests use an **isolated schema** (`krishna_test`) Prisma
  creates on the fly, so they never touch dev data. We test the *risky* paths,
  not getters.
- **CI** — [.github/workflows/ci.yml](../.github/workflows/ci.yml) starts Postgres
  + Redis service containers and runs lint → typecheck → test → build on every
  push/PR. Green CI = nothing broken merges.
- **ESLint + Prettier** — consistent style + a safety net of static checks.

---

## PART 5 — Interview talking points

Map each feature to a sentence you can say out loud:

| If they ask… | Say… |
|--------------|------|
| "Walk me through your project." | "A bakery ordering system. The interesting parts are checkout correctness and auth: server-side price recomputation, atomic stock to prevent overselling, and idempotent order placement." |
| "How do you prevent overselling?" | "A conditional `UPDATE ... WHERE stock >= qty` inside a transaction — atomic at the row level, so exactly one concurrent order wins. I have a test that fires 5 parallel orders for 1 unit." |
| "How is auth secured?" | "Short-lived JWT access token + a rotating, revocable refresh token in an httpOnly cookie; bcrypt passwords; hashed OTPs. The frontend silently refreshes on 401." |
| "How do you keep the API fast?" | "Redis cache-aside on the read-heavy menu, invalidated on writes; plus DB indexes on every filtered column." |
| "How do you know it works?" | "Vitest + Supertest cover the security-critical paths, and CI runs them with real Postgres/Redis on every push." |

**What SDE companies actually look for** (recap): a project that *runs in one
command*, has *tests + green CI*, a README that explains *decisions*, and *one
hard problem solved well* you can whiteboard. Depth on one project beats five
shallow ones.

**For your next project**, pick a domain with a genuine technical core (a
rate-limited URL shortener, a real-time chat, a job queue, a mini ledger), bake
in TypeScript + tests + CI + Docker from day one, deploy it to a live URL, and
write up one tradeoff you made. That combination is rare and hireable.

---

## PART 6 — Delivery & serviceability (the geofence)

This layer brings the app to parity with the live site.

- **Admin-controlled `StoreSettings`** (one singleton row): bakery lat/lng,
  delivery radius, free-delivery radius, fee rate, and business hours. The
  radius is **chosen by the admin** — nothing is hard-coded.
- **Location capture**: the browser **Geolocation API** gives the customer's
  lat/lng (no map widget, no API key). It's persisted in `localStorage` via
  `DeliveryContext`, which derives distance/serviceability for every page.
- **Distance**: the **Haversine** formula ([lib/geo.ts](../backend/src/lib/geo.ts)
  and its client mirror [src/lib/serviceability.js](../src/lib/serviceability.js)) —
  straight-line km, perfect for a service-radius check.
- **Server-authoritative geofence** (same principle as the price fix): at
  `place-order` the server recomputes distance, rejects anything outside the
  radius or outside hours, and recomputes the delivery fee. The client greys the
  button only for UX — `tests/serviceability.test.ts` proves a forged
  out-of-range order is still rejected.
- **Distance-based fee**: free within the free-radius, then `base + perKm` beyond
  it ([lib/serviceability.ts](../backend/src/lib/serviceability.ts)).
- **Coupons**: a coupon engine with explicit codes and **auto-offers**
  (e.g. "Flat ₹50 above ₹299"); the server resolves the discount, never the client.
- **Manual dispatch**: each order carries the customer's location + phone, and
  admin assigns a rider by name from the Kitchen Board (an "Open in Maps" link
  uses a plain `google.com/maps?q=lat,lng` URL — still keyless). No live
  agent-GPS tracking (out of scope by design).
