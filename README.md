# 🛒 Amazon Clone (Full‑Stack Assignment)

A full‑stack **Amazon‑inspired ecommerce application** built as a technical assignment. The project focuses on implementing the **core ecommerce workflow** with clean architecture and secure authentication.

The application includes authentication, product browsing, cart management, checkout, order tracking, and reviews.

---

# 🚀 Tech Stack

## Frontend

* Next.js (App Router)
* React + TypeScript
* Tailwind CSS
* React Query
* Zustand
* Axios
* React Hook Form + Zod

## Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL
* JWT + HttpOnly Cookie Authentication
* Nodemailer (OTP Email)
* PDFKit (Invoice generation)

## Security & Reliability

* Helmet
* CORS allowlist
* Authentication rate limiting
* Zod validation
* Centralized error handling

---

# ✨ Features

## Authentication

* Email + password login/register
* OTP email verification
* Secure cookie‑based session handling

## Product Catalog

* Categories
* Product listing
* Product detail pages
* Product reviews (1 review per user)

## Cart & Wishlist

* Add/remove items
* Quantity updates
* Wishlist management

## Checkout & Orders

* Address management
* Order placement
* Order history
* Order cancellation with rules
* Invoice PDF download

---

# 📁 Project Structure

This repository uses **npm workspaces (monorepo)**.

```
amazon-clone
│
├── frontend/      # Next.js frontend application
├── backend/       # Express API + Prisma
│
├── package.json
└── README.md
```

---

# ⚙️ Local Setup Guide

## 1. Clone Repository

```
git clone <repository-url>
cd amazon-clone
```

---

## 2. Install Dependencies

```
npm install
```

---

## 3. Environment Variables

### backend/.env

```
NODE_ENV=development
PORT=8000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

EMAIL_FROM=your_email@example.com
EMAIL_PASS=your_email_password

ALLOWED_ORIGINS=http://localhost:3000
```

### frontend/.env.local

```
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 4. Setup Database

Run Prisma migrations and seed data:

```
npm --prefix backend exec prisma migrate deploy
npm --prefix backend run db:seed
```

---

## 5. Run Application

Start backend:

```
npm run backend:dev
```

Start frontend:

```
npm run dev
```

---

# 🌐 Application URLs

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:8000
```

Health Check

```
http://localhost:8000/health
```

---

# 🔑 Demo Credentials

## Customer

```
Email: user@amazon-clone.com
Password: password123
```

# 🗄 Database Architecture (Detailed)

The data layer is designed around clear domain boundaries and strict relational integrity.

## Domain Groups

### 1) Identity and Access

* `User`: account identity, role, verification state
* `OtpVerification`: short-lived OTP records for register/login flows

### 2) Catalog

* `Category`: top-level product grouping (`name`, `slug` unique)
* `Product`: sellable item with pricing, status, inventory, and denormalized rating summary
* `ProductImage`: ordered image set per product

### 3) Shopping Intent

* `Cart` and `CartItem`: mutable pre-purchase basket
* `Wishlist` and `WishlistItem`: save-for-later list

### 4) Purchase and Fulfillment

* `Order`: payment + fulfillment lifecycle
* `OrderItem`: immutable line items with purchase-time price snapshot

### 5) Social Feedback

* `Review`: one review per user per product, source of rating aggregates

## Core Relationships

* `User (1) -> (N) Address`
* `User (1) -> (1) Cart -> (N) CartItem`
* `User (1) -> (1) Wishlist -> (N) WishlistItem`
* `Category (1) -> (N) Product -> (N) ProductImage`
* `User (1) -> (N) Order -> (N) OrderItem`
* `User (1) -> (N) Review` and `Product (1) -> (N) Review`

## Integrity and Constraints

* Unique identity fields:
	* `User.email`
	* `User.phone` (nullable but unique when present)
* Catalog uniqueness:
	* `Category.name`, `Category.slug`
	* `Product.sku`, `Product.slug`
* De-duplication constraints:
	* `CartItem @@unique([cartId, productId])`
	* `WishlistItem @@unique([wishlistId, productId])`
	* `Review @@unique([userId, productId])`
* OTP performance index:
	* `OtpVerification @@index([email, purpose])`

## Delete Behavior and Data Safety

* `onDelete: Cascade` is used where child records are ownership-bound:
	* user -> addresses, cart, wishlist, reviews
	* product -> product images, reviews
	* order -> order items
* This avoids orphaned records and keeps relational cleanup predictable.

## Lifecycle Modeling with Enums

* `Role`: `CUSTOMER`, `ADMIN`
* `OtpPurpose`: `REGISTER`, `LOGIN`
* `ProductStatus`: `ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`
* `OrderStatus`: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
* `PaymentMode`: `RAZORPAY`, `COD`, `TEST_BYPASS`
* `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`

## Transactional Flows (Why This Matters)

* Checkout flow uses atomic updates so stock deduction and order creation remain consistent.
* `OrderItem.price` stores purchase-time value, preventing reporting drift when product price changes later.
* Product rating is denormalized (`avgRating`, `reviewCount`) for fast listing reads while review integrity remains normalized.

## Timestamp and Auditability

Most tables include `createdAt` and `updatedAt`, allowing reliable sorting, debugging, and timeline reconstruction for operations.

---

# 🔌 API Routes

Main API groups:

```
/auth
/products
/categories
/cart
/wishlist
/addresses
/orders
/products/:productId/reviews
```

Operational endpoints:

```
/health
/ready
```

---

# ⚠️ Known Issue (Deployment)

During deployment on **Render**, some API responses may take **~40–50 seconds** for the first request.

This occurs due to **Render free tier cold start behavior**, where the server spins down when idle and takes time to wake up.

This delay is **not related to application performance or backend logic**, and once the server is active, subsequent requests respond normally.


---

# 🧠 Engineering Decisions That Improve This Project

This project intentionally focuses on real engineering practices:

* Modular backend architecture
* Feature-based frontend structure
* React Query for server state management
* Optimistic UI updates
* Atomic database transactions
* Proper error handling and validation
* Secure API design

---

# 🔮 Possible Improvements

* Razorpay payment integration
* Payment webhook verification
* CI pipeline for linting, testing, and migration checks

---

# 📌 Project Summary

This project replicates the **core ecommerce workflow of Amazon** with a focus on:

* Clean full‑stack architecture
* Secure authentication
* Realistic ecommerce features
* Proper backend data modeling

It is designed to demonstrate **real‑world full‑stack engineering practices** within the scope of a technical assignment.
