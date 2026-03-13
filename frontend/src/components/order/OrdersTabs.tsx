"use client";

import { cn } from "@/lib/utils";

export type OrdersTabKey = "orders" | "buy-again" | "not-yet-shipped";

interface OrdersTabsProps {
  activeTab: OrdersTabKey;
  onChange: (tab: OrdersTabKey) => void;
}

const TABS: Array<{ key: OrdersTabKey; label: string }> = [
  { key: "orders", label: "Orders" },
  { key: "buy-again", label: "Buy Again" },
  { key: "not-yet-shipped", label: "Not Yet Shipped" },
];

export function OrdersTabs({ activeTab, onChange }: OrdersTabsProps) {
  return (
    <div className="border-b border-[#D5D9D9] mb-5">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "text-[14px] font-medium py-2.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab.key
                ? "border-[#FF9900] text-[#0F1111]"
                : "border-transparent text-[#0F1111] hover:text-[#C7511F]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
