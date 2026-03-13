import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;        // 0–5, can be decimal (e.g. 4.3)
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizes = { sm: 12, md: 16, lg: 20 };

export function StarRating({ rating, reviewCount, size = "md", showCount = true, className }: StarRatingProps) {
  const starSize = sizes[size];
  const clipped = Math.min(5, Math.max(0, rating));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" aria-label={`${clipped.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, clipped - (star - 1)));
          return (
            <span key={star} className="relative inline-block" style={{ width: starSize, height: starSize }}>
              {/* Background (empty) star */}
              <Star size={starSize} className="text-gray-300" fill="currentColor" />
              {/* Foreground (filled) star — clipped by fill % */}
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star size={starSize} className="text-[#ff9900]" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-[#007185] text-sm hover:text-[#c45500] cursor-pointer">
          {reviewCount.toLocaleString("en-IN")}
        </span>
      )}
    </div>
  );
}

// Interactive star picker for review forms
interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

export function StarPicker({ value, onChange, size = "md" }: StarPickerProps) {
  const starSize = sizes[size];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={starSize}
            className={star <= value ? "text-[#ff9900]" : "text-gray-300"}
            fill="currentColor"
          />
        </button>
      ))}
    </div>
  );
}
