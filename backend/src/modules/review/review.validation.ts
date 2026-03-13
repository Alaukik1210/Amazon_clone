import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(2000).optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
