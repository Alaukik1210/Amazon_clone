"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpBoxProps {
  value: string;            // 6-char string, e.g. "123456" or "12    "
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
}

const LENGTH = 6;

export function OtpBox({ value, onChange, error, disabled }: OtpBoxProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Normalize value to always be LENGTH chars (padded with spaces)
  const chars = value.padEnd(LENGTH, " ").split("").slice(0, LENGTH);

  const focus = (i: number) => refs.current[i]?.focus();

  const update = (index: number, char: string) => {
    const next = [...chars];
    next[index] = char || " ";
    const result = next.join("");
    onChange(result.trimEnd()); // trim trailing spaces for the actual value
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i].trim()) {
        update(i, " ");
      } else if (i > 0) {
        update(i - 1, " ");
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focus(i - 1);
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      focus(i + 1);
    }
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1); // keep last digit only
    if (!digit) return;
    update(i, digit);
    if (i < LENGTH - 1) focus(i + 1);
  };

  // Paste support — paste entire OTP at once
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    onChange(pasted);
    // Focus the next empty box or last box
    const nextFocus = Math.min(pasted.length, LENGTH - 1);
    focus(nextFocus);
  };

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {chars.map((char, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={char.trim()}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`OTP digit ${i + 1}`}
            className={cn(
              "w-10 h-12 text-center text-lg font-semibold rounded border",
              "focus:outline-none focus:ring-2 focus:ring-[var(--amazon-border-focus)]",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              char.trim()
                ? "border-[var(--amazon-border-focus)] bg-white"
                : error
                ? "border-[var(--amazon-error)]"
                : "border-[var(--amazon-border)] bg-white"
            )}
          />
        ))}
      </div>
      {error && (
        <p className="form-error text-center mt-2" role="alert">{error}</p>
      )}
    </div>
  );
}
