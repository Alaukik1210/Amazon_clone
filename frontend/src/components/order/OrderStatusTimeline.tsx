import { cn } from "@/lib/utils";
import { Check, Clock, Package, Truck, Home, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types";

interface Step {
  status:  OrderStatus;
  label:   string;
  icon:    React.ReactNode;
}

const STEPS: Step[] = [
  { status: "PENDING",    label: "Order Placed",  icon: <Clock size={16} /> },
  { status: "PROCESSING", label: "Processing",    icon: <Package size={16} /> },
  { status: "SHIPPED",    label: "Shipped",       icon: <Truck size={16} /> },
  { status: "DELIVERED",  label: "Delivered",     icon: <Home size={16} /> },
];

const ORDER_FLOW: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-[var(--amazon-error)] bg-[#FFF3F3] border border-[#F5C2C7] rounded-sm px-3 py-2">
        <XCircle size={20} />
        <span className="font-semibold">Order Cancelled</span>
      </div>
    );
  }

  const activeIndex = ORDER_FLOW.indexOf(status);

  return (
    <div className="flex items-start md:items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done    = i < activeIndex;
        const active  = i === activeIndex;
        const future  = i > activeIndex;
        const isLast  = i === STEPS.length - 1;

        return (
          <div key={step.status} className="flex items-center flex-1 min-w-24">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                done   && "bg-[var(--amazon-success)] border-[var(--amazon-success)] text-white",
                active && "bg-[var(--amazon-border-focus)] border-[var(--amazon-border-focus)] text-white",
                future && "bg-white border-[var(--amazon-border)] text-[var(--amazon-text-muted)]"
              )}>
                {done ? <Check size={14} /> : step.icon}
              </div>
              <p className={cn(
                "text-[11px] mt-1 text-center w-20 leading-tight",
                active ? "font-bold text-[var(--amazon-text-primary)]" : "text-[var(--amazon-text-muted)]"
              )}>
                {step.label}
              </p>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className={cn(
                "flex-1 h-0.5 mb-5 mx-1 transition-colors",
                i < activeIndex ? "bg-[var(--amazon-success)]" : "bg-[var(--amazon-border)]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
