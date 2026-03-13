"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { QUERY_KEYS } from "@/lib/constants";

/**
 * Runs once at app start — silently validates the HttpOnly cookie.
 * Does NOT block rendering. If user is in localStorage, pages show immediately.
 * If cookie is expired/missing, user is logged out in background.
 */
export function useAuthSync() {
  const { setUser } = useAuthStore();

  const { data, isError } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: () => authService.getMe().then((r) => r.data.data),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data)    setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) setUser(null); // cookie expired or backend down → log out
  }, [isError, setUser]);
}
