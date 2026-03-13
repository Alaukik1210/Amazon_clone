import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { OrdersPage as OrdersPageView } from "@/components/order/OrdersPage";

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageView />
    </ProtectedRoute>
  );
}
