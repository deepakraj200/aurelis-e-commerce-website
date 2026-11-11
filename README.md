# AURELIS — Premium Technology Commerce

AURELIS is a complete e-commerce platform for a luxury technology brand: a React storefront with a
titanium-and-glass design language, a Node/Express REST API, MongoDB persistence, JWT cookie
authentication, cart and wishlist sync, sandbox/Stripe checkout, order tracking, reviews and a
separate admin dashboard.

This is a working application, not a UI prototype: every page talks to the real API, stock is
validated server-side, payments are verified before an order is confirmed, and admin routes are
protected by server-side role checks.

---

## Quick start

Requirements: **Node.js 20+** and npm. No external database is required for development — the API
starts an embedded MongoDB engine and persists it under `backend/.data/db`.

```bash
npm install
cp backend/.env.example backend/.env   # first time only (a working .env is already provided)
npm run dev
```

| Service   | URL                            |
| --------- | ------------------------------ |
| Storefront| http://127.0.0.1:5173          |
| Admin     | http://127.0.0.1:5173/admin    |
| REST API  | http://localhost:5000/api      |
| Health    | http://localhost:5000/api/health |

On first boot the API seeds the catalog, demo customers, twelve months of orders and reviews.
Subsequent boots skip seeding when the catalog already exists.

### Demo accounts

| Role     | Email               | Password     |
| -------- | ------------------- | ------------ |
| Admin    | `admin@aurelis.com` | `Admin@12345`|
| Customer | `demo@aurelis.com`  | `Demo@12345` |

Change `ADMIN_PASSWORD` / `DEMO_PASSWORD` (or remove the accounts) before any public deployment.

---

## Features

**Storefront**

- Cinematic home page with hero product, featured collections, trending / new arrival / best seller
  rails, recommendations and newsletter signup.
- Shop with search, category, price, rating, availability and sale filters, five sort modes and
  pagination.
- Product pages with gallery, variants (colour/size), specifications, stock state, reviews from
  verified purchasers, related products, quick view and buy-now.
- Persistent cart with server-side totals (subtotal, shipping, tax, free-shipping threshold) and
  guest-to-account cart merge; wishlist with move-to-bag.
- Checkout with saved or new shipping address, card (Stripe test mode or built-in sandbox) or cash
  on delivery, order confirmation and a full tracking timeline.
- Account area: profile, password, addresses, order history, order detail, cancellation of eligible
  orders, order tracking.
- Authentication: register, login, logout, forgot/reset password, session renewal via httpOnly
  cookie.

**Admin**

- Dashboard: revenue, orders, customers, products, low-stock count, twelve-month revenue chart,
  recent orders and best sellers.
- Product management: create, edit, delete, image upload (local disk or Cloudinary), category
  assignment, pricing, stock, featured flag.
- Order management: search, filter, inspect customer and items, advance status through the allowed
  flow, cancel, refund.
- Customer management: search, account detail with order history, suspend/reactivate, promote to
  admin.

**Platform**

- Zod request validation, centralised error handling, helmet, CORS allow-list, sanitisation,
  rate limiting, hashed passwords (bcrypt), JWT versioning for session invalidation.
- Idempotent order creation, stock revalidation and restoration, payment-intent verification,
  duplicate-callback protection.
- Responsive layout, reduced-motion support, skeleton/empty/error states and toast notifications.

---

## Scripts

Run from the repository root.

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | API (nodemon) and Vite dev server together             |
| `npm run dev:api`    | API only                                               |
| `npm run dev:web`    | Storefront only                                        |
| `npm run build`      | Type-check and build the storefront into `frontend/dist`|
| `npm start`          | Start the API without nodemon                          |
| `npm run seed`       | Run the seed script explicitly                         |

---

## Configuration

### Backend — `backend/.env`

Copy `backend/.env.example` and adjust. Everything has a safe development default.

| Variable | Purpose | Development default |
| -------- | ------- | ------------------- |
| `PORT` | API port | `5000` |
| `CLIENT_URL` | Allowed browser origins (comma separated) | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string (Atlas, local, …) | empty → embedded MongoDB |
| `ENABLE_MEMORY_DB` | Use the embedded database when `MONGODB_URI` is empty | `true` |
| `AUTO_SEED` | Seed demo data on boot when the catalog is empty | `true` |
| `JWT_SECRET` | Token signing secret (**required in production**) | ephemeral dev secret |
| `TAX_RATE`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` | Commerce totals | `0.08`, `12`, `150` |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Enable Stripe test mode | empty → sandbox processor |
| `CLOUDINARY_*` | Upload images to Cloudinary | empty → local `backend/uploads` |
| `SMTP_*`, `EMAIL_FROM` | Transactional email | empty → console logger |

Notes:

- **Payments.** With Stripe keys set, the API creates real Stripe PaymentIntents using test keys;
  otherwise a built-in sandbox processor issues single-use intents so the full checkout flow works
  offline. Card numbers are validated client-side and never sent to the API outside the Stripe flow.
- **Email.** Without SMTP, order and reset emails are logged to the API console. In development the
  reset link is also returned as `devResetUrl` so password reset can be exercised locally.
- **Uploads.** Local uploads are served from `/uploads`; run the API and storefront from the same
  hostname (the Vite proxy handles this) so uploaded images load.
- **Database reset.** Stop the API, delete `backend/.data/db`, restart — the demo data is rebuilt.
  This deletes all local users, orders and uploads metadata.

### Frontend — `frontend/.env`

Optional; see `frontend/.env.example`.

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `VITE_API_URL` | API base URL used by the browser | `/api` (proxied) |
| `VITE_API_PROXY` | Dev-server proxy target | `http://127.0.0.1:5000` |

---

## Project structure

```
frontend/
  src/
    components/   # UI primitives, layout, product, checkout, admin widgets
    pages/        # storefront, auth and admin routes
    layouts/      # main, auth and admin shells
    hooks/        # data fetching helpers
    services/     # typed API clients (axios)
    store/        # Zustand stores (auth, cart, wishlist, UI)
    context/      # runtime configuration
    utils/        # formatting, card validation, constants
backend/
  config/         # environment, database, commerce constants
  controllers/    # HTTP handlers
  middleware/     # auth, validation, sanitisation, uploads, errors, limits
  models/         # Mongoose schemas and indexes
  routes/         # REST route definitions
  services/       # seed, orders, Stripe, mailer, Cloudinary
  utils/          # token, helpers, ApiError, seed entrypoint
  server.js       # bootstrap: DB, seeding, expiry sweep, listener
```

---

## API

Full endpoint reference, payloads and status codes: **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**.

Authentication uses an httpOnly cookie (`aurelis_token`) and also accepts
`Authorization: Bearer <token>`. All responses share a `{ success, message?, data?, meta? }`
envelope; errors return `{ success: false, message, details? }`.

---

## Security notes

- Passwords are hashed with bcrypt and never serialised; JWT secrets are environment-only and
  rotating a password increments a token version that invalidates older sessions.
- Admin endpoints require both a valid session and the `admin` role; customer orders are scoped to
  the authenticated user.
- Cart and order totals are always recalculated on the server; client prices are never trusted.
- Order creation validates stock and uses an optional idempotency key; payment confirmation is
  verified server-side and repeated callbacks are rejected.
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, real database credentials and `CLIENT_URL`
  before deploying. Do not ship the development `.env`.
