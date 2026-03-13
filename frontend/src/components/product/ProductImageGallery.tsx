"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

const PLACEHOLDER = "https://placehold.co/600x600/eaeded/565959?text=No+Image";

interface ProductImageGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const urls   = sorted.length ? sorted.map((i) => i.url) : [PLACEHOLDER];
  const [active, setActive] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const getImageUrl = (index: number) => {
    return failedImages.has(index) ? PLACEHOLDER : urls[index];
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set([...prev, index]));
  };

  return (
    <div className="flex gap-2 sticky top-4">
      {/* ── Vertical thumbnail strip ─── */}
      <div className="hidden sm:flex flex-col gap-2 w-[62px] shrink-0">
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "w-[62px] h-[62px] border-2 rounded-[3px] overflow-hidden bg-white flex items-center justify-center cursor-pointer transition-colors",
              active === i
                ? "border-[#c45500]"           // Amazon orange-brown active border
                : "border-[#ddd] hover:border-[#c45500]"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <Image
              src={getImageUrl(i)}
              alt={`${title} ${i + 1}`}
              width={56}
              height={56}
              className="object-contain w-full h-full p-1"
              onError={() => handleImageError(i)}
            />
          </button>
        ))}
      </div>

      {/* ── Main image ─────────────── */}
      <div className="flex-1 min-w-0">
        {/* Container — square, white bg */}
        <div
          className="relative w-full bg-white border border-[#ddd] rounded-[3px] overflow-hidden cursor-zoom-in group"
          style={{ paddingTop: "100%" }}
        >
          <Image
            src={getImageUrl(active)}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-contain p-6 absolute inset-0 group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => handleImageError(active)}
          />
        </div>

        {/* Mobile dots */}
        {urls.length > 1 && (
          <div className="sm:hidden flex justify-center gap-1.5 mt-2">
            {urls.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={cn("w-2 h-2 rounded-full transition-colors cursor-pointer",
                  active === i ? "bg-[#c45500]" : "bg-gray-300")}
              />
            ))}
          </div>
        )}

        {/* Mobile prev/next */}
        {urls.length > 1 && (
          <>
            <button onClick={() => setActive((i) => (i - 1 + urls.length) % urls.length)}
              className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 shadow cursor-pointer"
              aria-label="Previous image">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setActive((i) => (i + 1) % urls.length)}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 shadow cursor-pointer"
              aria-label="Next image">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
