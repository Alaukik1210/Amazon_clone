"use client";

import { SidebarProductCard } from "./SidebarProductCard";

interface SidebarItem {
  id: string;
  title: string;
  slug: string;
  price: string;
  imageUrl?: string;
}

interface BuyAgainSidebarProps {
  products: SidebarItem[];
}

export function BuyAgainSidebar({ products }: BuyAgainSidebarProps) {
  return (
    <aside className="bg-white border border-[#D5D9D9] rounded-lg p-4">
      <h2 className="text-[18px] font-semibold text-[#0F1111] mb-3">Buy it again</h2>

      {products.length === 0 ? (
        <p className="text-[13px] text-[#565959]">No recent products to suggest yet.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <SidebarProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </aside>
  );
}
