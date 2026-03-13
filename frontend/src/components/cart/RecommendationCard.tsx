"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface RecommendationProduct {
  id: string;
  title: string;
  slug: string;
  price: string;
  imageUrl?: string;
}

interface RecommendationCardProps {
  product: RecommendationProduct;
  onAddToCart: () => void;
}

const PLACEHOLDER = "https://placehold.co/80x80/eaeded/565959?text=?";

export function RecommendationCard({ product, onAddToCart }: RecommendationCardProps) {
  const [imageSrc, setImageSrc] = useState(product.imageUrl ?? PLACEHOLDER);

  return (
    <article className="flex gap-3">
      <div className="relative w-20 h-20 shrink-0 bg-white border border-[#E7E7E7] rounded-sm overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          loading="lazy"
          sizes="80px"
          className="object-contain"
          onError={() => setImageSrc(PLACEHOLDER)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-[14px] text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2 leading-[1.3]"
        >
          {product.title}
        </Link>

        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} className="text-[#FF9900]" fill="currentColor" />
          ))}
          <span className="text-[12px] text-[#007185] ml-1">2,681</span>
        </div>

        <p className="text-[24px] leading-none mt-1 text-[#0F1111]">
          <span className="text-[12px] align-top">-29%</span> {formatPrice(product.price)}
        </p>
        <p className="text-[12px] text-[#565959]">Get it by Sunday, March 15</p>

        <button
          type="button"
          onClick={onAddToCart}
          className="mt-2 h-8 px-3 rounded-full border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[13px] text-[#0F1111] cursor-pointer"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
