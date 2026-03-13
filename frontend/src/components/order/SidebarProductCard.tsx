"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

interface SidebarProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: string;
    imageUrl?: string;
  };
}

const PLACEHOLDER = "https://placehold.co/70x70/eaeded/565959?text=?";

function discountFromId(id: string): number {
  return 20 + ((id.charCodeAt(0) || 1) % 40);
}

export function SidebarProductCard({ product }: SidebarProductCardProps) {
  const { addItem } = useCart();
  const [imageSrc, setImageSrc] = useState(product.imageUrl ?? PLACEHOLDER);
  const discount = discountFromId(product.id);

  return (
    <article className="flex gap-3">
      <div className="relative w-17.5 h-17.5 shrink-0">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="70px"
          className="object-contain"
          onError={() => setImageSrc(PLACEHOLDER)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2"
        >
          {product.title}
        </Link>
        <p className="text-[13px] text-[#CC0C39] mt-1">-{discount}%</p>
        <p className="text-[16px] font-semibold text-[#0F1111] leading-tight">{formatPrice(product.price)}</p>
        <p className="text-[12px] text-[#565959] mt-0.5">FREE delivery by tomorrow</p>

        <button
          type="button"
          onClick={() => addItem.mutate({ productId: product.id, quantity: 1 })}
          className="mt-2 h-7 px-3 rounded-[20px] border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[12px] text-[#0F1111] cursor-pointer"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
