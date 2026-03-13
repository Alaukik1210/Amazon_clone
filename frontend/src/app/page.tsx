"use client";

import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { ProductRow } from "@/components/home/ProductRow";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-(--amazon-bg-page)">
      <Navbar />

      <main className="flex-1">
        <HeroBanner />

        <div className="-mt-35 relative z-20 pb-10 space-y-5">
          <CategoryGrid offset={0} />

          <ProductRow
            title="Up to 75% off | Curated for your wishlist"
            subtitle="Handpicked deals refreshed daily based on your interests"
            viewAllLabel="See all offers"
            filters={{ sortBy: "newest", limit: 18 }}
            viewAllHref="/products?sortBy=newest"
          />

          <ProductRow
            title="Best sellers in Electronics"
            subtitle="Top-rated gadgets and accessories customers are buying now"
            viewAllLabel="See all"
            filters={{ sortBy: "rating", limit: 18 }}
            viewAllHref="/products?sortBy=rating"
          />

          <ProductRow
            title="Inspired by your browsing history"
            subtitle="Recommended picks based on products you viewed recently"
            viewAllLabel="See all"
            filters={{ sortBy: "price_desc", limit: 18 }}
            viewAllHref="/products?sortBy=price_desc"
          />

          <CategoryGrid offset={4} />

          <ProductRow
            title="Top picks in Fashion"
            subtitle="Trending styles curated for everyday wear"
            viewAllLabel="See all"
            filters={{ sortBy: "newest", limit: 18 }}
            viewAllHref="/products?sortBy=newest"
          />

          <ProductRow
            title="Recommended products for home"
            subtitle="Practical essentials to elevate your living space"
            viewAllLabel="See all"
            filters={{ sortBy: "price_asc", limit: 18 }}
            viewAllHref="/products?sortBy=price_asc"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
