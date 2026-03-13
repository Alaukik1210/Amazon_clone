"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component so it's not shared across requests (SSR safe)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes — don't refetch if data is fresh
            retry: 1,                  // retry failed requests once
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
      </ThemeProvider>
      {/* Sonner toast notifications — positioned bottom-right, Amazon orange accent */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: "var(--font-sans)" },
          classNames: {
            success: "!border-l-4 !border-l-[#067d62]",
            error:   "!border-l-4 !border-l-[#cc0c39]",
          },
        }}
      />
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
