import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded bg-gray-200", className)} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative w-full h-142 bg-white rounded-sm border border-[#e7e7e7] px-3 pt-3 pb-1.5 flex flex-col">
      <Skeleton className="h-63 w-full mb-2.5" />

      <div className="space-y-2.5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      <div className="mt-auto pt-3">
        <Skeleton className="h-9 w-full rounded-[20px]" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-48" />
      <div className="flex gap-3">
        <Skeleton className="h-16 w-16 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}
