// ── Enums ──────────────────────────────────────────────────────────────────────

export type Role = "CUSTOMER" | "ADMIN";
export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED";
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMode = "RAZORPAY" | "COD" | "TEST_BYPASS";

// ── User ───────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
}

// ── Address ───────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number }; // included in list response
}

// ── Product ───────────────────────────────────────────────────────────────────

// Shape returned by API on every product response
export interface ProductImage {
  id: string;
  url: string;
  position: number;
  productId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;       // Prisma Decimal serializes to string
  mrp: string;
  tags: string[];
  stock: number;
  status: ProductStatus;
  avgRating: number;
  reviewCount: number;
  sku: string;
  categoryId: string;
  category?: Pick<Category, "id" | "name" | "slug">;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: string;
    stock: number;
    status: ProductStatus;
    images: Pick<ProductImage, "url">[];
  };
}

export interface Cart {
  id?: string;
  items: CartItem[];
  total: number; // computed by backend withTotal()
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    title: string;
    slug: string;
    images: Pick<ProductImage, "url">[];
  };
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  totalAmount: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  addressId: string;
  shippingAddress: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "email">;
}

// ── Review ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  userId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name">;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: string;
    stock: number;
    status: ProductStatus;
    avgRating: number;
    images: Pick<ProductImage, "url">[];
  };
}

export interface Wishlist {
  id?: string;
  items: WishlistItem[];
}

// ── API Response wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: Pagination;
}

// ── Query Params (must match backend validation schemas exactly) ───────────────

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest" | "rating"; // matches backend sortBy
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface ReviewFilters {
  sort?: "newest" | "highest" | "lowest";
  page?: number;
  limit?: number;
}
