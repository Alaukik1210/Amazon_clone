"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export interface SavedForLaterItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    price: string;
    images: { url: string }[];
  };
}

interface SavedForLaterProps {
  items: SavedForLaterItem[];
  onMoveToCart: (item: SavedForLaterItem) => void;
  onDelete: (itemId: string) => void;
}

const PLACEHOLDER = "https://placehold.co/100x100/eaeded/565959?text=?";

export function SavedForLater({ items, onMoveToCart, onDelete }: SavedForLaterProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!items.length) return null;

  return (
    <section className="mt-4 bg-white border border-[#D5D9D9] rounded-sm p-4">
      <h2 className="text-[24px] font-normal text-[#0F1111] mb-2">Saved for later ({items.length} items)</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const imageSrc = failedImages[item.id] ? PLACEHOLDER : (item.product.images[0]?.url ?? PLACEHOLDER);

          return (
            <article key={item.id} className="grid grid-cols-[100px_1fr] gap-4 border-b border-[#DDD] pb-4 last:border-b-0 last:pb-0">
              <div className="relative w-25 h-25 bg-white">
                <Image
                  src={imageSrc}
                  alt={item.product.title}
                  fill
                  loading="lazy"
                  sizes="100px"
                  className="object-contain"
                  onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                />
              </div>

              <div>
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-[16px] text-[#0F1111] hover:text-[#C7511F] line-clamp-2"
                >
                  {item.product.title}
                </Link>
                <p className="text-[18px] font-medium text-[#0F1111] mt-1">{formatPrice(item.product.price)}</p>

                <div className="flex items-center gap-3 mt-2 text-[13px]">
                  <button
                    type="button"
                    onClick={() => onMoveToCart(item)}
                    className="h-8 px-3 rounded-full border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] cursor-pointer"
                  >
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-[#007185] hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
