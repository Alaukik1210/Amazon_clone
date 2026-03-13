"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Cart } from "@/types";

const PLACEHOLDER = "https://placehold.co/60x60/eaeded/565959?text=?";

interface OrderSummaryProps {
  cart: Cart;
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const getImageSrc = (itemId: string, originalUrl: string | undefined) => {
    if (failedImages.has(itemId)) return PLACEHOLDER;
    return originalUrl ?? PLACEHOLDER;
  };

  const handleImageError = (itemId: string) => {
    setFailedImages((prev) => new Set([...prev, itemId]));
  };

  return (
    <aside className="bg-white border border-[#D5D9D9] rounded-sm p-5 space-y-4 sticky top-4">
      <h2 className="text-[20px] font-normal text-[#0F1111]">Order Summary</h2>

      {/* Items */}
      <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0 bg-white rounded-sm border border-[#D5D9D9]">
              <Image
                src={getImageSrc(item.id, item.product.images[0]?.url)}
                alt={item.product.title}
                fill
                sizes="48px"
                className="object-contain p-0.5"
                onError={() => handleImageError(item.id)}
              />
              {/* Quantity badge */}
              <span className="absolute -top-1.5 -right-1.5 bg-[#232F3E] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#0F1111] leading-snug line-clamp-2">{item.product.title}</p>
            </div>
            <p className="text-[13px] font-semibold text-[#0F1111] shrink-0">
              {formatPrice(Number(item.product.price) * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <hr className="border-[#D5D9D9]" />

      {/* Totals */}
      <div className="space-y-2 text-[14px]">
        <div className="flex justify-between text-[#0F1111]">
          <span>Items ({itemCount})</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
        <div className="flex justify-between text-[#067D62]">
          <span>Delivery</span>
          <span className="font-medium">FREE</span>
        </div>
        <hr className="border-[#D5D9D9]" />
        <div className="flex justify-between font-bold text-[18px] text-[#0F1111]">
          <span>Order Total</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
      </div>

      <p className="text-[12px] text-[#565959]">
        By placing your order, you agree to Amazon&apos;s privacy notice and conditions of use.
      </p>
    </aside>
  );
}
