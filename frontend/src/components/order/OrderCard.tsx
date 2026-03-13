"use client";

import { OrderHeader } from "./OrderHeader";
import { OrderProductRow } from "./OrderProductRow";
import type { Order } from "@/types";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="bg-white border border-[#D5D9D9] rounded-lg p-4 mb-4">
      <OrderHeader order={order} />
      <div className="pt-4">
        <OrderProductRow order={order} />
      </div>
    </article>
  );
}
