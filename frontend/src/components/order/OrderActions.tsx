"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

interface OrderActionsProps {
  orderId: string;
  productId: string;
  productSlug: string;
}

function ActionButton({
  children,
  onClick,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary
        ? "h-8 px-4 rounded-[20px] text-[13px] border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] cursor-pointer"
        : "h-8 px-4 rounded-[20px] text-[13px] border border-[#D5D9D9] bg-[#F7F7F7] hover:bg-[#EFEFEF] text-[#0F1111] cursor-pointer"
      }
    >
      {children}
    </button>
  );
}

export function OrderActions({ orderId, productId, productSlug }: OrderActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <ActionButton primary onClick={() => router.push(`/orders/${orderId}?tab=tracking`)}>
        Track package
      </ActionButton>
      <ActionButton onClick={() => router.push(`/orders/${orderId}?action=ask-product-question`)}>
        Ask product question
      </ActionButton>
      <ActionButton onClick={() => router.push(`/orders/${orderId}?action=leave-seller-feedback`)}>
        Leave seller feedback
      </ActionButton>
      <ActionButton onClick={() => router.push(`/orders/${orderId}?action=leave-delivery-feedback`)}>
        Leave delivery feedback
      </ActionButton>
      <ActionButton onClick={() => router.push(`/products/${productSlug}#reviews`)}>
        Write a product review
      </ActionButton>
      <ActionButton primary onClick={() => addItem.mutate({ productId, quantity: 1 })}>
        Buy it again
      </ActionButton>
    </div>
  );
}
