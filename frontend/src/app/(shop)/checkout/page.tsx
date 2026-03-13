"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { orderService } from "@/services/order.service";
import { cartService } from "@/services/cart.service";
import { useCart } from "@/hooks/useCart";
import { useBuyNowStore } from "@/stores/buyNow.store";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { EmptyState } from "@/components/shared/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { PaymentModeSelector } from "@/components/checkout/PaymentModeSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ShoppingCart, Lock, ChevronRight } from "lucide-react";
import type { PaymentMode, Cart } from "@/types";

const PLACEHOLDER = "https://placehold.co/64x64/eaeded/565959?text=?";

function CheckoutContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const qc            = useQueryClient();
  const { cart, isLoading } = useCart();
  const buyNow        = useBuyNowStore();

  const isBuyNow = searchParams.get("mode") === "buynow" && !!buyNow.item;

  const [addressId,   setAddressId]   = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [error,       setError]       = useState("");
  const [preparing,   setPreparing]   = useState(isBuyNow); // adding item to cart

  // Buy Now: silently add the item to cart before showing checkout
  useEffect(() => {
    if (!isBuyNow || !buyNow.item) return;
    cartService.addItem({ productId: buyNow.item.productId, quantity: buyNow.item.qty })
      .then(() => {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.CART });
        setPreparing(false);
      })
      .catch(() => {
        // Item may already be in cart — still fine to proceed
        qc.invalidateQueries({ queryKey: QUERY_KEYS.CART });
        setPreparing(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Place order mutation ───────────────────────────────────────────────────
  const placeOrder = useMutation({
    mutationFn: () =>
      orderService.place({ addressId: addressId!, paymentMode: paymentMode! }),

    onSuccess: async (res) => {
      const { order } = res.data.data;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS() });
      buyNow.clear();
      toast.success("Order placed successfully!");
      router.push(ROUTES.ORDER(order.id));
    },

    onError: (err: Error) => {
      setError(
        err.message?.toLowerCase().includes("stock")
          ? "Some items are out of stock. Please update your cart."
          : err.message ?? "Failed to place order"
      );
    },
  });

  if (preparing || isLoading) return <PageSpinner />;

  if (!cart?.items.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add some items before checking out."
        action={{ label: "Shop now", onClick: () => router.push(ROUTES.PRODUCTS) }}
      />
    );
  }

  // In buy-now mode, show only the buy-now item in the summary
  const summaryCart: Cart = isBuyNow && buyNow.item
    ? {
        ...cart,
        items: cart.items.filter((i) => i.product.id === buyNow.item!.productId),
      }
    : cart;

  const isPlacing = placeOrder.isPending;
  const canSubmit = !!addressId && !!paymentMode && !isPlacing;

  return (
    <div className="bg-[#EAEDED] min-h-screen py-6">
      <div className="max-w-375 mx-auto px-5">
        <div className="bg-white border border-[#D5D9D9] rounded-sm px-5 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-[28px] font-normal text-[#0F1111] leading-none">Checkout</h1>
            <ChevronRight size={16} className="text-[#565959]" />
            <p className="text-[14px] text-[#565959] truncate">Secure checkout powered by Amazon standards</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#067D62] text-[13px] shrink-0">
            <Lock size={14} /> SSL secured
          </div>
        </div>

      {/* Buy Now banner */}
      {isBuyNow && buyNow.item && (
        <div className="flex items-center gap-3 bg-[#FFFBF0] border border-[#FEBD69] rounded-sm p-3 mb-5">
          <Image
            src={buyNow.item.imageUrl || PLACEHOLDER}
            alt={buyNow.item.title}
            width={48} height={48}
            className="object-contain rounded-sm border border-gray-200 bg-white"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#565959]">Buying now</p>
            <p className="text-[14px] text-[#0F1111] font-medium truncate">{buyNow.item.title}</p>
            <p className="text-[14px] font-bold text-[#0F1111]">{formatPrice(buyNow.item.price)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-5 items-start">
        {/* Left — address + payment */}
        <div className="flex-1 space-y-6">
          {error && <Alert variant="error" message={error} />}

          <section className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-5 py-3">
              <h2 className="text-[18px] font-normal text-[#0F1111] flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E77600] text-white text-[12px] font-bold">1</span>
                Select a delivery address
              </h2>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[#565959] mb-4">Choose where to deliver your order</p>
              <AddressSelector selectedId={addressId} onSelect={setAddressId} />
            </div>
          </section>

          <section className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-5 py-3">
              <h2 className="text-[18px] font-normal text-[#0F1111] flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E77600] text-white text-[12px] font-bold">2</span>
                Select a payment method
              </h2>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[#565959] mb-4">All transactions are secured and encrypted</p>
              <PaymentModeSelector value={paymentMode} onChange={setPaymentMode} />
            </div>
          </section>

          <section className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
            <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-5 py-3">
              <h2 className="text-[18px] font-normal text-[#0F1111] flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E77600] text-white text-[12px] font-bold">3</span>
                Review items and place order
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <Button
                fullWidth
                loading={isPlacing}
                disabled={!canSubmit}
                onClick={() => { setError(""); placeOrder.mutate(); }}
                className="h-10 !rounded-full bg-[#FFD814] border border-[#FCD200] hover:bg-[#F7CA00] text-[#0F1111] text-[14px]"
              >
                <Lock size={16} />
                Place your order
              </Button>

              {!addressId && (
                <p className="text-[12px] text-[#565959] text-center">
                  Select a delivery address to continue
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right — order summary */}
        <div className="w-full xl:w-auto">
          <OrderSummary cart={summaryCart} />
        </div>
      </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageSpinner />}>
        <CheckoutContent />
      </Suspense>
    </ProtectedRoute>
  );
}


