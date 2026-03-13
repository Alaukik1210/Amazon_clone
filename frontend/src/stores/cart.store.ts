import { create } from "zustand";

interface CartState {
  count: number;
  setCount: (count: number) => void;
}

// Lightweight store for cart badge count — full cart data lives in React Query cache
export const useCartStore = create<CartState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
