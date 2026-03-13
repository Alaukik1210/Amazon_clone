"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/types";

const PLACEHOLDER = "https://placehold.co/300x300/eaeded/565959?text=No+Image";

// ── Deterministic helpers (seed from product.id chars) ────────────────────────

function seed(id: string, offset = 0): number {
  return id.charCodeAt(offset % id.length) ?? 0;
}

function discountPct(id: string): number {
  // 25 – 68 %
  return 25 + (seed(id, 2) % 44);
}

function boughtText(reviewCount: number): string {
  if (reviewCount >= 100000) return `${Math.floor(reviewCount / 1000)}K+ bought in past month`;
  if (reviewCount >= 1000) return `${Math.floor(reviewCount / 1000) * 100}+ bought in past month`;
  return `50+ bought in past month`;
}

function deliveryDay(id: string, daysAhead: number): string {
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date();
  d.setDate(d.getDate() + daysAhead + (seed(id, 0) % 2));
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// Badge: 0=none, 1=Best Seller, 2=Amazon's Choice
function badgeType(id: string): 0 | 1 | 2 {
  const v = seed(id, 1) % 7;
  if (v === 0) return 1; // ~14%
  if (v === 1) return 2; // ~14%
  return 0;
}

// Sponsored: ~40% of products
function isSponsored(id: string): boolean {
  return seed(id, 3) % 5 <= 1;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ type }: { type: 1 | 2 }) {
  if (type === 1) return (
    <div className="absolute top-0 left-0 z-10 bg-[#c45500] text-white text-[10px] font-bold px-1.5 py-0.5 leading-tight">
      Best<br/>Seller
    </div>
  );
  return (
    <div className="absolute top-0 left-0 z-10 bg-[#232f3e] text-white text-[10px] font-bold px-1.5 py-0.5 leading-tight whitespace-nowrap">
      Amazon&apos;s<br/>Choice
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem }                  = useCart();
  const { wishedProductIds, toggle } = useWishlist();
  const [imageSrc, setImageSrc]      = useState(product.images[0]?.url ?? PLACEHOLDER);
  const [selectedSize, setSelectedSize] = useState("L");

  const isWished  = wishedProductIds.has(product.id);
  const isOOS     = product.status === "OUT_OF_STOCK" || product.stock === 0;
  const lowStock  = !isOOS && product.stock > 0 && product.stock <= 5;
  const price     = Number(product.price);
  const pct       = discountPct(product.id);
  const mrp       = Math.round(price * (100 / (100 - pct)));
  const badge     = badgeType(product.id);
  const sponsored = isSponsored(product.id);
  const bought    = boughtText(product.reviewCount);
  const freeDate  = deliveryDay(product.id, 3);
  const fastDate  = deliveryDay(product.id, 2);
  const isClothing = product.category?.slug === "fashion";
  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  // ── COMPACT — for homepage carousels ────────────────────────────────────────
  if (compact) {
    return (
      <div className="w-[180px] shrink-0 bg-white group flex flex-col cursor-pointer border border-transparent hover:border-[var(--amazon-border)] hover:shadow-md transition-all duration-150">
        {/* Image */}
        <Link href={`/products/${product.slug}`} className="block relative h-[160px] overflow-hidden bg-white">
          <Image
            src={imageSrc} alt={product.title} fill sizes="180px"
            className="object-contain p-2 group-hover:scale-[1.04] transition-transform duration-300"
            onError={() => setImageSrc(PLACEHOLDER)}
          />
        </Link>
        {/* Info */}
        <div className="px-2 pb-3 pt-1 flex flex-col flex-1">
          <Link href={`/products/${product.slug}`}
            className="text-[12.5px] leading-[1.3] line-clamp-2 text-[var(--amazon-text-primary)] hover:text-[var(--amazon-link)] mb-1 transition-colors">
            {product.title}
          </Link>
          {product.reviewCount > 0 && (
            <StarRating rating={product.avgRating} reviewCount={product.reviewCount} size="sm" className="mb-1" />
          )}
          <div className="mt-auto">
            <p className="text-[15px] font-bold text-[var(--amazon-text-primary)] leading-tight">
              <span className="text-[11px] font-normal align-super mr-0.5 leading-5">₹</span>
              {Math.floor(price).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-[#cc0c39] font-semibold leading-tight">{pct}% off</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL GRID CARD — Amazon search result ────────────────────────────────────
  return (
    <div
      className="relative w-full h-[568px] bg-white rounded-[4px] border border-[#e7e7e7] px-[12px] pt-[12px] pb-[6px] flex flex-col group cursor-pointer text-[14px] leading-5 font-normal"
      style={{ fontFamily: '"Amazon Ember", Arial, sans-serif', letterSpacing: "normal" }}
    >

      {/* ① Badge (Best Seller / Amazon's Choice) */}
      {badge > 0 && <Badge type={badge as 1 | 2} />}

      {/* Wishlist — top right */}
      <button
        aria-label={isWished ? "Remove from wishlist" : "Save for later"}
        onClick={(e) => { e.preventDefault(); toggle.mutate(product.id); }}
        className={cn(
          "absolute top-[12px] right-[12px] z-20 w-8 h-8 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer",
          "transition-all duration-150",
          isWished ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <Heart size={16} className={isWished ? "fill-red-500 text-red-500" : "text-gray-400"} />
      </button>

      {/* ① Image — square, object-contain, white bg */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative h-[252px] overflow-hidden bg-white mb-[6px]"
      >
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 20vw, 17vw"
          className="object-cover absolute inset-0"
          onError={() => setImageSrc(PLACEHOLDER)}
        />
        {/* OOS overlay */}
        {isOOS && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[var(--amazon-text-muted)] bg-white border border-[var(--amazon-border)] px-2 py-0.5 rounded-sm">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {/* ③–⑨ Info area */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ③ Sponsored */}
        <div className="h-[16px] mb-[2px]">
          {sponsored && !isOOS ? (
            <p className="text-[12px] text-[#565959] leading-[1.2]">
              Sponsored{" "}
              <span className="inline-flex items-center justify-center w-3 h-3 border border-[var(--amazon-text-muted)] rounded-full text-[8px] leading-none">ⓘ</span>
            </p>
          ) : null}
        </div>

        {/* ④ Brand */}
        <div className="h-[18px] mb-[2px]">
          {product.category ? (
            <p className="text-[12px] font-bold text-[#0F1111] leading-[1.2]">
              {product.category.name}
            </p>
          ) : null}
        </div>

        {/* ⑤ Title — 2-line clamp */}
        <Link
          href={`/products/${product.slug}`}
          className="mt-[6px] mb-[4px] min-h-[35px] text-[14px] font-normal leading-[1.25] line-clamp-2 text-[#0F1111] hover:text-[#c45500] transition-colors"
        >
          {product.title}
        </Link>

        {/* ⑥ Rating + review count */}
        <div className="h-[18px] mb-[4px]">
          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-[4px]">
              <StarRating
                rating={product.avgRating}
                reviewCount={product.reviewCount}
                size="sm"
                showCount={false}
              />
              <span className="text-[#007185] text-[13px] leading-none hover:text-[#c45500] cursor-pointer hover:underline">
                ({product.reviewCount.toLocaleString("en-IN")})
              </span>
            </div>
          ) : null}
        </div>

        {/* Bought text */}
        <p className="text-[12px] text-[#565959] mb-[6px] leading-[1.25]">{bought}</p>

        {/* ⑦ Price — ₹499 style */}
        <div className="flex items-end mb-[2px] leading-none">
          <span className="text-[#CC0C39] text-[18px] font-medium">-{pct}%</span>
          <span className="ml-[6px] text-[22px] font-medium text-[#0F1111] leading-none">
            <span className="text-[13px] align-top leading-[1] mr-[1px]">₹</span>
            {Math.floor(price).toLocaleString("en-IN")}
            <span className="text-[13px] align-top leading-[1] ml-[1px]">00</span>
          </span>
        </div>

        {/* ⑧ MRP + % off */}
        {!isOOS && (
          <p className="text-[12px] text-[#565959] mb-0 leading-[1.2]">
            M.R.P:{" "}
            <span className="line-through">₹{mrp.toLocaleString("en-IN")}</span>
          </p>
        )}

        {/* ⑨ Delivery */}
        <div className="h-[34px] mt-[6px] mb-0 text-[12px] text-[#0F1111] leading-[1.25]">
          {!isOOS ? (
            <>
              <p>
                <span className="font-bold">FREE delivery </span>
                <span className="font-bold">{freeDate}</span>
              </p>
              <p>Or fastest delivery <span className="font-bold">{fastDate}</span></p>
            </>
          ) : null}
        </div>

        {/* Size options (only for clothing/fashion products) */}
        {isClothing && !isOOS && (
          <div className="mt-[6px] mb-[4px]">
            <p className="text-[12px] text-[#0F1111] mb-[4px]">
              Size: <span className="font-semibold">{selectedSize}</span>
            </p>
            <div className="flex flex-wrap gap-[4px]">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "h-7 min-w-[34px] px-2 border rounded text-[11px] leading-none cursor-pointer transition-colors",
                    selectedSize === size
                      ? "bg-[#0F1111] text-white border-[#0F1111]"
                      : "bg-white text-[#0F1111] border-[#d5d9d9] hover:border-[#0F1111]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OOS message */}
        {isOOS && (
          <p className="text-[12px] text-[var(--amazon-error)] mb-1.5">Currently unavailable.</p>
        )}

        {/* Low stock */}
        {lowStock && (
          <p className="text-[12px] text-[var(--amazon-warning)] mb-1">
            Only {product.stock} left in stock – order soon.
          </p>
        )}

        {/* ⑩ Add to cart — yellow pill, mt-auto pushes to bottom */}
        <button
          disabled={isOOS || addItem.isPending}
          onClick={() => addItem.mutate({ productId: product.id })}
          className={cn(
            "btn-amazon mt-[8px] w-full h-[36px] text-[13px] font-medium rounded-[20px] border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00]",
            isOOS && "opacity-50 cursor-not-allowed"
          )}
        >
          {isOOS ? "Currently unavailable" : addItem.isPending ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
