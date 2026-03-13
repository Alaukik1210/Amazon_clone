"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/lib/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
    else if (adminOnly && user.role !== "ADMIN") router.replace(ROUTES.HOME);
  }, [user, hasHydrated, router, adminOnly]);

  if (!hasHydrated) return null;
  if (!user) return null;
  if (adminOnly && user.role !== "ADMIN") return null;

  return <>{children}</>;
}
