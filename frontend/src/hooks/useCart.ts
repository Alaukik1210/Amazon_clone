"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { cartService } from "@/services/cart.service";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";
import type { Cart } from "@/types";

function syncCount(cart: Cart, setCount: (n: number) => void) {
  setCount(cart.items.reduce((sum, i) => sum + i.quantity, 0));
}

/** Full cart hook — query + add / update / remove / clear mutations */
export function useCart() {
  const { user } = useAuthStore();
  const { setCount } = useCartStore();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: QUERY_KEYS.CART,
    queryFn:  () => cartService.get().then((r) => r.data.data),
    enabled:  !!user,
  });

  // Keep navbar badge in sync
  useEffect(() => {
    if (cart)      syncCount(cart, setCount);
    else if (!user) setCount(0);
  }, [cart, user, setCount]);

  /** Update a mutation and refresh cache + badge */
  const handleSuccess = (updated: Cart) => {
    qc.setQueryData(QUERY_KEYS.CART, updated);
    syncCount(updated, setCount);
  };

  const addItem = useMutation({
    mutationFn: (vars: { productId: string; quantity?: number }) =>
      cartService.addItem({ productId: vars.productId, quantity: vars.quantity ?? 1 }),
    
    // --- OPTIMISTIC UPDATE ---
    onMutate: async (vars) => {
      // 1. Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: QUERY_KEYS.CART });
      
      // 2. Snapshot the current cart
      const prevCart = qc.getQueryData<Cart>(QUERY_KEYS.CART);
      
      // 3. Optimistically update count (instant feedback)
      setCount((prevCart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0) + (vars.quantity ?? 1));
      
      return { prevCart };
    },

    onSuccess: (res) => { 
      handleSuccess(res.data.data); 
      toast.success("Added to cart"); 
    },

    onError: (err: Error, _vars, context) => {
      // Rollback on error
      if (context?.prevCart) {
        qc.setQueryData(QUERY_KEYS.CART, context.prevCart);
        syncCount(context.prevCart, setCount);
      }
      toast.error(err.message ?? "Failed to add to cart");
    },

    onSettled: () => {
      // Always refetch to stay in sync with server
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CART });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: (res) => handleSuccess(res.data.data),
    onError:   (err: Error) => toast.error(err.message ?? "Failed to update quantity"),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: (res) => { handleSuccess(res.data.data); toast.success("Item removed"); },
    onError:   (err: Error) => toast.error(err.message ?? "Failed to remove item"),
  });

  const clearCart = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (res) => { handleSuccess(res.data.data); toast.success("Cart cleared"); },
    onError:   (err: Error) => toast.error(err.message ?? "Failed to clear cart"),
  });

  return { cart, isLoading, addItem, updateItem, removeItem, clearCart };
}
