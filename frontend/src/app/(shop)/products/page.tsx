"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { productService } from "@/services/product.service";
import { QUERY_KEYS } from "@/lib/constants";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFilters as Filters, ProductListResponse } from "@/types";

const LIMIT = 20;

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-[320px]" />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const sp     = useSearchParams();
  const router = useRouter();
  const [mobileFilters, setMobileFilters] = useState(false);

  const filters: Filters = {
    search:     sp.get("search")     ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    sortBy:     (sp.get("sortBy") as Filters["sortBy"]) ?? undefined,
    minPrice:   sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice:   sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    minRating:  sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    page:       sp.get("page")    ? Number(sp.get("page"))    : 1,
    limit:      LIMIT,
  };

  const { data, isLoading, isFetching } = useQuery<ProductListResponse>({
    queryKey: QUERY_KEYS.PRODUCTS(filters),
    queryFn:  () => productService.getAll(filters).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const handlePage = (page: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(page));
    router.push(`/products?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const searchTerm = sp.get("search");
  const total = data?.pagination.total ?? 0;
  const page  = data?.pagination.page  ?? 1;
  const from  = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to    = Math.min(page * LIMIT, total);

  return (
    <div className="min-h-screen bg-(--amazon-bg-page)">

      {/* ── Top result bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#ddd] py-2 px-4">
        <div className="max-w-375 mx-auto flex items-baseline gap-3 flex-wrap">
          {/* Result count — Amazon style: "1-16 of over 2,000 results for ..." */}
          {isLoading ? (
            <Skeleton className="h-4 w-56" />
          ) : data ? (
            <p className="text-[13px] text-[var(--amazon-text-muted)] whitespace-nowrap">
              {total > 0 ? `${from}-${to} of ` : ""}
              {total > 999 ? "over " : ""}
              <span className="font-normal text-[var(--amazon-text-primary)]">
                {total.toLocaleString("en-IN")} results
              </span>
              {searchTerm ? (
                <span> for <span className="text-[var(--amazon-warning)] font-semibold">&ldquo;{searchTerm}&rdquo;</span></span>
              ) : null}
            </p>
          ) : null}
          <div className="flex-1" />
          {/* Mobile filter toggle */}
          <button
            className="md:hidden flex items-center gap-1.5 btn-secondary px-3 py-1 text-[13px]"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal size={13} /> Filters
          </button>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────── */}
      <div className="max-w-375 mx-auto flex items-start">

        {/* Desktop sidebar — 240px, fixed width, white, right border */}
        <aside className="hidden md:block w-60 shrink-0 bg-white border-r border-[#ddd] self-stretch px-3 py-3">
          <ProductFilters />
        </aside>

        {/* Mobile drawer */}
        {mobileFilters && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
            <div className="relative bg-white w-72 max-w-[85vw] h-full overflow-y-auto px-4 py-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[15px]">Filters</h2>
                <button onClick={() => setMobileFilters(false)} className="cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              <ProductFilters />
            </div>
          </div>
        )}

        {/* Product results */}
        <main className={cn("flex-1 min-w-0 bg-(--amazon-bg-page)", isFetching && "opacity-70 pointer-events-none transition-opacity")}>
          <ProductGrid products={data?.products} isLoading={isLoading} skeletonCount={LIMIT} />

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="bg-white border-t border-[#ddd] py-5 flex justify-center">
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                hasNext={data.pagination.hasNext}
                hasPrev={data.pagination.hasPrev}
                onPageChange={handlePage}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
