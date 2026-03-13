"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  disabled = false,
}: QuantitySelectorProps) {
  return (
    <div className="h-8 inline-flex items-center rounded-full border border-[#D5D9D9] bg-[#F0F2F2] overflow-hidden">
      <button
        type="button"
        aria-label="Remove item"
        onClick={onRemove}
        disabled={disabled}
        className="w-8 h-8 inline-flex items-center justify-center text-[#0F1111] hover:bg-[#E7E9EC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Trash2 size={14} />
      </button>

      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrement}
        disabled={disabled}
        className="w-8 h-8 inline-flex items-center justify-center text-[#0F1111] hover:bg-[#E7E9EC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus size={14} />
      </button>

      <span className="min-w-8 px-1 text-center text-[13px] font-semibold text-[#0F1111]">
        {quantity}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrement}
        disabled={disabled}
        className="w-8 h-8 inline-flex items-center justify-center text-[#0F1111] hover:bg-[#E7E9EC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
