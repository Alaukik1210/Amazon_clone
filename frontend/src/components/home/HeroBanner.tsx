"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product.service";
import { QUERY_KEYS } from "@/lib/constants";

const INTERVAL = 5500;

export function HeroBanner() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS({ sortBy: "rating", limit: 8 }),
    queryFn: () => productService.getAll({ sortBy: "rating", limit: 8 }).then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const slides = (data?.products ?? [])
    .filter((p) => p.images?.[0]?.url)
    .slice(0, 5)
    .map((p, i) => ({
      id: p.id,
      img: p.images[0].url,
      overlay: i % 2 === 0 ? "from-black/65 via-black/35 to-transparent" : "from-black/55 via-black/25 to-transparent",
      eyebrow: i % 2 === 0 ? "Deal of the day" : "New launch",
      title: p.title,
      subtitle: p.category ? `Top picks in ${p.category.name}` : "Trending products for you",
      cta: "Shop now",
      href: `/products/${p.slug}`,
    }));

  const hasSlides = slides.length > 0;

  const next = useCallback(() => {
    if (!hasSlides) return;
    setActive((i) => (i + 1) % slides.length);
  }, [hasSlides, slides.length]);
  const prev = useCallback(() => {
    if (!hasSlides) return;
    setActive((i) => (i - 1 + slides.length) % slides.length);
  }, [hasSlides, slides.length]);

  useEffect(() => {
    if (paused || !hasSlides) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, next, hasSlides]);

  useEffect(() => {
    if (!hasSlides) return;
    setActive((i) => (i >= slides.length ? 0 : i));
  }, [hasSlides, slides.length]);

  if (isLoading || !hasSlides) {
    return (
      <div className="relative w-full h-100 bg-[#f3f3f3]">
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-[#eaeded] to-transparent" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden select-none bg-[#131921]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ height: "clamp(320px, 38vw, 420px)" }}
    >
      {/* Slide track */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
        aria-live="polite"
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="relative min-w-full h-full cursor-pointer"
            aria-hidden={idx !== active}
            onClick={() => router.push(slide.href)}
          >
            {/* Background image */}
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              priority={idx === 0}
              className="object-cover object-center"
              sizes="100vw"
            />

            {/* Left-to-right dark gradient so text is always readable */}
            <div className={cn("absolute inset-0 bg-linear-to-r", slide.overlay)} />

            {/* Text content */}
            <div className="absolute inset-0 flex items-center px-8 sm:px-16 md:px-24">
              <div className="max-w-130">
                <p className="text-[#febd69] text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] mb-2">
                  {slide.eyebrow}
                </p>
                <h2 className="text-white font-extrabold leading-tight mb-2.5 drop-shadow-sm"
                  style={{ fontSize: "clamp(1.25rem, 3.5vw, 2.75rem)" }}>
                  {slide.title}
                </h2>
                <p className="text-gray-200 mb-5 leading-relaxed drop-shadow-sm"
                  style={{ fontSize: "clamp(0.8rem, 1.5vw, 1.1rem)" }}>
                  {slide.subtitle}
                </p>
                <Link
                  href={slide.href}
                  tabIndex={idx !== active ? -1 : 0}
                  className="inline-flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F2C200] text-[#0f1111] font-bold rounded-lg transition-colors duration-150 cursor-pointer"
                  style={{ padding: "clamp(0.4rem, 1vw, 0.625rem) clamp(1rem, 2vw, 1.75rem)", fontSize: "clamp(0.75rem, 1.2vw, 0.9375rem)" }}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom fade into page background */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#eaeded] to-transparent pointer-events-none" />

      {/* Arrow — Left */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                   bg-white/15 hover:bg-white/30 backdrop-blur-[2px]
                   text-white rounded-r p-2 sm:p-3
                   transition-all duration-200 cursor-pointer
                   focus-visible:outline-none focus-visible:bg-white/30"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      {/* Arrow — Right */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                   bg-white/15 hover:bg-white/30 backdrop-blur-[2px]
                   text-white rounded-l p-2 sm:p-3
                   transition-all duration-200 cursor-pointer
                   focus-visible:outline-none focus-visible:bg-white/30"
      >
        <ChevronRight size={22} strokeWidth={2.5} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "rounded-full transition-all duration-300 cursor-pointer",
              active === i
                ? "w-6 h-2 bg-[#febd69]"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}
