"use client";

import { useEffect, useCallback } from "react";

const KEY = "recently_viewed";
const MAX  = 10;

export function useRecentlyViewed(currentProductId?: string) {
  // Record current product visit
  useEffect(() => {
    if (!currentProductId) return;
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const filtered = stored.filter((id) => id !== currentProductId);
      const updated  = [currentProductId, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [currentProductId]);

  const getIds = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch { return []; }
  }, []);

  return { getIds };
}
