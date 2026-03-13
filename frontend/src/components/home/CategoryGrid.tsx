"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { QUERY_KEYS } from "@/lib/constants";
import type { Category } from "@/types";

type CategoryGridProps = {
  offset?: number;
};

type Tile = {
  title: string;
  image: string;
  href: string;
};

type CategoryCard = {
  title: string;
  href: string;
  tiles: Tile[];
};

function CategoryGridSkeleton() {
  return (
    <section className="w-full max-w-375 mx-auto px-3 md:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="bg-white border border-[#e7e7e7] p-4 min-h-105 animate-pulse">
            <div className="h-6 w-3/4 bg-[#ececec] rounded mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j}>
                  <div className="h-30 w-full bg-[#efefef]" />
                  <div className="h-3 w-4/5 bg-[#ececec] rounded mt-1" />
                </div>
              ))}
            </div>
            <div className="h-4 w-16 bg-[#ececec] rounded mt-4" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function CategoryGrid({ offset = 0 }: CategoryGridProps) {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => categoryService.getAll().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS({ limit: 48, sortBy: "newest" }),
    queryFn: () => productService.getAll({ limit: 48, sortBy: "newest" }).then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const cards = useMemo<CategoryCard[]>(() => {
    const categoryList = categories ?? [];
    const products = productData?.products ?? [];

    const list = categoryList
      .map((cat: Category) => {
        const categoryProducts = products
          .filter((p) => p.category?.id === cat.id && p.images?.[0]?.url)
          .slice(0, 4);

        if (categoryProducts.length < 4) return null;

        return {
          title: cat.name,
          href: `/products?category=${cat.slug}`,
          tiles: categoryProducts.map((p) => ({
            title: p.title,
            image: p.images[0].url,
            href: `/products/${p.slug}`,
          })),
        };
      })
      .filter((item: CategoryCard | null): item is CategoryCard => Boolean(item));

    return list.slice(offset, offset + 4);
  }, [categories, productData?.products, offset]);

  if (categoriesLoading || productsLoading) return <CategoryGridSkeleton />;
  if (cards.length === 0) return null;

  return (
    <section className="w-full max-w-375 mx-auto px-3 md:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <article key={card.title} className="bg-white border border-[#e7e7e7] p-4 min-h-105">
            <h3 className="text-[21px] leading-6 font-semibold text-[#0F1111] mb-4 line-clamp-2">{card.title}</h3>
            <div className="grid grid-cols-2 gap-3">
              {card.tiles.map((tile) => (
                <Link key={tile.href} href={tile.href} className="block">
                  <div className="relative h-30 w-full bg-[#f7f7f7]">
                    <Image
                      src={tile.image}
                      alt={tile.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <p className="text-xs text-[#0F1111] mt-1 line-clamp-2">{tile.title}</p>
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link href={card.href} className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline">
                See more
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
