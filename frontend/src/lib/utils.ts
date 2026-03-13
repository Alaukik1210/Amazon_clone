import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — handles conflicts (e.g. px-2 + px-4 → px-4) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price from paise/decimal to Indian rupee string */
export function formatPrice(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Format date to readable string */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Truncate text to n characters */
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + "…" : text;
}

/** Robust delivery date calculator — skips Sundays */
export function getDeliveryDate(daysPromise: number): string {
  const date = new Date();
  let added = 0;
  while (added < daysPromise) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) { // skip Sunday
      added++;
    }
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
