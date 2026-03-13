"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { reviewService } from "@/services/review.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";
import { StarPicker } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const reviewSchema = z.object({
  rating:  z.number().min(1, "Select a star rating").max(5),
  comment: z.string().max(1000, "Max 1000 characters").optional(),
});
type ReviewInput = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  hasPurchased: boolean; // backend enforces; we show message here for UX
}

export function ReviewForm({ productId, hasPurchased }: ReviewFormProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({ resolver: zodResolver(reviewSchema) });

  const mutation = useMutation({
    mutationFn: (data: ReviewInput) =>
      reviewService.create(productId, { rating: data.rating, comment: data.comment }),
    onSuccess: () => {
      toast.success("Review submitted! Thank you.");
      qc.invalidateQueries({ queryKey: QUERY_KEYS.REVIEWS(productId, {}) });
      // Invalidate product too (avgRating / reviewCount updated)
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS()] });
      reset();
      setRating(0);
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(
        err.message?.toLowerCase().includes("already")
          ? "You've already reviewed this product."
          : err.message?.toLowerCase().includes("purchase")
          ? "You can only review products you've purchased."
          : (err.message ?? "Failed to submit review")
      );
    },
  });

  if (!user) {
    return (
      <Alert
        variant="info"
        message={`Sign in to write a review.`}
      />
    );
  }

  if (!hasPurchased) {
    return (
      <Alert
        variant="info"
        message="You can only review products you've purchased and received."
      />
    );
  }

  if (!open) {
    return (
      <button
        className="btn-amazon w-fit px-6 rounded"
        onClick={() => setOpen(true)}
      >
        Write a customer review
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate({ ...d, rating }))}
      noValidate
      className="amazon-card p-4 space-y-4"
    >
      <h3 className="font-semibold">Write your review</h3>

      <div>
        <label className="form-label mb-1.5">Overall rating</label>
        <input type="hidden" {...register("rating", { valueAsNumber: true })} value={rating} />
        <StarPicker value={rating} onChange={setRating} size="lg" />
        {errors.rating && <p className="form-error mt-1">{errors.rating.message}</p>}
      </div>

      <div>
        <label className="form-label" htmlFor="review-comment">
          Review (optional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          placeholder="What did you like or dislike? How was the quality?"
          className="w-full border border-[var(--amazon-border)] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--amazon-border-focus)] resize-none"
          {...register("comment")}
        />
        {errors.comment && <p className="form-error">{errors.comment.message}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="sm" loading={isSubmitting || mutation.isPending}>
          Submit review
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
