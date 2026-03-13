import { create } from "zustand";

interface BuyNowItem {
  productId: string;
  title: string;
  price: string;
  imageUrl: string;
  qty: number;
}

interface BuyNowState {
  item: BuyNowItem | null;
  set: (item: BuyNowItem) => void;
  clear: () => void;
}

/** Temporary store for Buy Now flow — NOT persisted, cleared after order is placed */
export const useBuyNowStore = create<BuyNowState>((set) => ({
  item: null,
  set:   (item) => set({ item }),
  clear: ()     => set({ item: null }),
}));
