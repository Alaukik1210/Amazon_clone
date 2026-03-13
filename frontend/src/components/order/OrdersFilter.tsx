"use client";

interface OrdersFilterProps {
  count: number;
  period: string;
  onPeriodChange: (period: string) => void;
}

const PERIOD_OPTIONS = [
  { value: "3m", label: "past 3 months" },
  { value: "30d", label: "past 30 days" },
  { value: "6m", label: "past 6 months" },
  { value: "all", label: "all time" },
];

export function OrdersFilter({ count, period, onPeriodChange }: OrdersFilterProps) {
  const selectedLabel = PERIOD_OPTIONS.find((opt) => opt.value === period)?.label ?? "past 3 months";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <p className="text-[13px] text-[#0F1111]">
        <span className="font-semibold">{count}</span> orders placed in <span className="lowercase">{selectedLabel}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#565959]">Filter by:</span>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="h-8 text-[13px] border border-[#D5D9D9] rounded-lg px-2 bg-white cursor-pointer focus:outline-none focus:border-[#007185]"
          aria-label="Filter orders by period"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
