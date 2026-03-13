"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { productService } from "@/services/product.service";
import { QUERY_KEYS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductFilters } from "@/types";

interface ProductRowProps {
  title: string;
  subtitle?: string;
  filters: ProductFilters;
  viewAllHref?: string;
  viewAllLabel?: string;
}

const PLACEHOLDER = "https://placehold.co/220x200/eaeded/565959?text=?";

export function ProductRow({
  title,
  subtitle,
  filters,
  viewAllHref,
  viewAllLabel = "See all",
}: ProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS(filters),
    queryFn:  () => productService.getAll({ ...filters, limit: 12 }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -900 : 900, behavior: "smooth" });
  };

  const products = (data?.products ?? []).filter((p) => p.images?.[0]?.url);
  if (!isLoading && (isError || products.length === 0)) return null;

  return (
    <section className="w-full max-w-375 mx-auto bg-white border border-[#e7e7e7] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-[21px] leading-7 font-semibold text-[#0F1111]">{title}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline">
              {viewAllLabel}
            </Link>
          )}
        </div>
        {subtitle && (
          <p className="text-[13px] text-[#565959] mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Scrollable row */}
      <div className="relative group px-5 pb-4">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-full w-10
                     bg-linear-to-r from-white to-transparent
                     flex items-center justify-start pl-1
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <span className="bg-white shadow-md rounded-full p-1.5 border border-[var(--amazon-border)]">
            <ChevronLeft size={16} className="text-[var(--amazon-text-primary)]" />
          </span>
        </button>

        {/* Products */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 scrollbar-none"
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-55 shrink-0">
                  <Skeleton className="h-50 rounded-sm" />
                </div>
              ))
            : products.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="w-55 shrink-0 block">
                  <div className="relative h-50 w-full bg-[#f7f7f7] overflow-hidden">
                    <Image
                      src={p.images[0].url || PLACEHOLDER}
                      alt={p.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="220px"
                    />
                  </div>
                  <p className="text-[12px] text-[#0F1111] mt-1 line-clamp-2">{p.title}</p>
                </Link>
              ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-full w-10
                     bg-linear-to-l from-white to-transparent
                     flex items-center justify-end pr-1
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        >
          <span className="bg-white shadow-md rounded-full p-1.5 border border-[var(--amazon-border)]">
            <ChevronRight size={16} className="text-[var(--amazon-text-primary)]" />
          </span>
        </button>
      </div>
    </section>
  );
}
