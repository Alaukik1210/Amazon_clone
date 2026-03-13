export const QUERY_KEYS = {
  // Auth
  ME: ["me"] as const,

  // Products
  PRODUCTS: (params?: object) => ["products", params] as const,
  PRODUCT: (slug: string) => ["product", slug] as const,

  // Categories
  CATEGORIES: ["categories"] as const,

  // Cart
  CART: ["cart"] as const,

  // Wishlist
  WISHLIST: ["wishlist"] as const,

  // Orders
  ORDERS: (params?: object) => ["orders", params] as const,
  ORDER: (id: string) => ["order", id] as const,

  // Reviews
  REVIEWS: (productId: string, params?: object) => ["reviews", productId, params] as const,

  // Addresses
  ADDRESSES: ["addresses"] as const,
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PRODUCTS: "/products",
  PRODUCT: (slug: string) => `/products/${slug}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  ORDER: (id: string) => `/orders/${id}`,
  WISHLIST: "/wishlist",
  ACCOUNT: "/account",
  ADMIN: "/dashboard",
} as const;
