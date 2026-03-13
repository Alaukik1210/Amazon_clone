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

## Additional

* Invoice PDF download
* Health check endpoints

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

# 🗄 Database Models (Overview)

Main entities implemented:

* User
* Address
* Category
* Product
* ProductImage
* Cart
* CartItem
* Wishlist
* WishlistItem
* Order
* OrderItem
* Review
* OTPVerification

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

# 🧠 Implementation Highlights

* OTP stored **hashed with expiry** for security
* **Atomic stock update** during checkout to prevent overselling
* **One review per user per product constraint**
* Secure **HttpOnly cookie authentication**
* Authorization checks preventing access to other users' data
* Order cancellation restores product stock

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
