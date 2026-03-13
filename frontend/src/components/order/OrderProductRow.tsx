"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderActions } from "./OrderActions";
import type { Order } from "@/types";

const PLACEHOLDER = "https://placehold.co/70x70/eaeded/565959?text=?";

interface OrderProductRowProps {
  order: Order;
}

function statusText(order: Order): { title: string; subtext: string } {
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
  }).format(new Date(order.updatedAt));

  if (order.status === "DELIVERED") {
    return {
      title: `Delivered ${date}`,
      subtext: "Package was handed to resident",
    };
  }
  if (order.status === "SHIPPED") {
    return {
      title: `Shipped ${date}`,
      subtext: "Package is on the way",
    };
  }
  if (order.status === "CANCELLED") {
    return {
      title: "Order cancelled",
      subtext: "This order was cancelled",
    };
  }
  return {
    title: "Preparing for dispatch",
    subtext: "We will update shipment details soon",
  };
}

export function OrderProductRow({ order }: OrderProductRowProps) {
  const firstItem = order.items[0];
  const [imageSrc, setImageSrc] = useState(firstItem?.product.images[0]?.url ?? PLACEHOLDER);
  const { title, subtext } = statusText(order);

  if (!firstItem) return null;

  return (
    <div className="flex gap-4 sm:gap-4">
      <div className="relative w-12.5 h-12.5 sm:w-17.5 sm:h-17.5 shrink-0">
        <Image
          src={imageSrc}
          alt={firstItem.product.title}
          fill
          sizes="(max-width: 640px) 50px, 70px"
          className="object-contain"
          onError={() => setImageSrc(PLACEHOLDER)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#0F1111] mb-0.5">{title}</p>
        <p className="text-[13px] text-[#565959] mb-2">{subtext}</p>
        <Link
          href={`/products/${firstItem.product.slug}`}
          className="text-[14px] text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2"
        >
          {firstItem.product.title}
        </Link>

        <OrderActions
          orderId={order.id}
          productId={firstItem.product.id}
          productSlug={firstItem.product.slug}
        />
      </div>
    </div>
  );
}
