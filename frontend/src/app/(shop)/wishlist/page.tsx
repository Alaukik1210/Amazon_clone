"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { wishlistService } from "@/services/wishlist.service";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import type { Wishlist } from "@/types";

const PLACEHOLDER = "https://placehold.co/200x200/eaeded/565959?text=No+Image";

function WishlistContent() {
  const qc = useQueryClient();

  const { data: wishlist, isLoading } = useQuery<Wishlist>({
    queryKey: QUERY_KEYS.WISHLIST,
    queryFn:  () => wishlistService.get().then((r) => r.data.data),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => wishlistService.removeItem(itemId),
    onSuccess:  (res) => {
      qc.setQueryData(QUERY_KEYS.WISHLIST, res.data.data);
      toast.success("Removed from wishlist");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const moveToCart = useMutation({
    mutationFn: (itemId: string) => wishlistService.moveToCart(itemId),
    onSuccess:  (res) => {
      qc.setQueryData(QUERY_KEYS.WISHLIST, res.data.data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CART });
      toast.success("Moved to cart");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded" />)}
      </div>
    );
  }

  const isEmpty = !wishlist?.items.length;

  return (
    <>
      {isEmpty ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love to your wishlist for easy access later."
          action={{ label: "Discover products", onClick: () => window.location.href = ROUTES.PRODUCTS }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist!.items.map((item) => {
            const { product } = item;
            const isOOS = product.status === "OUT_OF_STOCK" || product.stock === 0;
            const imageUrl = product.images[0]?.url ?? PLACEHOLDER;

            return (
              <div key={item.id} className="amazon-card flex flex-col overflow-hidden">
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="block p-3 bg-white">
                  <div className="relative h-40 w-full">
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      fill
                      sizes="200px"
                      className="object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <Link href={`/products/${product.slug}`} className="amazon-link text-sm font-medium leading-snug line-clamp-2 mb-1">
                    {product.title}
                  </Link>
                  <p className="font-semibold">{formatPrice(product.price)}</p>

                  {isOOS
                    ? <Badge variant="danger" className="mt-1 w-fit text-xs">Out of stock</Badge>
                    : product.stock <= 5
                    ? <p className="text-xs text-[var(--amazon-warning)] mt-1">Only {product.stock} left</p>
                    : null
                  }

                  {/* Actions */}
                  <div className="mt-auto pt-3 space-y-2">
                    <Button
                      fullWidth
                      size="sm"
                      disabled={isOOS || moveToCart.isPending}
                      loading={moveToCart.isPending}
                      onClick={() => moveToCart.mutate(item.id)}
                      className="btn-amazon !rounded"
                    >
                      <ShoppingCart size={13} /> Move to Cart
                    </Button>
                    <Button
                      fullWidth
                      variant="ghost"
                      size="sm"
                      loading={removeItem.isPending}
                      onClick={() => removeItem.mutate(item.id)}
                      className="text-[var(--amazon-error)] text-xs"
                    >
                      <Trash2 size={13} /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">Your Wishlist</h1>
        <WishlistContent />
      </div>
    </ProtectedRoute>
  );
}
