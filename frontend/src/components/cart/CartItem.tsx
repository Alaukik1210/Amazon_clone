"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { QuantitySelector } from "@/components/cart/QuantitySelector";
import { CartActions } from "@/components/cart/CartActions";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
  checked: boolean;
  giftChecked: boolean;
  onToggleChecked: (itemId: string, checked: boolean) => void;
  onToggleGift: (itemId: string, checked: boolean) => void;
  onIncrease: (item: CartItemType) => void;
  onDecrease: (item: CartItemType) => void;
  onDelete: (item: CartItemType) => void;
  onSaveForLater: (item: CartItemType) => void;
  isBusy?: boolean;
}

const PLACEHOLDER = "https://placehold.co/100x100/eaeded/565959?text=?";

export function CartItem({
  item,
  checked,
  giftChecked,
  onToggleChecked,
  onToggleGift,
  onIncrease,
  onDecrease,
  onDelete,
  onSaveForLater,
  isBusy = false,
}: CartItemProps) {
  const [imageSrc, setImageSrc] = useState(item.product.images[0]?.url ?? PLACEHOLDER);

  return (
    <article className={cn("border-b border-[#DDD] py-5", isBusy && "opacity-70")}> 
      <div className="grid grid-cols-1 md:grid-cols-[40px_120px_minmax(0,1fr)_120px] gap-4 md:gap-5 items-start">
        <div className="hidden md:flex pt-2 justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggleChecked(item.id, e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-[#007185]"
            aria-label="Select item"
          />
        </div>

        <div className="grid grid-cols-[28px_100px] md:grid-cols-1 items-start gap-3 md:gap-0">
          <div className="md:hidden pt-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onToggleChecked(item.id, e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#007185]"
              aria-label="Select item"
            />
          </div>

          <div className="relative w-25 h-25 justify-self-start bg-white">
            <Image
              src={imageSrc}
              alt={item.product.title}
              fill
              loading="lazy"
              sizes="100px"
              className="object-contain"
              onError={() => setImageSrc(PLACEHOLDER)}
            />
          </div>
        </div>

        <div className="min-w-0">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-[18px] font-normal text-[#0F1111] leading-[1.3] hover:text-[#C7511F] line-clamp-2"
          >
            {item.product.title}
          </Link>

          <p className="text-[13px] text-[#007600] mt-1">In stock</p>

          <p className="text-[13px] text-[#0F1111] mt-0.5">
            FREE delivery Sun, 15 Mar available at checkout
          </p>

          <div className="mt-1 inline-flex items-center h-4 px-1.5 rounded-sm bg-[#232F3E] text-white text-[11px] font-semibold leading-none">
            a fulfilled
          </div>

          <label className="flex items-center gap-1.5 mt-2 text-[13px] text-[#0F1111]">
            <input
              type="checkbox"
              checked={giftChecked}
              onChange={(e) => onToggleGift(item.id, e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            This will be a gift
            <span className="text-[#007185] cursor-pointer hover:underline">Learn more</span>
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <QuantitySelector
              quantity={item.quantity}
              onIncrement={() => onIncrease(item)}
              onDecrement={() => onDecrease(item)}
              onRemove={() => onDelete(item)}
              disabled={isBusy}
            />
          </div>

          <CartActions
            onDelete={() => onDelete(item)}
            onSaveForLater={() => onSaveForLater(item)}
          />
        </div>

        <div className="text-left md:text-right">
          <p className="text-[18px] font-medium text-[#0F1111] leading-none">
            {formatPrice(Number(item.product.price) * item.quantity)}
          </p>
        </div>
      </div>
    </article>
  );
}
