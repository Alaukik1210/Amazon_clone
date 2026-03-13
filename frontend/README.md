# Amazon Clone — Frontend

Production-level Amazon clone built with **Next.js 16 + TypeScript + Tailwind CSS**.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev        # http://localhost:3000

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

Make sure the backend is running on `http://localhost:8000` before starting the frontend.

---

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework — SSR, routing, image optimization |
| TypeScript | Type safety across entire frontend |
| Tailwind CSS v4 | Utility-first styling |
| React Query (@tanstack) | Server state — fetching, caching, syncing API data |
| Axios | HTTP client with `withCredentials: true` for HttpOnly cookies |
| Zustand | Client state — logged-in user info for UI rendering |
| React Hook Form + Zod | Forms with schema validation |
| Lucide React | Icons |
| clsx + tailwind-merge | Safe conditional class merging via `cn()` utility |
| next-themes | Dark/light mode |

---

## 📁 Folder Structure

```
src/
├── app/
│   ├── (auth)/              ← Auth group — centered card layout
│   │   ├── login/
│   │   └── register/
│   ├── (shop)/              ← Shop group — Navbar + Footer layout
│   │   ├── products/
│   │   │   └── [slug]/      ← Product detail page
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   │   └── [id]/
│   │   ├── wishlist/
│   │   └── account/
│   ├── (admin)/             ← Admin group — separate layout
│   │   └── dashboard/
│   ├── layout.tsx           ← Root layout (Providers, fonts)
│   ├── globals.css
│   └── page.tsx             ← Homepage (/)
│
├── components/
│   ├── ui/                  ← Pure reusable UI — no business logic
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Modal.tsx
│   │   ├── StarRating.tsx
│   │   ├── Skeleton.tsx
│   │   └── Pagination.tsx
│   ├── layout/              ← Page chrome
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── SearchBar.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   └── ProductImageGallery.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   └── OrderStatusBadge.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── shared/
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       └── ProtectedRoute.tsx
│
├── services/                ← All API calls — one file per domain
├── hooks/                   ← Custom React hooks
├── stores/                  ← Zustand (client/UI state only)
├── lib/                     ← api.ts, utils.ts, constants.ts
└── types/                   ← TypeScript interfaces
```

---

## 🗺 Build Phases

### Phase 1 — Foundation & Design System ⬜
- UI components: Button, Input, Badge, Spinner, Skeleton, Modal, StarRating, Pagination
- Navbar (logo, search bar, cart badge, account menu)
- Footer
- Shop layout + Auth layout
- ErrorBoundary, EmptyState

### Phase 2 — Auth Pages ⬜
- `/login` — password + OTP tabs, form validation, redirect
- `/register` — all fields, OTP option
- `useAuthSync` — validates cookie on app load
- `ProtectedRoute` — guards authenticated routes
- `/account` — update profile, change password

### Phase 3 — Product Listing & Detail ⬜
- `/products` — filter by category/price, search with debounce, sort, pagination
- `ProductCard` — image, title, price, stars, add-to-cart/wishlist
- `/products/[slug]` — image gallery, reviews, add to cart
- Skeleton loaders for all loading states

### Phase 4 — Cart & Wishlist ⬜
- `/cart` — items, quantity controls, totals, proceed to checkout
- `/wishlist` — grid, move to cart, remove
- Cart count badge in Navbar
- Optimistic UI updates

### Phase 5 — Checkout & Orders ⬜
- `/checkout` — address selection, payment mode, order summary
- Razorpay modal integration
- `/orders` — list with status filter
- `/orders/[id]` — full order detail + status timeline

### Phase 6 — Account & Addresses ⬜
- Profile management tabs
- Address CRUD (add, edit, set default, delete)

### Phase 7 — Polish & Production ⬜
- Fully responsive (mobile-first)
- Toast notifications
- SEO metadata + OG tags
- 404 / error pages
- Dark mode
- Image optimization

---

## 🎨 Amazon Design Tokens

| Token | Value |
|---|---|
| Primary orange | `#ff9900` |
| Dark header | `#131921` |
| Secondary nav | `#232f3e` |
| Link blue | `#007185` |
| Text primary | `#0f1111` |
| Border | `#ddd` |
| Background grey | `#eaeded` |

---

## 🔐 Auth Flow

1. App loads → `useAuthSync` calls `GET /auth/me` with cookie (auto-sent by browser)
2. Cookie valid → user hydrated in Zustand store → Navbar shows user name
3. Cookie missing/expired → user is `null` → Navbar shows "Sign In"
4. Login → `POST /auth/login` → server sets `HttpOnly` cookie → Zustand stores display info
5. Logout → `POST /auth/logout` → server clears cookie → Zustand reset → redirect to login

**Why Zustand, not Redux?**
React Query handles all server state. Zustand only stores one thing: the logged-in user display info (name, role) for the Navbar. Redux would be massive overkill — and in an interview, choosing the right tool is more impressive than using a big one.

**Why `src/` directory?**
Keeps all application code in one folder, clearly separated from config files at the project root. Cleaner at scale. Next.js officially supports and recommends it.

---

## 📋 Change Log

### Init — Project Setup
**What was done:**
- Next.js 16 created with TypeScript, Tailwind CSS v4, App Router, `src/` directory
- Installed all dependencies: react-query, axios, zustand, react-hook-form, zod, lucide-react, clsx, tailwind-merge, next-themes
- Route group structure created: `(auth)`, `(shop)`, `(admin)`
- `src/lib/api.ts` — Axios singleton, `withCredentials: true`, global error response interceptor
- `src/lib/utils.ts` — `cn()` for safe class merging, `formatPrice()` in INR, `formatDate()`, `truncate()`
- `src/lib/constants.ts` — Centralized `QUERY_KEYS` and `ROUTES` to avoid magic strings
- `src/types/index.ts` — Complete TypeScript interfaces for all API entities
- `src/services/` — Thin service layer: each function maps to one API endpoint
- `src/stores/auth.store.ts` — Persisted Zustand store (only non-sensitive display info)
- `src/components/Providers.tsx` — QueryClient (created per-component, SSR-safe) + ThemeProvider
- `src/hooks/useAuthSync.ts` — Silently checks if cookie is still valid on app load
- Root layout updated with Inter font + Providers wrapper

**Edge cases handled:**
- Axios interceptor normalizes all error responses to a plain `Error` — no need to handle `error.response.data.message` in every component
- QueryClient created inside component state (not module scope) — prevents query cache leaking between users in SSR
- `useAuthSync` uses `retry: false` — if cookie is missing, don't hammer the server with retries
- Zustand store uses `partialize` to only persist `user` — never token or sensitive data

---

### Phase 1B — Design System (UI Components + Layout)

**Files added:**
- `src/components/ui/StarRating.tsx` — `StarRating` (display, fractional fill, review count link) + `StarPicker` (interactive form input)
- `src/components/ui/Pagination.tsx` — prev/next, numbered pages, ellipsis for large ranges, accessible (`aria-current`, `aria-label`)
- `src/components/layout/SearchBar.tsx` — category dropdown + debounced text input + submit button, reads/writes URL search params
- `src/components/layout/Navbar.tsx` — Amazon-style dark header (`#131921`), sticky top, category bar, cart badge, account hover dropdown, mobile hamburger menu
- `src/components/layout/Footer.tsx` — multi-column links, back-to-top, bottom bar
- `src/components/shared/ErrorBoundary.tsx` — React class component, catches render errors, try-again button, send to Sentry in production
- `src/components/shared/EmptyState.tsx` — reusable empty state with optional icon, title, description, action button
- `src/components/shared/ProtectedRoute.tsx` — redirects to login if unauthenticated; `adminOnly` prop for admin-only pages
- `src/stores/cart.store.ts` — Zustand store for cart badge count (lightweight; full cart data lives in React Query cache)
- `src/app/(shop)/layout.tsx` — wraps all shop pages with Navbar + Footer
- `src/app/(auth)/layout.tsx` — centered card layout with logo for login/register pages

**Edge cases handled:**
- Navbar `logout` calls `authService.logout()` (clears HttpOnly cookie server-side) before clearing local state — silent fail if cookie already gone
- SearchBar debounces 500ms to avoid spamming `/products` on every keystroke; cleanup on unmount prevents stale timers
- StarRating supports fractional values (e.g. 4.3) via percentage-width clip trick — no rounding to nearest 0.5
- StarRating falls back gracefully if `reviewCount` is omitted
- Pagination shows ellipsis and always includes first/last page — handles any page count
- ProtectedRoute waits for `isLoading` before redirecting — prevents flicker on page load when cookie validation is in-flight
- `user.name` is nullable — Navbar safely falls back to `"User"` before splitting

---

### Phase 2 — Auth Pages + Account Management

**New dependencies:**
- `sonner` — toast notifications (lightweight, Next.js-native)

**Files added:**
- `src/app/globals.css` — **Comprehensive Amazon design token system** — all colors, shadows, typography as CSS custom properties. Reusable utility classes: `.amazon-link`, `.amazon-card`, `.amazon-divider`, `.form-label`, `.form-hint`, `.form-error`, `.btn-amazon`, `.tab-btn`. No hardcoded hex values in components.
- `src/lib/validations/auth.schema.ts` — All Zod schemas: `passwordLoginSchema`, `otpRequestSchema`, `otpVerifyLoginSchema`, `registerSchema`, `updateProfileSchema`, `changePasswordSchema`, `addressSchema`. Inferred TypeScript types exported alongside each schema.
- `src/components/ui/Alert.tsx` — Inline alert with `error | success | warning | info` variants using CSS variables. Icon per variant, optional title, accessible `role="alert"`.
- `src/components/auth/PasswordInput.tsx` — Password field with show/hide toggle (Eye/EyeOff icons), uses CSS variable border colors, `tabIndex={-1}` on toggle so it doesn't interfere with keyboard form navigation.
- `src/components/auth/OtpBox.tsx` — 6-box individual OTP input. Auto-advance on digit entry, backspace clears current then moves back, arrow key navigation, paste support (pastes full OTP at once), `onFocus` selects all.
- `src/components/auth/OtpTimer.tsx` — 60s countdown timer. Shows "Resend OTP" when countdown expires. Restarts on resend. Cleanup on unmount.
- `src/components/auth/PasswordStrength.tsx` — 4-bar visual strength meter (Weak/Fair/Good/Strong). Checks: length≥8, length≥12, uppercase, number, special char. Hidden when password is empty.
- `src/app/(auth)/login/page.tsx` — Login with two tabs: **Password** (email + password + remember-me) and **OTP** (email → send OTP → verify). Reads `?redirect=` param to redirect after login.
- `src/app/(auth)/register/page.tsx` — Multi-step: **Step 1** (name + email + phone + password + confirm + strength meter + legal copy) → **Step 2** (email OTP verification). Auto-sends OTP after step 1 success.
- `src/components/account/ProfileForm.tsx` — Edit name + phone. Email shown as read-only with verified badge. Disabled save button when form is pristine (`isDirty` guard). Shows warning if email unverified.
- `src/components/account/PasswordForm.tsx` — Change password with current + new + confirm. Auto-logout after success (backend clears cookie on password change).
- `src/components/account/AddressForm.tsx` — Reusable form for create and edit. Grid layout for city/state and PIN/country.
- `src/components/account/AddressList.tsx` — Full CRUD: list, inline edit, set default, delete (with confirm dialog). Optimistic invalidation via React Query. Grid layout on sm+.
- `src/app/(shop)/account/page.tsx` — Protected account page with sidebar tab navigation (Profile / Password / Addresses).
- `src/components/Providers.tsx` — Added `<Toaster>` with bottom-right position and Amazon-themed border accents.

**Edge cases handled:**

**Login:**
- API error messages normalized: "invalid credentials" → "Incorrect email or password." (avoids exposing internal error structure)
- OTP cleared on verification failure — forces user to re-enter rather than retry with stale OTP
- OTP expiry detected by keyword check in error message → shows specific "OTP has expired" message
- `?redirect=` query param preserved through login/register → user lands on intended page
- Tab state persisted within session — switching tabs doesn't reset the other tab's form
- `qc.setQueryData(QUERY_KEYS.ME, user)` after login — hydrates React Query cache immediately, no extra `/auth/me` round-trip
- OTP login step 2 has "← Change email" fallback if user entered wrong email

**Register:**
- `email already exists` → friendly "Try signing in" message instead of raw API error
- `confirmPassword` mismatch validated at schema level with `refine()` — error attached to `confirmPassword` field
- Password strength shown live as user types
- OTP send failure after registration is silent (fire-and-forget) — user lands on verify step anyway and can use Resend
- Back navigation on verify step returns to pre-filled form (email state preserved)

**Profile:**
- Save button disabled when `isDirty` is false — prevents redundant API calls
- `useEffect` on `[user.name, user.phone]` resets form when user data changes externally
- React Query `staleTime: 0` on account page ensures fresh data on every visit
- `initialData: cachedUser` prevents flash of loading spinner if user is already in Zustand store

**Password change:**
- "incorrect" keyword check → "Current password is incorrect" instead of generic error
- Form NOT reset on API error — user only needs to fix the wrong field
- Auto logout + redirect to login after success (backend cookie is already cleared)

**Addresses:**
- Delete requires `confirm()` dialog to prevent accidental deletion
- Backend blocks delete if address has active orders — error shown via toast
- Inline edit form (no modal) — replaces card content in place for better UX
- `deletingId` state tracks which address is being deleted for per-item loading spinner
- First address auto-set as default by backend — no special UI needed

---

### Phase 3 — Product Listing, Detail & Homepage

**Files added:**
- `src/hooks/useCart.ts` — shared hook: cart query (enabled only when logged in) + `addItem` mutation + badge count sync via `useEffect`
- `src/hooks/useWishlist.ts` — shared hook: wishlist query + toggle mutation (add if absent, remove if present). Exposes `wishedProductIds` Set for O(1) lookup in ProductCard
- `src/components/product/ProductCard.tsx` — image, title, category, price, star rating, low-stock warning, out-of-stock badge, add-to-cart button, wishlist heart (visible on hover)
- `src/components/product/ProductGrid.tsx` — responsive 2/3/4-col grid with skeleton loading and EmptyState fallback
- `src/components/product/ProductFilters.tsx` — sidebar: department list, sort options, price range inputs. All changes push to URL params and reset page to 1
- `src/components/product/ProductImageGallery.tsx` — thumbnail strip (desktop) + main image. Mobile: swipe arrows + dot indicators + prev/next buttons
- `src/components/product/ReviewList.tsx` — paginated reviews with sort tabs (newest/highest/critical). Star summary card. React Query `placeholderData: keepPreviousData` prevents flash on page change
- `src/components/product/ReviewForm.tsx` — write-a-review with StarPicker + textarea. Gated: shows info alert if not logged in, or if no purchase
- `src/app/(shop)/products/page.tsx` — full listing page: URL-driven filters, result count, mobile filter drawer overlay, pagination
- `src/app/(shop)/products/[slug]/page.tsx` — detail page: breadcrumb, image gallery, price, stock, add-to-cart + wishlist, share button (Web Share API + clipboard fallback), description, reviews section
- `src/components/home/HeroBanner.tsx` — auto-rotating carousel (5s), 3 slides with gradient backgrounds, prev/next arrows, dot indicators, CSS-only transition (no extra library)
- `src/components/home/CategoryGrid.tsx` — emoji icon + name grid, 3/4/6 col responsive. Icons mapped from category name keywords
- `src/components/home/ProductRow.tsx` — horizontal scroll row with hover prev/next arrows, skeleton loading. Used for Today's Deals / Best Sellers / New Arrivals
- `src/app/page.tsx` — homepage with Navbar + Footer + HeroBanner + CategoryGrid + 3x ProductRow

**Edge cases handled:**

**ProductCard:**
- Image `onError` fallback to placeholder — never shows broken image icon
- Out-of-stock products show "Unavailable" button (disabled) not "Add to Cart"
- Stock ≤ 5 shows "Only N left" warning in Amazon orange
- Wishlist heart only visible on hover / focus — clean UI by default
- `compact` prop for carousel rows — smaller fixed width, no cart button, shorter title truncation

**Products listing page:**
- All filters/sort/page synced to URL — shareable links, browser back/forward work
- Filter changes reset page to 1 — prevents empty page when changing filter with existing page=5
- Mobile filter drawer with backdrop click to close — no layout shift
- `placeholderData: keepPreviousData` — previous results stay visible while fetching next page (no flash)
- Result count shown — "1,234 results" with Indian number formatting

**Product detail page:**
- `use(params)` for Next.js 15+ async params
- `retry: false` on product query → `notFound()` on 404 — no infinite retry for invalid slugs
- Web Share API used if available; clipboard fallback with toast confirmation
- `hasPurchased` prop on ReviewForm: backend enforces it, UI shows friendly message
- Review errors normalized: "already" → "You've already reviewed", "purchase" → proper message
- Breadcrumb shows category link if product has category

**Homepage:**
- Hero auto-rotation pauses naturally when user interacts (arrow click resets internal timer)
- 3 parallel product row queries — independent loading, each row shows skeleton while others load
- Category icons mapped by name keywords — graceful emoji fallback for unknown categories
- ProductRow scroll arrows hidden until hover — clean look, visible when needed

---

### Phase 4 — Cart, Wishlist, Checkout & Orders

**Files added / updated:**
- `src/hooks/useCart.ts` — extended with `updateItem`, `removeItem`, `clearCart` mutations. Shared `syncCount()` helper keeps navbar badge in sync after every mutation.
- `src/hooks/useRazorpay.ts` — loads Razorpay checkout.js SDK dynamically on first call (avoids loading 100kb script on every page). Exposes `openRazorpay({ key, amount, order_id, onSuccess, onDismiss })`.
- `src/components/cart/CartItemRow.tsx` — quantity +/−, line total, inline remove. Dims row during mutation. Handles out-of-stock and low-stock states.
- `src/components/cart/CartSummary.tsx` — subtotal, FREE delivery, order total, out-of-stock warning, secure checkout button. Sticky on desktop.
- `src/app/(shop)/cart/page.tsx` — cart page with clear-all, continue shopping link, empty state. Protected route.
- `src/app/(shop)/wishlist/page.tsx` — grid with Move to Cart (atomic backend operation) and Remove. Invalidates both wishlist and cart queries on move.
- `src/components/checkout/AddressSelector.tsx` — radio-style address cards. Add new address inline (no page leave). Auto-selects newly created address.
- `src/components/checkout/PaymentModeSelector.tsx` — radio cards for COD / Razorpay / Test Bypass. Each with icon, label, description.
- `src/components/checkout/OrderSummary.tsx` — compact item list with quantity badges, subtotal, total. Sticky sidebar.
- `src/app/(shop)/checkout/page.tsx` — 2-step checkout (address → payment). Handles all 3 payment modes. Razorpay modal integration with signature verification.
- `src/components/order/OrderCard.tsx` — compact order card with first item image, +N badge, status badges, total. Links to detail page.
- `src/components/order/OrderStatusTimeline.tsx` — 4-step horizontal progress: Placed → Processing → Shipped → Delivered. Shows CANCELLED state with icon.
- `src/app/(shop)/orders/page.tsx` — orders list with status filter tabs (All / Pending / Processing / Shipped / Delivered / Cancelled), pagination.
- `src/app/(shop)/orders/[id]/page.tsx` — full order detail: timeline, item list, delivery address, payment info, cancel button.

**Edge cases handled:**

**Cart:**
- Quantity = 0 via `−` button triggers remove (not quantity update) — avoids 0-qty cart items
- `atMaxStock` disables `+` when quantity reaches stock limit — prevents over-ordering
- Clear cart requires `confirm()` dialog — prevents accidental wipe
- Dims row during mutation (`opacity-60`) — visual feedback without blocking UI

**Checkout:**
- Empty cart detected before rendering → redirects to EmptyState
- Address required + payment mode required before Submit enabled (`canSubmit` guard)
- COD/TEST_BYPASS: order confirmed immediately, cart invalidated, redirect to order detail
- RAZORPAY flow: place order → get `razorpayOrder` + `keyId` → open modal → on success call `verifyPayment` → redirect. If user dismisses modal: show warning toast, redirect to orders (order still exists as PENDING)
- Stock error detected by keyword → "Some items are out of stock. Please update your cart."
- Payment verification failure shows inline error (not toast) — user must retry
- `prefill` passes user name + email to Razorpay modal — reduces friction
- Razorpay theme color set to `#ff9900` (Amazon orange)

**Orders:**
- Status filter changes reset page to 1 — no empty page results
- Cancel button shown only for PENDING / PROCESSING orders — guarded on frontend and backend
- Cancel requires `confirm()` dialog
- `retry: false` on order detail query → `notFound()` for invalid IDs
- Order ID shown as last 8/12 chars uppercase — more readable than full UUID

**Wishlist:**
- `moveToCart` uses backend atomic operation (removes from wishlist + adds to cart in one transaction)
- Both WISHLIST and CART query keys invalidated after move — both badge and wishlist page stay in sync
- Out-of-stock items shown with badge but "Move to Cart" disabled
