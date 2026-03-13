"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { categoryService } from "@/services/category.service";
import { QUERY_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Star, ChevronDown } from "lucide-react";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";

const PRICE_MAX = 20000;
const PRICE_MIN = 0;

const PRICE_BUCKETS = [
  { label: "Up to ₹600",          min: undefined as number | undefined, max: 600           },
  { label: "₹600 - ₹1,500",       min: 600,                             max: 1500          },
  { label: "₹1,500 - ₹5,000",     min: 1500,                            max: 5000          },
  { label: "₹5,000 - ₹20,000",    min: 5000,                            max: 20000         },
  { label: "Over ₹20,000",        min: 20000,                           max: undefined as number | undefined },
];

const DISCOUNT_OPTS = [
  { label: "10% Off or more",  value: "10" },
  { label: "25% Off or more",  value: "25" },
  { label: "35% Off or more",  value: "35" },
  { label: "50% Off or more",  value: "50" },
  { label: "60% Off or more",  value: "60" },
  { label: "70% Off or more",  value: "70" },
];

// ── Tiny orange stars ──────────────────────────────────────────────────────────
function Stars({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <span className="inline-flex items-center gap-[1px]">
      {Array.from({ length: total }).map((_, i) => (
        <Star key={i} size={12}
          className={i < filled ? "text-[#ff9900]" : "text-[#ccc]"}
          fill="currentColor"
        />
      ))}
    </span>
  );
}

// ── Section wrapper with optional "See more" ───────────────────────────────────
function FilterSection({ title, children, separator = true }: { title: string; children: React.ReactNode; separator?: boolean }) {
  return (
    <div className={cn("py-3", separator && "border-b border-[var(--amazon-border)]")}>
      <h3 className="text-[14px] font-bold text-[var(--amazon-text-primary)] mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

// ── Checkbox row ──────────────────────────────────────────────────────────────
function CheckRow({
  label,
  checked,
  onChange,
  children,
}: {
  label?: string;
  checked: boolean;
  onChange: () => void;
  children?: React.ReactNode;
}) {
  return (
    <label
      className="flex items-center gap-2 py-[3px] cursor-pointer group hover:text-[var(--amazon-link)]"
      onClick={onChange}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="w-3.5 h-3.5 accent-[var(--amazon-warning)] cursor-pointer shrink-0"
      />
      <span className="text-[13px] text-[var(--amazon-text-primary)] leading-snug group-hover:text-[var(--amazon-link)] group-hover:underline select-none">
        {children ?? label}
      </span>
    </label>
  );
}

// ── Text link row (no checkbox) ───────────────────────────────────────────────
function LinkRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left text-[13px] py-[3px] cursor-pointer leading-snug",
        active
          ? "font-bold text-[var(--amazon-text-primary)] pointer-events-none"
          : "text-[var(--amazon-link)] hover:text-[var(--amazon-link-hover)] hover:underline"
      )}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function ProductFilters() {
  const router = useRouter();
  const sp     = useSearchParams();

  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [includeOOS, setIncludeOOS]                 = useState(false);

  // Local slider state
  const activeMinP = sp.get("minPrice") ? Number(sp.get("minPrice")) : PRICE_MIN;
  const activeMaxP = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : PRICE_MAX;
  const [sliderVal, setSliderVal] = useState<[number, number]>([activeMinP, activeMaxP]);

  const active = {
    categoryId: sp.get("categoryId") ?? "",
    sortBy:     sp.get("sortBy")     ?? "",
    minPrice:   sp.get("minPrice")   ?? "",
    maxPrice:   sp.get("maxPrice")   ?? "",
    minRating:  sp.get("minRating")  ?? "",
    discount:   sp.get("discount")   ?? "",
  };

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn:  () => categoryService.getAll().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const set = useCallback((patches: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patches)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }, [router, sp]);

  const applySlider = useCallback(([min, max]: [number, number]) => {
    set({
      minPrice: min > PRICE_MIN ? String(min) : "",
      maxPrice: max < PRICE_MAX ? String(max) : "",
    });
  }, [set]);

  const VISIBLE_CATS = showMoreCategories ? (categories ?? []) : (categories ?? []).slice(0, 5);

  // Price bucket check
  const activeBucket = PRICE_BUCKETS.findIndex(
    (b) =>
      (b.min === undefined ? active.minPrice === "" : String(b.min) === active.minPrice) &&
      (b.max === undefined ? active.maxPrice === "" : String(b.max) === active.maxPrice)
  );

  return (
    <aside className="w-full text-[13px] select-none">

      {/* ── Department ─────────────────────────────────────────────── */}
      <FilterSection title="Department">
        <LinkRow label="Any Department" active={!active.categoryId} onClick={() => set({ categoryId: "" })} />
        {VISIBLE_CATS.map((cat) => (
          <LinkRow key={cat.id} label={cat.name}
            active={active.categoryId === cat.id}
            onClick={() => set({ categoryId: cat.id })} />
        ))}
        {(categories?.length ?? 0) > 5 && (
          <button
            onClick={() => setShowMoreCategories((v) => !v)}
            className="flex items-center gap-0.5 text-[var(--amazon-link)] hover:underline mt-0.5 text-[12px] cursor-pointer"
          >
            <ChevronDown size={12} className={cn("transition-transform", showMoreCategories && "rotate-180")} />
            {showMoreCategories ? "See less" : "See more"}
          </button>
        )}
      </FilterSection>

      {/* ── Price slider ───────────────────────────────────────────── */}
      <FilterSection title="Price">
        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={sliderVal}
          onChange={(v) => {
            setSliderVal(v);
            applySlider(v);
          }}
        />
        <div className="mt-3 space-y-0">
          {PRICE_BUCKETS.map((b, i) => (
            <CheckRow
              key={b.label}
              label={b.label}
              checked={activeBucket === i}
              onChange={() => {
                const newMin = b.min ?? PRICE_MIN;
                const newMax = b.max ?? PRICE_MAX;
                setSliderVal([newMin, newMax]);
                set({
                  minPrice: b.min ? String(b.min) : "",
                  maxPrice: b.max ? String(b.max) : "",
                });
              }}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── Deals & Discounts ──────────────────────────────────────── */}
      <FilterSection title="Deals &amp; Discounts">
        <LinkRow label="All Discounts"  active={active.discount === "any"} onClick={() => set({ discount: "any" })} />
        <LinkRow label="Today's Deals"  active={active.discount === "today"} onClick={() => set({ discount: "today" })} />
      </FilterSection>

      {/* ── Customer Review ────────────────────────────────────────── */}
      <FilterSection title="Customer Review">
        {[4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            onClick={() => set({ minRating: active.minRating === String(stars) ? "" : String(stars) })}
            className="flex items-center gap-1.5 py-[3px] w-full text-left cursor-pointer group"
          >
            <Stars filled={stars} />
            <span className={cn(
              "text-[13px] leading-none group-hover:underline",
              active.minRating === String(stars)
                ? "font-bold text-[var(--amazon-text-primary)]"
                : "text-[var(--amazon-link)]"
            )}>
              &amp; Up
            </span>
          </button>
        ))}
      </FilterSection>

      {/* ── Discount ───────────────────────────────────────────────── */}
      <FilterSection title="Discount">
        {DISCOUNT_OPTS.map((opt) => (
          <CheckRow
            key={opt.value}
            label={opt.label}
            checked={active.discount === opt.value}
            onChange={() => set({ discount: active.discount === opt.value ? "" : opt.value })}
          />
        ))}
      </FilterSection>

      {/* ── Pay On Delivery ────────────────────────────────────────── */}
      <FilterSection title="Pay On Delivery">
        <CheckRow label="Eligible for Pay On Delivery" checked={false} onChange={() => {}} />
      </FilterSection>

      {/* ── New Arrivals ───────────────────────────────────────────── */}
      <FilterSection title="New Arrivals">
        <LinkRow label="Last 30 days" active={active.sortBy === "newest"} onClick={() => set({ sortBy: "newest" })} />
        <LinkRow label="Last 90 days" active={false} onClick={() => set({ sortBy: "oldest" })} />
      </FilterSection>

      {/* ── Availability ───────────────────────────────────────────── */}
      <FilterSection title="Availability">
        <CheckRow
          label="Include Out of Stock"
          checked={includeOOS}
          onChange={() => setIncludeOOS((v) => !v)}
        />
      </FilterSection>

      {/* ── Customizable Products ──────────────────────────────────── */}
      <FilterSection title="Customizable Products" separator={false}>
        <CheckRow label="Customizable" checked={false} onChange={() => {}} />
      </FilterSection>

    </aside>
  );
}
