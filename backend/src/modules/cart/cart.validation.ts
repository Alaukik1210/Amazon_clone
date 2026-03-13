import { z } from "zod";

export const addItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const updateItemSchema = z.object({
  // quantity 0 means remove the item — handled in service
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
});
