"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { toast } from "sonner";
import type { Order } from "@/types";

interface OrderHeaderProps {
  order: Order;
}

function formatOrderDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const [showInvoiceMenu, setShowInvoiceMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInvoiceDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await orderService.downloadInvoice(order.id);
      const disposition = response.headers["content-disposition"] as string | undefined;
      const fileName =
        disposition?.match(/filename="?([^\";]+)"?/i)?.[1] ??
        `invoice-${order.id.slice(-10).toUpperCase()}.pdf`;

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Invoice downloaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download invoice";
      toast.error(message);
    } finally {
      setIsDownloading(false);
      setShowInvoiceMenu(false);
    }
  };

  return (
    <div className="bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg px-4 py-3">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-start">
        <div>
          <p className="text-[11px] text-[#565959] uppercase tracking-wide">Order placed</p>
          <p className="text-[13px] text-[#0F1111]">{formatOrderDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#565959] uppercase tracking-wide">Total</p>
          <p className="text-[13px] text-[#0F1111]">{formatPrice(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#565959] uppercase tracking-wide">Ship to</p>
          <p className="text-[13px] text-[#0F1111] line-clamp-1">
            {order.user?.name ?? "Customer"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#565959] uppercase tracking-wide">Order #</p>
          <p className="text-[13px] text-[#0F1111]">{order.id.slice(-14).toUpperCase()}</p>
        </div>

        <div className="justify-self-start lg:justify-self-end text-[13px] flex flex-col items-start lg:items-end gap-1.5 w-full lg:w-auto">
          <Link
            href={`/orders/${order.id}`}
            className="text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            View order details
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInvoiceMenu((v) => !v)}
              className="text-[#007185] hover:text-[#C7511F] inline-flex items-center gap-1 cursor-pointer"
            >
              Invoice <ChevronDown size={14} />
            </button>
            {showInvoiceMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-[#D5D9D9] rounded-md shadow-md z-20 py-1">
                <Link
                  href={`/orders/${order.id}`}
                  className="block px-3 py-1.5 text-[12px] text-[#0F1111] hover:bg-[#F7F7F7]"
                  onClick={() => setShowInvoiceMenu(false)}
                >
                  View order details
                </Link>
                <button
                  type="button"
                  onClick={handleInvoiceDownload}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-[#0F1111] hover:bg-[#F7F7F7] cursor-pointer"
                  disabled={isDownloading}
                >
                  {isDownloading ? "Downloading..." : "Download invoice (PDF)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceMenu(false);
                    window.print();
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-[#0F1111] hover:bg-[#F7F7F7] cursor-pointer"
                >
                  Print order page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
