import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  "bg-gray-100 text-gray-700",
  success:  "bg-green-100 text-green-700",
  warning:  "bg-yellow-100 text-yellow-700",
  danger:   "bg-red-100 text-red-700",
  info:     "bg-blue-100 text-blue-700",
  outline:  "border border-gray-300 text-gray-700 bg-transparent",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

// Maps backend OrderStatus → badge variant
export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PENDING":    return "warning";
    case "PROCESSING": return "info";
    case "SHIPPED":    return "info";
    case "DELIVERED":  return "success";
    case "CANCELLED":  return "danger";
    default:           return "default";
  }
}

export function paymentStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PAID":     return "success";
    case "PENDING":  return "warning";
    case "FAILED":   return "danger";
    case "REFUNDED": return "outline";
    default:         return "default";
  }
}
