"use client";

import { useRef, useCallback } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, value, onChange }: PriceRangeSliderProps) {
  const [minVal, maxVal] = value;
  const rangeRef = useRef<HTMLDivElement>(null);

  const minPercent = Math.round(((minVal - min) / (max - min)) * 100);
  const maxPercent = Math.round(((maxVal - min) / (max - min)) * 100);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.min(Number(e.target.value), maxVal - 1);
      onChange([v, maxVal]);
    },
    [maxVal, onChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(Number(e.target.value), minVal + 1);
      onChange([minVal, v]);
    },
    [minVal, onChange]
  );

  return (
    <div className="w-full px-1">
      {/* Price label */}
      <p className="text-[13px] font-semibold text-[var(--amazon-text-primary)] mb-3">
        ₹{minVal.toLocaleString("en-IN")} – ₹{maxVal.toLocaleString("en-IN")}
        {maxVal >= max ? "+" : ""}
      </p>

      {/* Slider track */}
      <div ref={rangeRef} className="relative h-4 w-full mb-1">
        {/* Full track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] bg-gray-300 rounded-full" />

        {/* Active fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-[#007185] rounded-full pointer-events-none"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />

        {/* Min thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#007185] shadow-sm pointer-events-none z-20"
          style={{ left: `${minPercent}%` }}
        />

        {/* Max thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#007185] shadow-sm pointer-events-none z-20"
          style={{ left: `${maxPercent}%` }}
        />

        {/* Min input — invisible but interactive */}
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-30"
          style={{ pointerEvents: minVal > max - (max - min) * 0.1 ? "none" : "auto" }}
          aria-label="Minimum price"
        />

        {/* Max input — invisible but interactive */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-30"
          style={{ pointerEvents: maxVal <= min + (max - min) * 0.1 ? "none" : "auto" }}
          aria-label="Maximum price"
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-[11px] text-[var(--amazon-text-muted)] mt-1">
        <span>₹{min.toLocaleString("en-IN")}</span>
        <span>₹{max.toLocaleString("en-IN")}+</span>
      </div>
    </div>
  );
}
