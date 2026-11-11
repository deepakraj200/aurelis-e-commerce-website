# AURELIS REST API

Base URL: `http://localhost:5000/api` (development).

The API is a JSON REST service built with Express and MongoDB. All mutating endpoints validate
their payloads with Zod, and every response uses the same envelope.

---

## Conventions

### Response envelope

Success:

```json
{ "success": true, "message": "Optional human message", "data": { }, "meta": { } }
```

Error:

```json
{
  "success": false,
  "message": "Human readable description",
  "details": [{ "field": "email", "message": "Enter a valid email address" }]
}
```

`details` is present for validation failures (`422`). Stack traces are never returned.

### Authentication

Sessions use an httpOnly cookie named `aurelis_token` (set by register/login/reset). The token is
also accepted as a bearer token, which is useful for scripts:

```
Authorization: Bearer <token>
Cookie: aurelis_token=<token>
```

`POST /auth/register`, `POST /auth/login` and `POST /auth/reset-password` return the token in
`data.token` in addition to setting the cookie. Passwords are bcrypt hashes; tokens expire after
`JWT_EXPIRES_IN` (default 7 days) and are invalidated by a server-side token version when the
password changes or an account is suspended.

### Pagination

List endpoints accept `page` (default 1) and `limit` (default 12, maximum 48–50 per endpoint) and
return:

```json
{ "meta": { "page": 1, "pages": 4, "total": 42, "limit": 12 } }
```

### Status codes

| Code | Meaning |
| ---- | ------- |
| 200 | OK |
| 201 | Created |
| 304 | Not modified (conditional GET) |
| 400 | Malformed request / invalid or expired reset token |
| 401 | Not authenticated, invalid/expired session, bad credentials |
| 403 | Authenticated but not allowed (role or resource ownership) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, category still in use, duplicate payment callback) |
| 422 | Validation failed or business rule rejected |
| 429 | Rate limited |
| 500 | Unexpected server error |

### Rate limits

Global API limits apply, with stricter limits on authentication and write endpoints. Exceeding a
limit returns `429` with a retry message.

### Currency and totals

Amounts are numbers in the store currency (default `USD`). Cart and order totals are always
recomputed server-side: `subtotal`, `shippingCost` (free at the configured threshold), `tax` and
`totalAmount`.

---

## Meta and configuration

### `GET /health`

Public. Returns service status, database state, uptime and environment.

### `GET /config`

Public. Storefront runtime configuration.

```json
{
  "data": {
    "brand": "AURELIS",
    "currency": "USD",
    "taxRate": 0.08,
    "shippingFee": 12,
    "freeShippingThreshold": 150,
    "payments": { "stripeEnabled": false, "sandbox": true, "publishableKey": "" },
    "cloudinaryEnabled": false
  }
}
```

### `POST /newsletter`

Public.

```json
{ "email": "reader@example.com", "source": "footer" }
```

Returns `201` when added, `200` when the address is already subscribed.

### `POST /contact`

Public.

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "subject": "Product availability",
  "message": "When will the Optic M1 return to stock?"
}
```

Returns `201` with `data.reference` (message id) and `data.createdAt`.

---

## Authentication and account

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/auth/register` | — | Create an account and start a session |
| POST | `/auth/login` | — | Sign in |
| POST | `/auth/logout` | — | Clear the session cookie |
| POST | `/auth/forgot-password` | — | Email a reset link |
| POST | `/auth/reset-password` | — | Set a new password with a reset token |
| GET | `/auth/me` | user | Current user |
| PUT | `/auth/profile` | user | Update name, phone or avatar |
| PUT | `/auth/password` | user | Change password (requires current password) |
| POST | `/auth/addresses` | user | Add a saved address |
| PUT | `/auth/addresses/:addressId` | user | Update a saved address |
| DELETE | `/auth/addresses/:addressId` | user | Delete a saved address |

### Register

```json
{ "name": "Alex Rivera", "email": "alex@example.com", "password": "Aurelis123" }
```

Password rules: 8–72 characters, at least one lowercase letter, one uppercase letter and one digit.
Returns `201` with `{ user, token }` and sets the cookie. Duplicate email → `409`.

### Login

```json
{ "email": "alex@example.com", "password": "Aurelis123" }
```

Returns `{ user, token }`. Invalid credentials → `401`. Suspended account → `403`.

### Forgot / reset password

```json
{ "email": "alex@example.com" }
```

Always returns `200` with a generic message. In development, when no SMTP transport is configured,
the reset URL is also returned as `devResetUrl` and logged to the API console.

```json
{ "token": "<token from the reset URL>", "password": "NewAurelis123" }
```

Returns a fresh session. Invalid or expired token → `400`.

### Profile and addresses

`PUT /auth/profile` accepts any of `name`, `phone`, `avatar`.

Address body:

```json
{
  "label": "Home",
  "fullName": "Alex Rivera",
  "phone": "+1 415 555 0100",
  "line1": "1 Market Street",
  "line2": "Suite 400",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94105",
  "country": "United States",
  "isDefault": true
}
```

Up to 8 addresses per account; the first address becomes the default automatically. Address
endpoints return the full `addresses` array.

---

## Products

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/products` | — | List/filter/sort products |
| GET | `/products/filters` | — | Available filter metadata |
| GET | `/products/:id` | — | Product by id **or slug** |
| GET | `/products/:id/related` | — | Up to 4 related products |
| GET | `/products/:id/reviews` | — | Paginated reviews + rating summary |
| POST | `/products` | admin | Create a product |
| PUT | `/products/:id` | admin | Update a product |
| DELETE | `/products/:id` | admin | Archive/delete a product |

### List query parameters

| Parameter | Example | Notes |
| --------- | ------- | ----- |
| `q` | `optic` | Matches name, short description, description and tags |
| `category` | `audio` or an ObjectId | Accepts category slug or id |
| `minPrice`, `maxPrice` | `100`, `900` | Inclusive price range |
| `rating` | `4` | Minimum rating |
| `featured` | `true` | Featured only |
| `inStock` | `true` | `stock > 0` |
| `onSale` | `true` | `originalPrice > price` |
| `tag` | `wireless` | Exact tag match |
| `sort` | `newest` | `newest`, `oldest`, `price-asc`, `price-desc`, `rating`, `popular` |
| `page`, `limit` | `1`, `12` | `limit` max 48 |

Product detail returns `{ product, reviewSummary }`; the review summary is an array of
`{ _id: rating, count }` buckets.

### Product body (create; update accepts a partial)

```json
{
  "name": "Optic M1",
  "sku": "AUR-OPT-M1",
  "shortDescription": "A considered companion.",
  "description": "Full product story, materials and details.",
  "brand": "AURELIS",
  "price": 1299,
  "originalPrice": 1399,
  "category": "65f1c2a9b1e4c2d3f4a5b6c7",
  "images": ["https://example.com/optic-1.jpg"],
  "stock": 24,
  "specifications": [{ "label": "Display", "value": "6.7-inch OLED" }],
  "colors": [{ "name": "Titanium", "hex": "#8E8E93" }],
  "sizes": [],
  "featured": true,
  "isActive": true,
  "tags": ["flagship"]
}
```

`originalPrice` must be greater than or equal to `price`. `images` requires 1–8 entries.

---

## Categories

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/categories` | — | All categories with active product counts |
| POST | `/categories` | admin | Create |
| PUT | `/categories/:id` | admin | Update |
| DELETE | `/categories/:id` | admin | Delete (only when empty) |

```json
{
  "name": "Audio",
  "description": "Immersive sound, quietly engineered.",
  "image": "https://example.com/audio.jpg",
  "featured": true,
  "sortOrder": 2
}
```

Deleting a category that still contains products returns `409`.

---

## Cart

All cart routes require a session.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/cart` | Current cart with recalculated totals |
| POST | `/cart` | Add an item |
| PUT | `/cart/:itemId` | Set item quantity |
| DELETE | `/cart/:itemId` | Remove an item |
| DELETE | `/cart` | Clear the cart |
| POST | `/cart/merge` | Merge a guest cart after login |

Add:

```json
{ "productId": "65f1c2a9b1e4c2d3f4a5b6c7", "quantity": 2, "color": "Titanium", "size": "" }
```

Update:

```json
{ "quantity": 3 }
```

Merge (max 50 entries):

```json
{
  "items": [
    { "productId": "65f1c2a9b1e4c2d3f4a5b6c7", "quantity": 1, "color": "Titanium", "size": "" }
  ]
}
```

The cart response includes `items` and a `summary` with `subtotal`, `shippingCost`, `tax`,
`totalAmount` and item count. Quantity is capped at 20 and limited by available stock; unavailable
products are reported with a message rather than silently added.

---

## Wishlist

All wishlist routes require a session.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/wishlist` | Populated wishlist products |
| POST | `/wishlist` | Add a product |
| DELETE | `/wishlist/:productId` | Remove a product |
| POST | `/wishlist/merge` | Merge guest wishlist product ids |

```json
{ "productId": "65f1c2a9b1e4c2d3f4a5b6c7" }
```

```json
{ "productIds": ["65f1c2a9b1e4c2d3f4a5b6c7"] }
```

---

## Orders

All order routes require a session; customers only ever see their own orders.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/orders` | Create an order from the current cart |
| GET | `/orders` | Paginated order history |
| GET | `/orders/:id` | Order detail for the owner |
| PUT | `/orders/:id/cancel` | Cancel an eligible order |

### Create order

```json
{
  "shippingAddress": {
    "fullName": "Alex Rivera",
    "phone": "+1 415 555 0100",
    "line1": "1 Market Street",
    "line2": "",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "United States"
  },
  "paymentMethod": "card",
  "saveAddress": true,
  "idempotencyKey": "checkout-8f4c1a2b"
}
```

- `paymentMethod`: `card` or `cod`.
- `card` orders start as `pending_payment` and must be confirmed through `/payments/confirm`.
  `cod` orders are created as `placed`.
- `idempotencyKey` (8–80 chars) makes retries safe: repeating the same key returns the original
  order instead of duplicating it.
- Stock is validated and reserved at creation; totals are computed server-side.

Order detail includes `orderStatus`, `statusLabel`, `paymentStatus`, totals, item snapshots,
`trackingHistory`, `timeline` stages, `canCancel` and `reviewedProductIds`.

Status flow:

```
pending_payment → placed → confirmed → processing → shipped → out_for_delivery → delivered
```

Any non-final state may transition to `cancelled`; customers may cancel `pending_payment`,
`placed`, `confirmed` and `processing` orders. Cancellation restores stock and refunds paid
payments. Delivered and cancelled orders are final.

### List query parameters

`status` (`active`, `all`, or an exact status; default all), `page`, `limit` (max 30).

### Cancel

```json
{ "reason": "Ordered the wrong size" }
```

`reason` is optional (max 240 characters). Cancelling an order that is shipped, delivered or already
cancelled returns `422`.

---

## Payments

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/payments/intent` | Create a payment intent for a pending order |
| POST | `/payments/confirm` | Verify and confirm payment |
| GET | `/payments/status/:orderId` | Payment status for the owner |

Intent:

```json
{ "orderId": "65f1c2a9b1e4c2d3f4a5b6c7" }
```

Returns `201` with the provider (`stripe` or `sandbox`), `clientSecret`, `confirmationRef` and
amount. The intent is bound to the order owner and amount.

Confirm:

```json
{ "orderId": "65f1c2a9b1e4c2d3f4a5b6c7", "paymentIntentId": "<clientSecret or Stripe intent id>" }
```

The backend verifies the intent belongs to the order and user, that it has not been used, and that
the amount matches; then it moves the order to `placed`, records `paidAt` and clears the cart.
Replayed or forged callbacks return `409`/`422`. A sandbox intent is single-use.

Status:

```json
{ "data": { "orderNumber": "AUR-202611-123456", "paymentStatus": "paid", "orderStatus": "placed" } }
```

---

## Reviews

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/products/:id/reviews` | — | Paginated reviews and summary |
| POST | `/reviews` | user | Create a review for a purchased product |
| DELETE | `/reviews/:id` | user | Delete your own review |

```json
{
  "productId": "65f1c2a9b1e4c2d3f4a5b6c7",
  "rating": 5,
  "title": "Quietly excellent",
  "comment": "Three weeks in and it still feels considered."
}
```

Only verified purchasers may review: the user must have a non-cancelled order containing the
product. One review per product per customer; the product's rating and review count are recalculated
after every change. Non-purchasers receive `403`.

---

## Admin

Every route below requires a session **and** the `admin` role. Customers receive `403`.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/admin/dashboard` | Analytics summary |
| GET | `/admin/orders` | All orders (`page`, `limit`, `status`, `q`) |
| GET | `/admin/orders/:id` | Order with customer details |
| PUT | `/admin/orders/:id/status` | Advance/set order status |
| PUT | `/admin/orders/:id/cancel` | Cancel and restock |
| POST | `/admin/orders/:id/refund` | Refund a paid order |
| GET | `/admin/users` | Customers (`page`, `limit`, `role`, `q`) |
| GET | `/admin/users/:id` | Customer with recent orders and lifetime stats |
| PATCH | `/admin/users/:id` | Change role or active state |
| GET | `/admin/products` | All products, including archived (`status=active\|archived\|low`) |

### Dashboard response

`revenue`, `totalOrders`, `totalCustomers`, `totalProducts`, `newCustomers` (30 days), `lowStock`,
`averageOrderValue`, `ordersByStatus`, `monthlyRevenue` (12 entries of
`{ month, label, revenue, orders }`), `recentOrders` (6) and `bestSellers` (5).

### Update status

```json
{ "status": "shipped", "note": "Handed to courier" }
```

`status` must be one of `pending_payment`, `placed`, `confirmed`, `processing`, `shipped`,
`out_for_delivery`, `delivered`, `cancelled`. Only forward transitions along the order flow (or
cancellation) are allowed; invalid transitions return `422`. A tracking entry with the optional note
is appended.

### Cancel / refund

Cancel accepts an optional `reason`. Refund requires a paid order and marks `paymentStatus` as
`refunded`; it is rejected for unpaid or already refunded orders.

### Update customer

```json
{ "role": "admin", "isActive": true }
```

An administrator cannot change their own role or status, and the last active administrator cannot be
demoted (`422`). Suspending a customer invalidates their existing sessions.

---

## Uploads

### `POST /uploads` — admin, `multipart/form-data`

Field name `images`, up to 6 files (JPEG/PNG/WebP, size-limited). Returns the stored image URLs.

- With Cloudinary configured, files are uploaded to Cloudinary and absolute URLs are returned.
- Otherwise files are written to `backend/uploads` and served from `/uploads/...`; the storefront's
  dev proxy forwards that path to the API.

Product create/update expects image **URLs** in `images`, so upload first and pass the returned URLs.

---

## Quick curl example

```bash
# Sign in and keep the session cookie
curl -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"demo@aurelis.com","password":"Demo@12345"}' \
  http://localhost:5000/api/auth/login

# Browse the catalog
curl 'http://localhost:5000/api/products?inStock=true&sort=popular&limit=3'

# Add to cart
curl -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"productId":"<id>","quantity":1}' \
  http://localhost:5000/api/cart
```
