"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { reviewService } from "@/services/review.service";
import { QUERY_KEYS } from "@/lib/constants";
import { StarRating } from "@/components/ui/StarRating";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import type { ReviewFilters, ReviewListResponse } from "@/types";

interface ReviewListProps {
  productId: string;
  avgRating: number;
  reviewCount: number;
}

const SORT_OPTIONS: { value: ReviewFilters["sort"]; label: string }[] = [
  { value: "newest",  label: "Most Recent" },
  { value: "highest", label: "Top Rated" },
  { value: "lowest",  label: "Critical" },
];

// Star breakdown bar (visual only — shows proportional height)
function StarBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-right amazon-link">{star} star</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--amazon-yellow)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-[var(--amazon-text-muted)]">{pct}%</span>
    </div>
  );
}

export function ReviewList({ productId, avgRating, reviewCount }: ReviewListProps) {
  const [sort, setSort]   = useState<ReviewFilters["sort"]>("newest");
  const [page, setPage]   = useState(1);

  const { data, isLoading } = useQuery<ReviewListResponse>({
    queryKey: QUERY_KEYS.REVIEWS(productId, { sort, page }),
    queryFn:  () => reviewService.getAll(productId, { sort, page, limit: 5 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Customer reviews</h2>

      {/* Star summary */}
      {reviewCount > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 amazon-card p-4">
          <div className="text-center shrink-0">
            <p className="text-5xl font-semibold">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} showCount={false} size="sm" className="justify-center mt-1" />
            <p className="text-xs text-[var(--amazon-text-muted)] mt-1">out of 5</p>
          </div>
          {/* We don't have per-star breakdown from API — show placeholder bars */}
          <div className="flex-1 space-y-1.5 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((star) => (
              <StarBar key={star} star={star} count={0} total={0} />
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-3 mb-4 text-sm">
          <span className="text-[var(--amazon-text-muted)]">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={`amazon-link ${sort === opt.value ? "font-bold text-[var(--amazon-text-primary)]" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Review items */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded" />)}
        </div>
      ) : !data?.reviews.length ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Be the first to review this product"
        />
      ) : (
        <div className="space-y-5">
          {data.reviews.map((review) => (
            <div key={review.id} className="border-b border-[var(--amazon-border)] pb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-[var(--amazon-nav-mid)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(review.user.name ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold">{review.user.name}</span>
              </div>
              <StarRating rating={review.rating} showCount={false} size="sm" className="mb-1" />
              <p className="text-xs text-[var(--amazon-text-muted)] mb-2">
                Reviewed on {formatDate(review.createdAt)}
              </p>
              {review.comment && (
                <p className="text-sm text-[var(--amazon-text-primary)] leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}

          {data.pagination.totalPages > 1 && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              hasNext={data.pagination.hasNext}
              hasPrev={data.pagination.hasPrev}
              onPageChange={setPage}
              className="mt-4"
            />
          )}
        </div>
      )}
    </section>
  );
}
