"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { QUERY_KEYS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { OrderCard } from "@/components/order/OrderCard";
import { OrdersTabs, type OrdersTabKey } from "@/components/order/OrdersTabs";
import { OrdersFilter } from "@/components/order/OrdersFilter";
import { BuyAgainSidebar } from "@/components/order/BuyAgainSidebar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package } from "lucide-react";
import type { OrderListResponse } from "@/types";

function withinPeriod(date: string, period: string): boolean {
  if (period === "all") return true;
  const now = Date.now();
  const created = new Date(date).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (period === "30d") return now - created <= 30 * day;
  if (period === "6m") return now - created <= 180 * day;
  return now - created <= 90 * day;
}

export function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrdersTabKey>("orders");
  const [period, setPeriod] = useState("3m");
  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = useQuery<OrderListResponse>({
    queryKey: QUERY_KEYS.ORDERS({ page: 1, limit: 50 }),
    queryFn: () => orderService.getAll({ page: 1, limit: 50 }).then((r) => r.data.data),
  });

  const filteredOrders = useMemo(() => {
    const orders = data?.orders ?? [];
    return orders
      .filter((order) => withinPeriod(order.createdAt, period))
      .filter((order) => {
        if (!searchText.trim()) return true;
        const q = searchText.toLowerCase();
        const productTitleHit = order.items.some((item) => item.product.title.toLowerCase().includes(q));
        const idHit = order.id.toLowerCase().includes(q);
        return productTitleHit || idHit;
      })
      .filter((order) => {
        if (activeTab === "orders") return true;
        if (activeTab === "not-yet-shipped") return order.status === "PENDING" || order.status === "PROCESSING";
        return order.status === "DELIVERED" || order.status === "SHIPPED";
      });
  }, [data?.orders, period, searchText, activeTab]);

  const buyAgainProducts = useMemo(() => {
    const unique = new Map<string, { id: string; title: string; slug: string; price: string; imageUrl?: string }>();
    for (const order of data?.orders ?? []) {
      for (const item of order.items) {
        if (!unique.has(item.product.id)) {
          unique.set(item.product.id, {
            id: item.product.id,
            title: item.product.title,
            slug: item.product.slug,
            price: item.price,
            imageUrl: item.product.images[0]?.url,
          });
        }
      }
    }
    return Array.from(unique.values()).slice(0, 5);
  }, [data?.orders]);

  const onSearch = () => setSearchText(query.trim());

  return (
    <div className="bg-[#EAEDED] min-h-screen py-6">
      <div className="max-w-275 mx-auto px-4">
        <div className="mb-2.5 text-[12px] text-[#565959]">
          <Link href="/account" className="hover:text-[#C7511F]">Your Account</Link>
          <span className="mx-1">&gt;</span>
          <span>Your Orders</span>
        </div>

        <div className="bg-white p-4 sm:p-5 border border-[#D5D9D9] rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <h1 className="text-[28px] font-medium text-[#0F1111] leading-tight">Your Orders</h1>

            <div className="w-full md:w-105 flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                placeholder="Search all orders"
                className="h-9 flex-1 border border-[#D5D9D9] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#007185]"
              />
              <button
                type="button"
                onClick={onSearch}
                className="h-9 px-4 rounded-lg bg-[#303333] text-white text-[13px] hover:bg-[#1f2121] cursor-pointer"
              >
                Search Orders
              </button>
            </div>
          </div>

          <OrdersTabs activeTab={activeTab} onChange={setActiveTab} />
          <OrdersFilter count={filteredOrders.length} period={period} onPeriodChange={setPeriod} />

          <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5">
            <div>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-lg" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No orders found"
                  description="Try a different search term or period filter."
                />
              ) : (
                <div>
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <BuyAgainSidebar products={buyAgainProducts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
