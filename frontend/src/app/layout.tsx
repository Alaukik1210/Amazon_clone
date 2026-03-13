import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Amazon.in: Online Shopping India", template: "%s | Amazon.in" },
  description: "Production-level Amazon clone built with Next.js and TypeScript",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo_dark.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-[#eaeded] text-[#0f1111]"
        style={{ fontFamily: '"Noto Sans", Arial, sans-serif' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
