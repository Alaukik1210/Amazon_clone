"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { wishlistService } from "@/services/wishlist.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";

/** Returns wishlist data + toggle mutation (add if absent, remove if present) */
export function useWishlist() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: QUERY_KEYS.WISHLIST,
    queryFn: () => wishlistService.get().then((r) => r.data.data),
    enabled: !!user,
  });

  // Set of product IDs currently in wishlist — O(1) lookup in ProductCard
  const wishedProductIds = new Set(wishlist?.items.map((i) => i.product.id) ?? []);

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      const existing = wishlist?.items.find((i) => i.product.id === productId);
      if (existing) {
        return wishlistService.removeItem(existing.id);
      }
      return wishlistService.addItem(productId);
    },
    onSuccess: (res) => {
      qc.setQueryData(QUERY_KEYS.WISHLIST, res.data.data);
    },
    onError: (err: Error) => {
      if (err.message?.toLowerCase().includes("sign in") || err.message?.toLowerCase().includes("unauthorized")) {
        toast.error("Sign in to save items to your wishlist");
      } else {
        toast.error(err.message ?? "Failed to update wishlist");
      }
    },
  });

  return { wishlist, wishedProductIds, toggle };
}
