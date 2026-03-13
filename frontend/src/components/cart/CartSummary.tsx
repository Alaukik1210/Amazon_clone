"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";

interface CartSummaryProps {
  selectedItemCount: number;
  selectedSubtotal: number;
  containsGift: boolean;
  onContainsGiftChange: (next: boolean) => void;
  onProceedToBuy: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CartSummary({
  selectedItemCount,
  selectedSubtotal,
  containsGift,
  onContainsGiftChange,
  onProceedToBuy,
}: CartSummaryProps) {

  return (
    <aside className="bg-white border border-[#D5D9D9] rounded-sm p-5 sticky top-4">
      <div className="flex items-start gap-1.5 text-[13px] text-[#007600] leading-[1.3]">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        <p>
          Part of your order qualifies for FREE Delivery. Choose FREE Delivery option at checkout.
        </p>
      </div>

      <p className="text-[18px] mt-4 leading-tight text-[#0F1111]">
        Subtotal ({selectedItemCount} items): <strong>{formatCurrency(selectedSubtotal)}</strong>
      </p>

      <label className="mt-2 flex items-center gap-1.5 text-[13px] text-[#0F1111]">
        <input
          type="checkbox"
          checked={containsGift}
          onChange={(e) => onContainsGiftChange(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
        This order contains a gift
      </label>

      <button
        type="button"
        onClick={onProceedToBuy}
        disabled={selectedItemCount === 0}
        className="mt-4 w-full h-9 rounded-[20px] border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-50 disabled:cursor-not-allowed text-[14px] text-[#0F1111] cursor-pointer"
      >
        Proceed to Buy
      </button>

      <p className="text-[13px] text-[#0F1111] mt-3">
        Save <strong>₹18 extra</strong> using coupon.
      </p>

      <button
        type="button"
        className="mt-4 w-full h-11 border border-[#D5D9D9] rounded-lg px-4 flex items-center justify-between text-[13px] text-[#0F1111] cursor-pointer"
      >
        <span>EMI Available</span>
        <ChevronDown size={18} />
      </button>
    </aside>
  );
}
