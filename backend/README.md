# Amazon Clone Backend

Production-level REST API built with **Express + TypeScript + Prisma + PostgreSQL (Neon)**.

---

## 🍪 Auth: HttpOnly Cookie vs Bearer Token

This API uses **HttpOnly cookies** for authentication (switched from Bearer tokens).

| | HttpOnly Cookie (current) | Bearer Token (header) |
|---|---|---|
| XSS protection | ✅ JS cannot read the cookie | ❌ Token in localStorage is readable |
| CSRF protection | ✅ `SameSite=Strict` in prod | ✅ Not applicable |
| Next.js SSR | ✅ Cookie sent automatically | ❌ Must manually pass token server-side |
| Mobile apps | ⚠️ Needs extra config | ✅ Simple to use |
| Postman testing | ⚠️ Enable "Send cookies" | ✅ Paste token in header |

Cookie config: `httpOnly: true`, `secure: true` (prod), `sameSite: strict` (prod) / `lax` (dev), `maxAge: 7 days`

### Testing in Postman
Go to **Settings → Cookies** and enable cookie sending, OR in the collection settings turn on **"Automatically follow redirects"** and **"Send cookies"**. After login, the `token` cookie is set automatically.

---



```
src/
├── modules/               ← Feature-based modules (one folder per feature)
│   ├── auth/              ← routes, controller, service, validation
│   ├── category/
│   └── product/
├── middlewares/           ← Shared: authenticate, authorize, validate, error, request-logger
├── utils/                 ← Shared: AppError, jwt, email, otp, slug, sku
├── config/                ← db.ts (Prisma client), env.ts (typed env vars)
├── types/                 ← express.d.ts (req.user augmentation)
├── routes/
│   └── index.ts           ← Mounts all module routers
├── app.ts                 ← Express app setup
└── server.ts              ← HTTP server, graceful shutdown
scripts/
└── test-db.ts             ← Dev utility to test DB connection
prisma/
└── schema.prisma
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev         # development with hot reload
npm run build       # compile TypeScript
npm start           # run compiled build
npm run typecheck   # type check without emitting
npm run db:check    # test DB connection
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
EMAIL_FROM=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000                    # optional, defaults to 5000
```

---

## 🔒 Error Logging Strategy

All errors flow to one place: `src/middlewares/error.middleware.ts`.

| Error Type | When | Log Level | Stack Shown |
|---|---|---|---|
| `AppError` 4xx | Validation, not found, conflict — expected | Silent (not logged) | Never |
| `AppError` 5xx | Operational but severe | `console.error` with stack | Dev only |
| Unexpected Error | Real bugs — null ref, DB crash | `console.error` always | Dev only |

**HTTP Request Logging** (`src/middlewares/request-logger.ts`):
```
[Request] POST /api/v1/auth/login 200 - 142ms     ← info
[Request] POST /api/v1/auth/login 401 - 12ms      ← warn
[Request] POST /api/v1/auth/login 500 - 8ms       ← error
```

**Standard error response shape** (all errors):
```json
{ "success": false, "message": "Human-readable error message" }
```

---

## 🔐 Phase 1 — Authentication

Two flows: **password-based** and **email OTP-based**, both return the same JWT.

### Architecture
```
auth.routes.ts → auth.controller.ts → auth.service.ts
                       ↕
                 auth.validation.ts (Zod)
```

---

### `POST /api/v1/auth/register`
Register with email + password.

**Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "d734a592-7453-4808-9d53-31f45ecee375",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "isEmailVerified": false,
      "createdAt": "2026-03-12T08:21:40.095Z",
      "updatedAt": "2026-03-12T08:21:40.095Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors:** `400` invalid input | `409` email already in use

---

### `POST /api/v1/auth/login`
Login with email + password.

**Payload:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "d734a592-7453-4808-9d53-31f45ecee375",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "isEmailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors:** `400` invalid input | `401` invalid email or password (same message for both — prevents user enumeration)

---

### `POST /api/v1/auth/otp/send`
Send 6-digit OTP to email. Use `purpose: "REGISTER"` for new users, `purpose: "LOGIN"` for existing users.

**Payload:**
```json
{
  "email": "newuser@example.com",
  "purpose": "REGISTER"
}
```
**Response `200`:**
```json
{ "success": true, "message": "OTP sent to your email" }
```
**Errors:** `400` invalid input | `404` user not found (LOGIN purpose) | `409` email already registered (REGISTER purpose)

---

### `POST /api/v1/auth/otp/verify`
Verify OTP. Creates user if `REGISTER`, logs in if `LOGIN`. Returns JWT.

**Payload (REGISTER):**
```json
{
  "email": "newuser@example.com",
  "otp": "482910",
  "purpose": "REGISTER",
  "name": "New User",
  "phone": "9876543210"
}
```
**Payload (LOGIN):**
```json
{
  "email": "newuser@example.com",
  "otp": "482910",
  "purpose": "LOGIN"
}
```
**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123...",
      "name": "New User",
      "email": "newuser@example.com",
      "isEmailVerified": true,
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Errors:** `400` invalid/expired OTP | `404` OTP not found

---

### `GET /api/v1/auth/me`
Get logged-in user's profile and saved addresses.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "d734a592-7453-4808-9d53-31f45ecee375",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "isEmailVerified": false,
    "addresses": []
  }
}
```
**Errors:** `401` missing or invalid token

---

### Auth — Edge Cases Covered
- Same error message for wrong email and wrong password (prevents user enumeration)
- OTP deleted immediately after use (replay protection)
- Old OTPs for same email+purpose deleted before sending new one (no stale OTPs)
- OTP expires after 10 minutes
- `password` field is never returned in any response (`sanitize()`)
- OTP-only users (no password) return 401 on password login attempt

---

## 🗂 Phase 2 — Categories & Products

### Architecture
```
category.routes.ts → category.controller.ts → category.service.ts
product.routes.ts  → product.controller.ts  → product.service.ts
                            ↕
                     *.validation.ts (Zod)
```

---

### `GET /api/v1/categories`
List all categories with product count.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-1",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Phones, laptops and gadgets",
      "createdAt": "2026-03-12T08:50:00.000Z",
      "updatedAt": "2026-03-12T08:50:00.000Z",
      "_count": { "products": 5 }
    }
  ]
}
```

---

### `POST /api/v1/categories`
Create a category. **ADMIN only.**

**Headers:** `Authorization: Bearer <admin-token>`

**Payload:**
```json
{
  "name": "Electronics",
  "description": "Phones, laptops and gadgets"
}
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "cat-uuid-1",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Phones, laptops and gadgets",
    "createdAt": "2026-03-12T08:50:00.000Z",
    "updatedAt": "2026-03-12T08:50:00.000Z"
  }
}
```
**Errors:** `400` invalid input | `401` unauthenticated | `403` not admin | `409` name already exists

---

### `PUT /api/v1/categories/:id`
Update a category. Slug auto-regenerated if name changes. **ADMIN only.**

**Payload (all fields optional):**
```json
{ "name": "Consumer Electronics", "description": "Updated description" }
```
**Response `200`:** Same shape as create.

---

### `DELETE /api/v1/categories/:id`
Delete a category. **Blocked if any products are assigned.** **ADMIN only.**

**Response `200`:**
```json
{ "success": true, "message": "Category deleted" }
```
**Errors:** `404` not found | `409` "Cannot delete — 3 product(s) are assigned to this category"

---

### `GET /api/v1/products`
List products with search, filter, sort and pagination.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Case-insensitive title search |
| `categoryId` | uuid | — | Filter by category |
| `minPrice` | number | — | Min price |
| `maxPrice` | number | — | Max price |
| `sortBy` | string | `newest` | `newest`, `oldest`, `price_asc`, `price_desc`, `rating` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |

**Example:** `GET /api/v1/products?search=samsung&sortBy=price_asc&minPrice=50000&page=1&limit=10`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-uuid-1",
        "title": "Samsung Galaxy S24",
        "slug": "samsung-galaxy-s24",
        "sku": "SAM-GAL-S24-MMN8L81D",
        "description": "Latest Samsung flagship...",
        "price": "79999",
        "stock": 50,
        "status": "ACTIVE",
        "avgRating": 0,
        "reviewCount": 0,
        "category": { "id": "cat-uuid-1", "name": "Electronics", "slug": "electronics" },
        "images": [
          { "id": "img-1", "url": "https://example.com/s24-front.jpg", "position": 0 },
          { "id": "img-2", "url": "https://example.com/s24-back.jpg", "position": 1 }
        ]
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```
**Errors:** `400` invalid query params | `400` minPrice > maxPrice

---

### `GET /api/v1/products/:slug`
Get a single product by slug.

**Response `200`:** Same as one product object above, plus `"_count": { "reviews": 0 }`.

**Errors:** `404` product not found or discontinued

---

### `POST /api/v1/products`
Create a product. Slug and SKU are auto-generated. **ADMIN only.**

**Payload:**
```json
{
  "title": "Samsung Galaxy S24",
  "description": "Latest Samsung flagship with AI features and 200MP camera",
  "price": 79999,
  "stock": 50,
  "categoryId": "cat-uuid-1",
  "images": [
    "https://example.com/s24-front.jpg",
    "https://example.com/s24-back.jpg"
  ],
  "status": "ACTIVE"
}
```
**Response `201`:** Full product object (same as list item above).

**Errors:** `400` invalid input | `404` categoryId not found

---

### `PUT /api/v1/products/:id`
Update a product. All fields optional. If `images` is provided, **all old images are replaced**. **ADMIN only.**

**Payload (all optional):**
```json
{
  "title": "Samsung Galaxy S24 Ultra",
  "price": 89999,
  "stock": 30,
  "images": ["https://example.com/new-image.jpg"]
}
```
**Response `200`:** Updated product object.

---

### `DELETE /api/v1/products/:id`
Delete a product. **Soft delete** (sets `DISCONTINUED`) if orders reference it. **Hard delete** otherwise. **ADMIN only.**

**Response `200`:**
```json
{ "success": true, "message": "Product deleted" }
```

---

### Products — Edge Cases Covered
- Slug collision: auto-appends `-1`, `-2` etc. (`samsung-galaxy-s24-1`)
- SKU auto-generated from title words (e.g. `SAM-GAL-S24-MMN8L81D`)
- DISCONTINUED products return 404 on public access
- Delete with existing orders → soft delete to preserve order history
- Delete without orders → hard delete (cascades to images, cart items, wishlist items)
- Image update is transactional — old images deleted and new ones inserted atomically
- categoryId validated before creating/updating product
- `Promise.all` used for parallel count + fetch (no transaction needed for reads)

---

## 🛒 Phase 3 — Cart

All cart routes require authentication (`Bearer` token). Cart is created lazily on first item add.

### `GET /api/v1/cart`
Get current user's cart with all items and computed total.

**Headers:** `Authorization: Bearer <token>`

**Response `200` (empty cart):**
```json
{ "success": true, "data": { "items": [], "total": 0 } }
```
**Response `200` (with items):**
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "total": 159998,
    "items": [
      {
        "id": "item-uuid",
        "quantity": 2,
        "product": {
          "id": "prod-uuid",
          "title": "Samsung Galaxy S24",
          "slug": "samsung-galaxy-s24",
          "price": "79999",
          "stock": 50,
          "status": "ACTIVE",
          "images": [{ "url": "https://example.com/s24-front.jpg" }]
        }
      }
    ]
  }
}
```

---

### `POST /api/v1/cart/items`
Add a product to cart. If product already in cart, quantity is merged.

**Payload:**
```json
{ "productId": "prod-uuid", "quantity": 2 }
```
**Response `200`:** Full updated cart (same shape as GET).

**Errors:** `400` product unavailable | `400` exceeds stock | `404` product not found

---

### `PATCH /api/v1/cart/items/:itemId`
Update item quantity. Send `quantity: 0` to remove the item.

**Payload:**
```json
{ "quantity": 1 }
```
**Response `200`:** Full updated cart.

**Errors:** `400` exceeds stock | `404` item not found (or belongs to another user)

---

### `DELETE /api/v1/cart/items/:itemId`
Remove a single item from cart.

**Response `200`:** Full updated cart.

**Errors:** `404` item not found

---

### `DELETE /api/v1/cart`
Clear all items from cart.

**Response `200`:**
```json
{ "success": true, "message": "Cart cleared" }
```

---

### Cart — Edge Cases Covered
- **Lazy cart creation**: Cart row is only created in DB when user adds their first item. `GET /cart` returns `{ items: [], total: 0 }` without hitting the DB unnecessarily for users with no cart
- **Quantity merging**: Adding a product already in cart increments quantity instead of creating duplicate
- **Combined stock check on merge**: If cart has 2 units and user adds 49 more, validates total (51) against stock (50), not just the increment
- **`quantity: 0` via PATCH removes item**: Convenient UX — single endpoint handles both update and removal
- **Stock validation on update**: PATCH also checks new quantity doesn't exceed available stock
- **Ownership check**: Item update/delete verifies `cart.userId === req.user.id` — prevents user A from modifying user B's cart items
- **Cart total computed server-side**: `total` field returned with every response so frontend never has to calculate
- **Only one image returned per item**: `position: 0` (thumbnail) — avoids over-fetching all images in cart view

---

## 📍 Phase 4A — Addresses

All address routes require authentication. Address is required before placing an order.

### `GET /api/v1/addresses`
List user's addresses. Default address is always first.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr-uuid-1",
      "street": "10 Park Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "isDefault": true,
      "userId": "user-uuid",
      "createdAt": "2026-03-12T09:00:00.000Z",
      "updatedAt": "2026-03-12T09:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/v1/addresses`
Add a new address. First address is always set as default automatically.

**Payload:**
```json
{
  "street": "42 MG Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "postalCode": "560001",
  "country": "India",
  "isDefault": false
}
```
**Response `201`:** Full address object.

**Errors:** `400` invalid input

---

### `PUT /api/v1/addresses/:id`
Update an address. All fields optional.

**Payload (any field):**
```json
{ "city": "Pune", "postalCode": "411001" }
```
**Response `200`:** Updated address.

---

### `PATCH /api/v1/addresses/:id/default`
Set an address as default. Unsets all others automatically.

**Response `200`:** Updated address with `isDefault: true`.

---

### `DELETE /api/v1/addresses/:id`
Delete an address. Blocked if used by any active order.

**Response `200`:**
```json
{ "success": true, "message": "Address deleted" }
```
**Errors:** `404` not found | `409` used by active order

---

### Addresses — Edge Cases Covered
- **First address auto-default**: When a user's first address is created, `isDefault` is forced `true` regardless of payload
- **Default auto-promotion**: If the default address is deleted, the next most recent address is automatically promoted to default
- **Single default enforced**: Setting a new default unsets all others in a single DB transaction — no race condition
- **Ownership check**: Address endpoints return `404` (not `403`) for addresses belonging to another user — prevents leaking existence
- **Delete blocked on active orders**: Cannot delete address used by PENDING/PROCESSING/SHIPPED orders

---

## 📦 Phase 4B — Orders

All order routes require authentication. Placing an order is an atomic transaction.

### `POST /api/v1/orders`
Place an order from current cart contents.

**Payload:**
```json
{ "addressId": "addr-uuid" }
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": "159998",
    "createdAt": "2026-03-12T09:30:00.000Z",
    "shippingAddress": {
      "id": "addr-uuid",
      "street": "10 Park Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "items": [
      {
        "id": "item-uuid",
        "quantity": 2,
        "price": "79999",
        "product": {
          "id": "prod-uuid",
          "title": "Samsung Galaxy S24",
          "slug": "samsung-galaxy-s24",
          "images": [{ "url": "https://example.com/s24-front.jpg" }]
        }
      }
    ]
  }
}
```
**Errors:** `400` cart empty | `400` product unavailable or insufficient stock | `404` address not found

---

### `GET /api/v1/orders`
Get current user's order history (paginated).

**Query params:** `status` (optional), `page` (default 1), `limit` (default 10, max 50)

**Example:** `GET /api/v1/orders?status=PENDING&page=1`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "orders": [ /* array of order objects */ ],
    "pagination": { "total": 5, "page": 1, "limit": 10, "totalPages": 1, "hasNext": false, "hasPrev": false }
  }
}
```

---

### `GET /api/v1/orders/:id`
Get a single order by ID. Customers see only their own. Admins see any.

**Response `200`:** Full order object (same as place order response above) + `user` field for admins.

**Errors:** `404` not found (or not yours)

---

### `PATCH /api/v1/orders/:id/cancel`
Cancel an order. **Customers only. Only PENDING orders can be cancelled.**
Stock is restored on cancellation.

**Response `200`:** Updated order with `status: "CANCELLED"`.

**Errors:** `400` order is not PENDING | `404` not found

---

### `PATCH /api/v1/orders/:id/status` *(ADMIN)*
Update order status. Enforces forward-only progression.

**Payload:**
```json
{ "status": "PROCESSING" }
```
Valid flow: `PENDING → PROCESSING → SHIPPED → DELIVERED`
Can be `CANCELLED` from any status except `DELIVERED`.

**Response `200`:** Updated order.

**Errors:** `400` regression attempt | `400` cancelling delivered order | `404` not found

---

### `GET /api/v1/orders/admin/all` *(ADMIN)*
List all orders with filters.

**Query params:** `status`, `userId`, `dateFrom`, `dateTo`, `page`, `limit`

**Example:** `GET /api/v1/orders/admin/all?status=PROCESSING&page=1`

**Response `200`:** Same paginated shape as GET /orders, with `user` info on each order.

---

### Orders — Edge Cases Covered
- **Atomic transaction**: Order creation, stock deduction, and cart clearing all happen in one DB transaction — if any step fails, nothing is committed
- **Pre-validation before transaction**: All stock and availability checks run BEFORE the transaction starts. Collects ALL errors at once (e.g. 3 items unavailable in one response) instead of failing on the first
- **Price snapshot**: `OrderItem.price` stores the product price at time of purchase — price changes later don't affect past orders
- **Stock auto-deduction**: Each product's stock decremented on order placement
- **Auto OUT_OF_STOCK**: Product status set to `OUT_OF_STOCK` automatically when last unit is sold
- **Stock restoration on cancel**: Cancelled orders restore stock. If product was auto-marked `OUT_OF_STOCK`, it's re-activated to `ACTIVE`
- **Status regression blocked**: Cannot move SHIPPED → PROCESSING → PENDING — only forward
- **DELIVERED cannot be cancelled**: By admin or customer
- **Customer ownership enforced**: Customers get `404` (not `403`) for other users' orders — doesn't leak existence
- **Admin route order**: `/admin/all` defined before `/:id` in router to prevent "admin" being matched as an order ID param
- **Confirmation email**: Sent after transaction commits (fire-and-forget) — email failure never rolls back or blocks the order response

---

---

## ⭐ Phase 5A — Reviews

Reviews are nested under products: `/api/v1/products/:productId/reviews`
**Gate**: A user can only review a product they have a `DELIVERED` order containing it.

### `GET /api/v1/products/:productId/reviews`
List reviews for a product (paginated).

**Query params:** `page` (default 1), `limit` (default 10, max 50), `sort` (`newest` | `highest` | `lowest`, default `newest`)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Great phone!",
        "createdAt": "2026-03-12T09:30:00.000Z",
        "user": { "id": "user-uuid", "name": "John Doe" }
      }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1, "hasNext": false, "hasPrev": false }
  }
}
```

---

### `POST /api/v1/products/:productId/reviews`
Create a review. **Requires auth + must have delivered order with product.**

**Payload:**
```json
{ "rating": 5, "comment": "Great phone, very fast!" }
```
`rating` is required (1–5). `comment` is optional (max 1000 chars).

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Great phone, very fast!",
    "userId": "user-uuid",
    "productId": "prod-uuid",
    "createdAt": "2026-03-12T09:30:00.000Z"
  }
}
```
**Errors:** `403` no delivered order | `409` already reviewed this product | `404` product not found

---

### `DELETE /api/v1/products/:productId/reviews/:reviewId`
Delete own review. Admins can delete any review.

**Response `200`:**
```json
{ "success": true, "message": "Review deleted" }
```
**Errors:** `403` not your review | `404` review not found

---

### Reviews — Edge Cases Covered
- **Purchase verification**: User must have at least one DELIVERED order containing the product — prevents fake reviews
- **One review per user per product**: DB unique constraint + friendly 409 error
- **Denormalized rating**: `Product.avgRating` and `Product.reviewCount` updated atomically after every create/delete via `syncProductRating()` — avoids expensive COUNT queries on every product fetch
- **Sort options**: `newest` (chronological), `highest` (5→1), `lowest` (1→5)
- **Admin delete**: Admins can delete any review (moderation); average auto-recalculated

---

## ❤️ Phase 5B — Wishlist

Single wishlist per user. Lazy creation (created on first add).

### `GET /api/v1/wishlist`
Get the user's wishlist. Returns empty shape `{ items: [] }` if none exists yet (no 404).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "wishlist-uuid",
    "items": [
      {
        "id": "item-uuid",
        "createdAt": "2026-03-12T09:30:00.000Z",
        "product": {
          "id": "prod-uuid",
          "title": "Samsung Galaxy S24",
          "slug": "samsung-galaxy-s24",
          "price": "79999",
          "stock": 15,
          "status": "ACTIVE",
          "avgRating": 4.7,
          "images": [{ "url": "https://example.com/s24.jpg" }]
        }
      }
    ]
  }
}
```

---

### `POST /api/v1/wishlist/items`
Add a product to the wishlist. Creates wishlist row lazily.

**Payload:**
```json
{ "productId": "prod-uuid" }
```

**Response `200`:** Updated wishlist (same shape as GET).

**Errors:** `404` product not found | `400` product DISCONTINUED | `409` already in wishlist

---

### `DELETE /api/v1/wishlist/items/:itemId`
Remove an item from wishlist by `WishlistItem.id`.

**Response `200`:** Updated wishlist.

**Errors:** `404` item not found (ownership enforced — can't remove other user's items)

---

### `POST /api/v1/wishlist/items/:itemId/move-to-cart`
Move item from wishlist to cart atomically: adds to cart then removes from wishlist.
If product already in cart, increments quantity by 1.

**Response `200`:** Updated wishlist (item removed from it).

**Errors:** `400` product not ACTIVE | `400` out of stock | `400` stock limit reached in cart | `404` item not found

---

### Wishlist — Edge Cases Covered
- **Lazy creation**: Wishlist DB row only created on first `addItem` call — GET returns `{ items: [] }` without a DB write
- **Duplicate prevention**: DB unique constraint on `[wishlistId, productId]` + friendly 409 error
- **DISCONTINUED blocked**: Cannot wishlist a discontinued product
- **Move-to-cart is atomic**: Item only deleted from wishlist after successful cart add — no data loss if cart write fails
- **Stock cap on move-to-cart**: Checks current cart quantity + 1 against stock — prevents over-ordering
- **Ownership enforced**: All item lookups include `wishlist: { userId }` — cannot remove other users' wishlist items

### `POST /api/v1/auth/logout`
Clears the auth cookie. Requires auth.

**Response `200`:** `{ "success": true, "message": "Logged out successfully" }`

---

### `GET /api/v1/auth/me`
Get current user profile including addresses.

**Response `200`:** User object with `addresses` array.

---

### `PUT /api/v1/auth/profile`
Update name and/or phone. Both fields optional — send only what you want to change.

**Payload:**
```json
{ "name": "John Smith", "phone": "9123456789" }
```
**Response `200`:** Updated user object (no password field).

**Errors:** `409` phone number already in use by another account

---

### `PUT /api/v1/auth/password`
Change password. Requires current password for verification.

**Payload:**
```json
{ "currentPassword": "OldPass@1", "newPassword": "NewPass@2" }
```
`newPassword` rules: min 8 chars, at least 1 uppercase letter, at least 1 number.

**Response `200`:**
```json
{ "success": true, "message": "Password changed successfully" }
```
**Errors:** `401` current password incorrect | `400` new = old | `400` OTP-only account (no password set)

---

### Profile — Edge Cases Covered
- **Partial update**: Only fields sent in payload are updated — sending just `name` won't wipe `phone`
- **Phone uniqueness**: Checked against other users only — updating to your own existing phone is fine
- **Same password rejected**: `newPassword === currentPassword` returns `400` before hashing
- **OTP-only accounts**: Users who registered via OTP have no `password` set — `PUT /password` returns a clear error explaining they use OTP login
- **Password never returned**: `sanitize()` strips the hash from all profile responses

--- (Razorpay + COD + Test Bypass)

Three payment modes available. Set `paymentMode` when placing an order.

| Mode | Behaviour |
|---|---|
| `COD` | Cash on delivery — order placed instantly, `paymentStatus: PENDING` |
| `TEST_BYPASS` | Dev/demo — skip payment, order placed instantly, `paymentStatus: PAID` |
| `RAZORPAY` | Real payment — returns Razorpay order details, stock deducted only after verification |

### Setup (Razorpay Test Keys)
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) (free)
2. Go to **Settings → API Keys → Generate Test Key**
3. Add to `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret
```

---

### `POST /api/v1/orders`
Place an order. Behaviour depends on `paymentMode`.

**Payload (COD or TEST_BYPASS):**
```json
{ "addressId": "addr-uuid", "paymentMode": "TEST_BYPASS" }
```
**Response `201`:** Full order object (same as before) + `paymentMode` and `paymentStatus` fields.

---

**Payload (RAZORPAY):**
```json
{ "addressId": "addr-uuid", "paymentMode": "RAZORPAY" }
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "order": { "id": "order-uuid", "paymentStatus": "PENDING", "razorpayOrderId": "order_xxx", "..." },
    "razorpayOrder": {
      "id": "order_xxx",
      "amount": 7999900,
      "currency": "INR"
    },
    "keyId": "rzp_test_xxxx"
  }
}
```
> Frontend uses `keyId` + `razorpayOrder.id` + `amount` to open the Razorpay checkout modal.
> Stock is **NOT deducted** at this point — only after payment is verified.

---

### `POST /api/v1/orders/:id/verify-payment`
Verify Razorpay payment after user pays. Called by frontend after Razorpay checkout success callback.

**Payload:**
```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "hmac_signature_from_razorpay"
}
```

**Response `200`:** Updated order with `paymentStatus: "PAID"`.

**Errors:** `400` invalid signature (order marked FAILED) | `400` already paid | `400` order ID mismatch | `404` order not found

---

### Payments — Edge Cases Covered
- **TEST_BYPASS mode**: Designed for demos/interviews — skips Razorpay entirely, immediately marks PAID. Remove this mode before real production
- **Stock deduction timing (RAZORPAY)**: Stock deducted only AFTER signature verification — prevents holding inventory for unpaid orders
- **HMAC signature verification**: `SHA256(razorpayOrderId + "|" + razorpayPaymentId, KEY_SECRET)` — standard Razorpay pattern. Any tampered response fails
- **Failed payment marked**: If signature mismatch, order `paymentStatus` set to `FAILED` — user can see it and retry (retry not implemented, would need new Razorpay order)
- **Double verification safe**: If cart already cleared on second verification attempt, order is still updated to PAID without crashing
- **Cancel + refund**: Cancelling a PAID Razorpay order sets `paymentStatus: REFUNDED` — actual Razorpay refund API call would be a separate step
- **COD paymentStatus**: Set to `PENDING` (not PAID) since payment happens on delivery
- **Amount in paise**: Razorpay requires smallest currency unit — `₹100 = 10000 paise`. Calculated as `Math.round(totalAmount * 100)`

---

### What was added

| Layer | Tool | Config |
|---|---|---|
| Security headers | `helmet` | Enables XSS filter, noSniff, frameguard, HSTS, etc. |
| CORS | `cors` (configured) | Only origins in `ALLOWED_ORIGINS` env var are allowed |
| Rate limiting (auth) | `express-rate-limit` | 10 req / 15 min per IP on all `/auth/*` routes |
| Rate limiting (general) | `express-rate-limit` | 100 req / min per IP on all `/api/v1/*` routes |
| Input sanitization | `xss` | All `req.body` string fields stripped of HTML/script tags |
| Payload size cap | `express.json` limit | Rejects bodies > 10kb (DoS protection) |

### Environment variable
```
# .env — comma-separated allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Rate limit headers returned to client
```
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: 1710237600
```

### Edge Cases Covered
- **CORS pre-flight**: `credentials: true` allows `Authorization` header and cookies from allowed origins
- **Server-to-server**: Requests with no `Origin` header (e.g. from Postman, backend-to-backend) are allowed
- **Auth brute force**: 10 req / 15 min per IP on login/register/OTP blocks credential stuffing
- **OTP spam**: Same auth limiter applies to `/otp/send` — prevents email flooding
- **Stored XSS**: `sanitizeBody` middleware recursively walks the entire request body object (nested arrays, objects) before it reaches any controller
- **Oversized payload DoS**: `express.json({ limit: "10kb" })` returns 413 for large bodies before they're parsed

---

## 🛡 Middleware Reference

| Middleware | File | Usage |
|---|---|---|
| `helmet()` | (npm) | Security headers — XSS, frameguard, noSniff, HSTS |
| `cors(config)` | (npm) | Allows only `ALLOWED_ORIGINS` list |
| `generalLimiter` | `rateLimiter.ts` | 100 req/min per IP on all API routes |
| `authLimiter` | `rateLimiter.ts` | 10 req/15 min per IP on auth routes only |
| `sanitizeBody` | `sanitize.ts` | Strips XSS from all req.body string fields |
| `requestLogger` | `request-logger.ts` | Logs every request with method, path, status, duration |
| `errorHandler` | `error.middleware.ts` | Global error catcher — sends standard error JSON |
| `authenticate` | `authenticate.ts` | Verifies Bearer JWT, sets `req.user` |
| `authorize(...roles)` | `authorize.ts` | Role-based access check (e.g. `authorize("ADMIN")`) |
| `validate(schema)` | `validate.ts` | Validates `req.body` with Zod |
| `validateQuery(schema)` | `validate.ts` | Validates `req.query`, stores result in `res.locals.query` |

