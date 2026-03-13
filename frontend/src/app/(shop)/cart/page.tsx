"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { SavedForLater, type SavedForLaterItem } from "@/components/cart/SavedForLater";
import { RecommendationCard } from "@/components/cart/RecommendationCard";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ShoppingCart } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { CartItem as CartItemType } from "@/types";

function sumSelected(items: CartItemType[], selectedIds: Set<string>) {
  return items.reduce((sum, item) => {
    if (!selectedIds.has(item.id)) return sum;
    return sum + Number(item.product.price) * item.quantity;
  }, 0);
}

function countSelected(items: CartItemType[], selectedIds: Set<string>) {
  return items.reduce((sum, item) => {
    if (!selectedIds.has(item.id)) return sum;
    return sum + item.quantity;
  }, 0);
}

function CartContent() {
  const router = useRouter();
  const { cart, isLoading, addItem, updateItem, removeItem } = useCart();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSelectionInit, setHasSelectionInit] = useState(false);
  const [giftItemIds, setGiftItemIds] = useState<Set<string>>(new Set());
  const [containsGift, setContainsGift] = useState(false);
  const [savedForLaterItems, setSavedForLaterItems] = useState<SavedForLaterItem[]>([]);

  const effectiveSelectedIds = hasSelectionInit
    ? selectedIds
    : new Set((cart?.items ?? []).map((item) => item.id));

  const buyAgainSource = savedForLaterItems[0] ?? cart?.items[0];
  const buyAgainCandidate = buyAgainSource
    ? {
        id: buyAgainSource.product.id,
        slug: buyAgainSource.product.slug,
        title: buyAgainSource.product.title,
        price: buyAgainSource.product.price,
        imageUrl: buyAgainSource.product.images[0]?.url,
      }
    : null;

  if (isLoading) {
    return (
      <div className="max-w-375 mx-auto px-5 py-6 space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded" />)}
      </div>
    );
  }

  const isEmpty = !cart?.items.length;
  const selectedSubtotal = sumSelected(cart?.items ?? [], effectiveSelectedIds);
  const selectedItemCount = countSelected(cart?.items ?? [], effectiveSelectedIds);

  const handleToggleChecked = (itemId: string, checked: boolean) => {
    setHasSelectionInit(true);
    setSelectedIds((prev) => {
      const next = new Set(hasSelectionInit ? prev : (cart?.items ?? []).map((item) => item.id));
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const handleToggleGift = (itemId: string, checked: boolean) => {
    setGiftItemIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      setContainsGift(next.size > 0);
      return next;
    });
  };

  const handleIncrease = (item: CartItemType) => {
    updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 });
  };

  const handleDecrease = (item: CartItemType) => {
    if (item.quantity <= 1) {
      removeItem.mutate(item.id);
      return;
    }
    updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 });
  };

  const handleDelete = (item: CartItemType) => {
    removeItem.mutate(item.id);
    if (hasSelectionInit) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
    setGiftItemIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      setContainsGift(next.size > 0);
      return next;
    });
  };

  const handleSaveForLater = (item: CartItemType) => {
    setSavedForLaterItems((prev) => {
      if (prev.some((saved) => saved.id === item.id)) return prev;
      return [...prev, item];
    });
    handleDelete(item);
  };

  const handleMoveSavedToCart = (item: SavedForLaterItem) => {
    addItem.mutate({ productId: item.product.id, quantity: item.quantity });
    setSavedForLaterItems((prev) => prev.filter((saved) => saved.id !== item.id));
  };

  const handleRemoveSaved = (itemId: string) => {
    setSavedForLaterItems((prev) => prev.filter((saved) => saved.id !== itemId));
  };

  const handleProceedToBuy = () => {
    if (selectedItemCount === 0) return;
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <div className="bg-[#EAEDED] min-h-screen py-6">
      <div className="max-w-375 mx-auto px-5">
        {isEmpty ? (
          <div className="bg-white border border-[#D5D9D9] rounded-sm p-8">
            <EmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              description="Looks like you haven't added anything yet."
              action={{ label: "Shop now", onClick: () => router.push(ROUTES.PRODUCTS) }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-5 items-start">
            <section className="bg-white border border-[#D5D9D9] rounded-sm p-4 md:p-5">
              <h1 className="text-[28px] font-normal text-[#0F1111] leading-none">Shopping Cart</h1>
              <button
                type="button"
                onClick={() => {
                  setHasSelectionInit(true);
                  setSelectedIds(new Set());
                }}
                className="mt-2 text-[14px] text-[#007185] hover:text-[#C7511F] cursor-pointer"
              >
                Deselect all items
              </button>

              <div className="border-b border-[#DDD] mt-4 pb-1 text-right text-[13px] text-[#565959]">Price</div>

              <div>
                {cart!.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    checked={effectiveSelectedIds.has(item.id)}
                    giftChecked={giftItemIds.has(item.id)}
                    onToggleChecked={handleToggleChecked}
                    onToggleGift={handleToggleGift}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    onDelete={handleDelete}
                    onSaveForLater={handleSaveForLater}
                    isBusy={updateItem.isPending || removeItem.isPending}
                  />
                ))}
              </div>

              <p className="text-right text-[18px] mt-3 text-[#0F1111]">
                Subtotal ({selectedItemCount} items): <strong>
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(selectedSubtotal)}
                </strong>
              </p>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-4">
              <CartSummary
                selectedItemCount={selectedItemCount}
                selectedSubtotal={selectedSubtotal}
                containsGift={containsGift}
                onContainsGiftChange={setContainsGift}
                onProceedToBuy={handleProceedToBuy}
              />

              <section className="bg-[#0073E6] text-white p-5 rounded-sm">
                <p className="text-[34px] font-semibold leading-[1.3]">Enjoy faster deliveries, offers and so much more!</p>
                <p className="text-[34px] mt-1 leading-[1.3]">
                  Join Prime now for FREE deliveries, cancel anytime!
                </p>
                <button
                  type="button"
                  className="mt-4 h-14 w-full rounded-full border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-[14px] cursor-pointer"
                >
                  Join Prime Shopping Edition at ₹399/year
                </button>
              </section>

              {buyAgainCandidate && (
                <section className="bg-white border border-[#D5D9D9] rounded-lg p-4">
                  <h2 className="text-[32px] font-semibold text-[#0F1111] mb-3">Buy it again</h2>
                  <RecommendationCard
                    product={buyAgainCandidate}
                    onAddToCart={() => addItem.mutate({ productId: buyAgainCandidate.id, quantity: 1 })}
                  />
                </section>
              )}
            </aside>

            <div className="xl:col-span-1">
              <SavedForLater
                items={savedForLaterItems}
                onMoveToCart={handleMoveSavedToCart}
                onDelete={handleRemoveSaved}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}
