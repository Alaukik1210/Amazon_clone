import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Amazon.in: Online Shopping India", template: "%s | Amazon.in" },
  description: "Production-level Amazon clone built with Next.js and TypeScript",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.className} antialiased bg-[#eaeded] text-[#0f1111]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
