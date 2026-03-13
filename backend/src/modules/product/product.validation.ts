import { z } from "zod";
import { ProductStatus } from "@prisma/client";

export const createProductSchema = z.object({
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  price: z.number().positive("Price must be positive"),
  mrp: z.number().positive("MRP must be positive"),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid("Invalid category ID"),
  images: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image is required"),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "oldest", "rating"])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
