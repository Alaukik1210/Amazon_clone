import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/types";

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products,
  isLoading,
  skeletonCount = 20,
  emptyTitle = "No results for your search.",
  emptyDescription = "Try checking your spelling or use more general terms",
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="w-full max-w-[284px] mx-auto">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="bg-white py-16">
        <EmptyState icon={ShoppingBag} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
      {products.map((product) => (
        <div key={product.id} className="w-full max-w-[284px] mx-auto">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
