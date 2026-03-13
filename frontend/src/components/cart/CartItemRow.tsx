"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/types";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "https://placehold.co/100x100/eaeded/565959?text=No+Image";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateItem, removeItem } = useCart();
  const [imageSrc, setImageSrc] = useState(item.product.images[0]?.url ?? PLACEHOLDER);

  const isOOS       = item.product.status === "OUT_OF_STOCK" || item.product.stock === 0;
  const atMaxStock  = item.quantity >= item.product.stock;
  const lineTotal   = Number(item.product.price) * item.quantity;

  const handleQuantity = (delta: number) => {
    const next = item.quantity + delta;
    if (next <= 0) {
      removeItem.mutate(item.id);
    } else {
      updateItem.mutate({ itemId: item.id, quantity: next });
    }
  };

  const isMutating = updateItem.isPending || removeItem.isPending;

  return (
    <div className={cn("flex gap-4 py-4 border-b border-[var(--amazon-border)]", isMutating && "opacity-60")}>
      {/* Product image */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="relative w-24 h-24 bg-white rounded border border-[var(--amazon-border)]">
          <Image
            src={imageSrc}
            alt={item.product.title}
            fill
            sizes="96px"
            className="object-contain p-1"
            onError={() => setImageSrc(PLACEHOLDER)}
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="amazon-link font-medium text-sm leading-snug line-clamp-2"
        >
          {item.product.title}
        </Link>

        <p className="text-lg font-semibold mt-1">{formatPrice(item.product.price)}</p>

        {isOOS && (
          <p className="text-xs text-[var(--amazon-error)] font-medium mt-1">Currently unavailable</p>
        )}
        {!isOOS && item.product.stock <= 5 && (
          <p className="text-xs text-[var(--amazon-warning)] font-medium mt-1">
            Only {item.product.stock} left
          </p>
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center border border-[var(--amazon-border)] rounded overflow-hidden">
            <button
              onClick={() => handleQuantity(-1)}
              disabled={isMutating}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed text-[var(--amazon-text-primary)]"
            >
              <Minus size={13} />
            </button>
            <span className="w-10 text-center text-sm font-medium border-x border-[var(--amazon-border)] h-8 flex items-center justify-center">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantity(+1)}
              disabled={isMutating || atMaxStock}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed text-[var(--amazon-text-primary)]"
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            onClick={() => removeItem.mutate(item.id)}
            disabled={isMutating}
            className="flex items-center gap-1 text-xs amazon-link text-[var(--amazon-error)] hover:!text-[var(--amazon-error)]"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0">
        <p className="font-semibold">{formatPrice(lineTotal)}</p>
        {item.quantity > 1 && (
          <p className="text-xs text-[var(--amazon-text-muted)]">
            {item.quantity} × {formatPrice(item.product.price)}
          </p>
        )}
      </div>
    </div>
  );
}
