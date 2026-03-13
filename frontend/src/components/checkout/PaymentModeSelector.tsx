import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";
import type { PaymentMode } from "@/types";

interface PaymentOption {
  value: PaymentMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const OPTIONS: PaymentOption[] = [
  {
    value:       "COD",
    label:       "Cash on Delivery",
    description: "Pay when your order arrives",
    icon:        <Truck size={20} className="text-[var(--amazon-success)]" />,
  },
];

interface PaymentModeSelectorProps {
  value:    PaymentMode | null;
  onChange: (mode: PaymentMode) => void;
}

export function PaymentModeSelector({ value, onChange }: PaymentModeSelectorProps) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "w-full text-left rounded-sm border p-4 transition-colors flex items-start gap-3",
            value === opt.value
              ? "border-[#E77600] bg-[#FFF8F0]"
              : "border-[#D5D9D9] hover:border-[#A2A6AC]"
          )}
        >
          {/* Radio */}
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5",
            value === opt.value ? "border-[#E77600]" : "border-[#888C8C]"
          )}>
            {value === opt.value && (
              <div className="w-2 h-2 rounded-full bg-[#E77600]" />
            )}
          </div>

          {opt.icon}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[14px] text-[#0F1111]">{opt.label}</span>
              {opt.badge && (
                <span className="text-[11px] bg-[#067D62] text-white px-1.5 py-0.5 rounded font-medium">
                  {opt.badge}
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#565959] mt-0.5">{opt.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
