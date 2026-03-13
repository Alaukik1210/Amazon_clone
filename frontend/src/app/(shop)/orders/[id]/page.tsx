"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { orderService } from "@/services/order.service";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import { formatPrice, formatDate } from "@/lib/utils";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { Badge, orderStatusVariant, paymentStatusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { ChevronLeft, MapPin, CreditCard, Package, FileText } from "lucide-react";
import type { Order } from "@/types";

const PLACEHOLDER = "https://placehold.co/80x80/eaeded/565959?text=?";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  COD:          "Cash on Delivery",
  RAZORPAY:     "Online Payment",
  TEST_BYPASS:  "Test Order (Demo)",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function OrderDetailContent({ order }: { order: Order }) {
  const qc     = useQueryClient();
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const canCancel = ["PENDING", "PROCESSING"].includes(order.status);

  const cancel = useMutation({
    mutationFn: () => orderService.cancel(order.id),
    onSuccess:  (res) => {
      qc.setQueryData(QUERY_KEYS.ORDER(order.id), res.data.data);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS() });
      toast.success("Order cancelled successfully");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to cancel order"),
  });

  const handleInvoiceDownload = async () => {
    try {
      setIsDownloadingInvoice(true);
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
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <div className="bg-[#EAEDED] min-h-screen py-6">
      <div className="max-w-275 mx-auto px-4 space-y-4">
        <Link href={ROUTES.ORDERS} className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline inline-flex items-center gap-1">
          <ChevronLeft size={14} /> Back to your orders
        </Link>

        <div className="bg-white border border-[#D5D9D9] rounded-sm px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-normal text-[#0F1111] leading-none">Order Details</h1>
              <p className="text-[12px] text-[#565959] mt-1">Order #{order.id.slice(-12).toUpperCase()} · Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={orderStatusVariant(order.status)} className="text-[12px] px-3 py-1">{order.status}</Badge>
              <Badge variant={paymentStatusVariant(order.paymentStatus)} className="text-[12px] px-3 py-1">{order.paymentStatus}</Badge>
            </div>
          </div>
        </div>

        <section className="bg-white border border-[#D5D9D9] rounded-sm overflow-hidden">
          <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-5 py-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#565959]">Order placed</p>
              <p className="text-[13px] text-[#0F1111]">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#565959]">Total</p>
              <p className="text-[13px] text-[#0F1111]">{formatPrice(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#565959]">Ship to</p>
              <p className="text-[13px] text-[#0F1111] line-clamp-1">{order.user?.name ?? "Customer"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#565959]">Order #</p>
              <p className="text-[13px] text-[#0F1111]">{order.id.slice(-14).toUpperCase()}</p>
            </div>
            <div className="justify-self-start lg:justify-self-end">
              <button
                type="button"
                onClick={handleInvoiceDownload}
                disabled={isDownloadingInvoice}
                className="text-[13px] text-[#007185] hover:text-[#C7511F] hover:underline inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer"
              >
                <FileText size={14} /> Invoice
              </button>
            </div>
          </div>

          <div className="p-5">
            <h2 className="text-[18px] font-semibold text-[#0F1111] mb-4">Shipment updates</h2>
            <OrderStatusTimeline status={order.status} />
          </div>
        </section>

        <section className="bg-white border border-[#D5D9D9] rounded-sm p-5">
          <h2 className="text-[18px] font-semibold text-[#0F1111] mb-4 flex items-center gap-2">
            <Package size={16} /> Items in this order ({order.items.length})
          </h2>

          <div className="space-y-4">
            {order.items.map((item) => (
              <article key={item.id} className="border-b border-[#DDD] pb-4 last:border-b-0 last:pb-0">
                <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px] gap-4 items-start">
                  <div className="relative w-20 h-20 bg-white border border-[#D5D9D9] rounded-sm">
                    <Image
                      src={item.product.images[0]?.url ?? PLACEHOLDER}
                      alt={item.product.title}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                  </div>

                  <div className="min-w-0">
                    <Link href={`/products/${item.product.slug}`} className="text-[15px] text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2">
                      {item.product.title}
                    </Link>
                    <p className="text-[13px] text-[#007600] mt-1">Delivered</p>
                    <p className="text-[13px] text-[#565959] mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link
                        href={`/orders/${order.id}?tab=tracking`}
                        className="h-8 px-4 rounded-full text-[13px] border border-[#FCD200] bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] inline-flex items-center"
                      >
                        Track package
                      </Link>
                      <Link
                        href={`/products/${item.product.slug}#reviews`}
                        className="h-8 px-4 rounded-full text-[13px] border border-[#D5D9D9] bg-[#F7F7F7] hover:bg-[#EFEFEF] text-[#0F1111] inline-flex items-center"
                      >
                        Write a product review
                      </Link>
                    </div>
                  </div>

                  <p className="text-left sm:text-right text-[18px] font-medium text-[#0F1111]">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#D5D9D9] flex justify-between items-center text-[18px] font-bold text-[#0F1111]">
            <span>Order Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white border border-[#D5D9D9] rounded-sm p-5">
            <h3 className="text-[18px] font-semibold text-[#0F1111] mb-3 flex items-center gap-2">
              <MapPin size={16} /> Shipping address
            </h3>
            {order.shippingAddress ? (
              <div className="text-[14px] text-[#0F1111] leading-[1.45]">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-[14px] text-[#565959]">Address not available</p>
            )}
          </section>

          <section className="bg-white border border-[#D5D9D9] rounded-sm p-5">
            <h3 className="text-[18px] font-semibold text-[#0F1111] mb-3 flex items-center gap-2">
              <CreditCard size={16} /> Payment information
            </h3>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between gap-3">
                <span className="text-[#565959]">Method</span>
                <span className="text-[#0F1111] font-medium text-right">{PAYMENT_MODE_LABEL[order.paymentMode] ?? order.paymentMode}</span>
              </div>
              <div className="flex justify-between gap-3 items-center">
                <span className="text-[#565959]">Status</span>
                <Badge variant={paymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between gap-3">
                  <span className="text-[#565959]">Payment ID</span>
                  <span className="font-mono text-[12px] text-[#0F1111]">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {canCancel && (
          <section className="bg-white border border-[#D5D9D9] rounded-sm p-5">
            <Alert variant="warning" message="You can cancel this order as it has not shipped yet." />
            <Button
              variant="danger"
              size="sm"
              loading={cancel.isPending}
              onClick={() => {
                if (confirm("Are you sure you want to cancel this order?")) cancel.mutate();
              }}
              className="mt-3"
            >
              Cancel order
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}

function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: QUERY_KEYS.ORDER(id),
    queryFn:  () => orderService.getById(id).then((r) => r.data.data),
    retry:    false,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !order) return notFound();

  return <OrderDetailContent order={order} />;
}

export default function OrderDetailPageWrapper(props: PageProps) {
  return (
    <ProtectedRoute>
      <OrderDetailPage {...props} />
    </ProtectedRoute>
  );
}
