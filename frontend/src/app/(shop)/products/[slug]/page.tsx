"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import { Share2, ChevronRight, RefreshCw, Truck, BadgeCheck, Award, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { cn, getDeliveryDate } from "@/lib/utils";
import { productService } from "@/services/product.service";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/stores/auth.store";
import { useBuyNowStore } from "@/stores/buyNow.store";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ReviewList } from "@/components/product/ReviewList";
import { ReviewForm } from "@/components/product/ReviewForm";
import { StarRating } from "@/components/ui/StarRating";
import { PageSpinner } from "@/components/ui/Spinner";
import { ProductRow } from "@/components/home/ProductRow";

const COLOR_NAMES = ["Black","White","Grey","Navy","Red","Green","Blue","Maroon"];
const SIZES = ["XS","S","M","L","XL","2XL","3XL"];

const OFFERS = [
  { title: "Cashback",       desc: "Upto Rs14.00 cashback as Amazon Pay Balance when you pay using...", count: "1 offer" },
  { title: "Partner Offers", desc: "Get GST invoice and save up to 18% on business purchases.", count: "1 offer" },
  { title: "Bank Offer",     desc: "Upto Rs1,000.00 discount on Indus Bank Credit Cards...", count: "4 offers" },
];

const BENEFITS = [
  { Icon: RefreshCw, label: "10 days Return\n& Exchange" },
  { Icon: Truck,     label: "Pay on\nDelivery" },
  { Icon: Package,   label: "Free\nDelivery" },
  { Icon: Award,     label: "Top Brand" },
  { Icon: BadgeCheck,label: "Amazon\nDelivered" },
];

interface PageProps { params: Promise<{ slug: string }>; }

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router   = useRouter();
  const { addItem }                  = useCart();
  const { wishedProductIds, toggle } = useWishlist();
  const { user }                     = useAuthStore();
  const buyNow                       = useBuyNowStore();

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize,  setSelectedSize]  = useState(3);
  const [qty,           setQty]           = useState(1);
  const [giftOption,    setGiftOption]    = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.PRODUCT(slug),
    queryFn:  () => productService.getBySlug(slug).then((r) => r.data.data),
    retry: false,
  });

  useRecentlyViewed(product?.id);

  if (isLoading) return <PageSpinner />;
  if (isError || !product) return notFound();

  const isOOS    = product.status === "OUT_OF_STOCK" || product.stock === 0;
  const isWished = wishedProductIds.has(product.id);
  const lowStock = !isOOS && product.stock > 0 && product.stock <= 5;
  const isFashion = product.category?.slug === "fashion";
  const price    = Number(product.price);
  const mrpRaw   = Number(product.mrp);
  const mrp      = Number.isFinite(mrpRaw) && mrpRaw > 0 ? mrpRaw : Math.round(price * 1.4);
  const pct      = Math.round(((mrp - price) / mrp) * 100);
  const freeDate = getDeliveryDate(3);

  const tags     = Array.isArray(product.tags) ? product.tags : [];
  const colorList = tags.filter((t: string) => COLOR_NAMES.includes(t)) as string[];
  const finalColors = colorList.length > 0 ? colorList : COLOR_NAMES.slice(0, 4);

  const colorVariants = (product.images.length
    ? product.images.slice(0, finalColors.length)
    : [{ url: "", id: "0", position: 0, productId: product.id, createdAt: "" }]
  ).map((img, i) => ({
    name:  finalColors[i] ?? "Default",
    url:   img.url,
    price: `Rs${Math.floor(price).toLocaleString("en-IN")}.00`,
    mrp:   `Rs${mrp.toLocaleString("en-IN")}`,
  }));

  const handleAddToCart = () => {
    if (!user) { router.push(ROUTES.LOGIN); return; }
    addItem.mutate({ productId: product.id, quantity: qty });
  };

  const handleBuyNow = () => {
    if (!user) { router.push(ROUTES.LOGIN); return; }
    buyNow.set({ productId: product.id, title: product.title, price: product.price, imageUrl: product.images[0]?.url ?? "", qty });
    router.push("/checkout?mode=buynow");
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: product.title, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }
  };

  return (
    <div className="bg-white min-h-screen">
      <nav className="max-w-[1500px] mx-auto px-4 py-2 flex items-center gap-1 text-[12px] text-[var(--amazon-link)] flex-wrap">
        <Link href={ROUTES.HOME} className="hover:underline hover:text-[var(--amazon-link-hover)]">Home</Link>
        <ChevronRight size={10} className="text-gray-400" />
        <Link href={ROUTES.PRODUCTS} className="hover:underline hover:text-[var(--amazon-link-hover)]">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={10} className="text-gray-400" />
            <Link href={`${ROUTES.PRODUCTS}?categoryId=${product.category.id}`}
              className="hover:underline hover:text-[var(--amazon-link-hover)]">{product.category.name}</Link>
          </>
        )}
        <ChevronRight size={10} className="text-gray-400" />
        <span className="text-[var(--amazon-text-muted)] truncate max-w-[300px]">{product.title}</span>
      </nav>

      <div className="max-w-[1500px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_300px] gap-5 items-start">

          {/* LEFT — Gallery */}
          <div>
            <ProductImageGallery images={product.images} title={product.title} />
          </div>

          {/* CENTER — Info */}
          <div className="min-w-0">
            <p className="text-[12.5px] text-[var(--amazon-link)] mb-1 hover:underline cursor-pointer">
              Brand: <span className="font-semibold">{product.category?.name ?? "Brand"}</span>
            </p>
            <h1 className="text-[20px] font-medium text-[var(--amazon-text-primary)] leading-[1.3] mb-2">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {product.reviewCount > 0 ? (
                <>
                  <StarRating rating={product.avgRating} reviewCount={product.reviewCount} size="sm" showCount={false} />
                  <button className="text-[#007185] text-[13px] hover:underline cursor-pointer">{product.avgRating.toFixed(1)}</button>
                  <button className="text-[#007185] text-[13px] hover:underline cursor-pointer">{product.reviewCount.toLocaleString("en-IN")} ratings</button>
                </>
              ) : <span className="text-[13px] text-[var(--amazon-text-muted)]">No reviews yet</span>}
              <span className="text-[#ddd]">|</span>
              <button onClick={handleShare} className="text-[#007185] text-[13px] hover:underline flex items-center gap-1 cursor-pointer">
                <Share2 size={12} /> Share
              </button>
            </div>

            <hr className="border-[var(--amazon-border)] my-2.5" />

            {/* Price */}
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[#cc0c39] text-[15px]">-{pct}%</span>
                <span className="text-[28px] font-normal text-[var(--amazon-text-primary)] leading-none">
                  <span className="text-[16px] align-top leading-7">Rs</span>{Math.floor(price).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[13px] text-[var(--amazon-text-muted)] mt-0.5">
                M.R.P.: <span className="line-through">Rs{mrp.toLocaleString("en-IN")}</span>
              </p>
              <p className="text-[12px] text-[var(--amazon-text-muted)]">Inclusive of all taxes</p>
            </div>

            {/* Offers */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-4 h-4 rounded-full bg-[#febd69] flex items-center justify-center">
                  <span className="text-[8px] font-bold">%</span>
                </span>
                <span className="text-[14px] font-bold">Offers</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {OFFERS.map((o) => (
                  <div key={o.title} className="border border-[#ddd] rounded p-2.5 min-w-[160px] max-w-[185px] shrink-0 hover:shadow-sm cursor-pointer transition-shadow">
                    <p className="text-[13px] font-bold mb-0.5">{o.title}</p>
                    <p className="text-[11px] text-[var(--amazon-text-muted)] leading-snug line-clamp-2 mb-1">{o.desc}</p>
                    <p className="text-[12px] text-[#007185] font-medium hover:underline">{o.count} &rsaquo;</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="flex gap-5 py-3 border-t border-b border-[var(--amazon-border)] mb-3 overflow-x-auto scrollbar-none">
              {BENEFITS.map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 min-w-[60px] text-center shrink-0">
                  <Icon size={22} className="text-[var(--amazon-text-muted)]" strokeWidth={1.5} />
                  <span className="text-[10px] text-[var(--amazon-text-muted)] leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>

            {/* Colour */}
            <div className="mb-3">
              <p className="text-[13px] mb-1.5 font-medium">
                Colour: <span className="font-normal">{colorVariants[selectedColor]?.name}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {colorVariants.map((cv, i) => (
                  <button key={i} onClick={() => setSelectedColor(i)}
                    className={cn("w-[80px] border-2 rounded p-1 cursor-pointer transition-colors",
                      selectedColor === i ? "border-[#c45500]" : "border-[#ddd] hover:border-[#c45500]")}>
                    <div className="relative w-full h-[50px] bg-[#f3f3f3] mb-1">
                      {cv.url && <Image src={cv.url} alt={cv.name} fill className="object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />}
                    </div>
                    <p className="text-[10px] font-bold text-center">{cv.price}</p>
                    <p className="text-[10px] text-[var(--amazon-text-muted)] text-center line-through">{cv.mrp}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Size (only for fashion products) */}
            {isFashion && (
              <div className="mb-3">
                <p className="text-[13px] mb-1.5 font-medium">
                  Size: <span className="font-normal">{SIZES[selectedSize]}</span>
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {SIZES.map((sz, i) => (
                    <button key={sz} onClick={() => setSelectedSize(i)}
                      className={cn("min-w-[42px] h-[36px] px-2 border rounded text-[13px] font-medium cursor-pointer transition-colors",
                        selectedSize === i
                          ? "border-[#c45500] ring-1 ring-[#c45500] bg-white"
                          : "border-[#ddd] bg-white hover:border-[#888]")}>
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="mt-3 pt-3 border-t border-[var(--amazon-border)]">
                <h2 className="text-[15px] font-bold mb-1.5">About this item</h2>
                <p className="text-[13px] leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>

          {/* RIGHT — Purchase box */}
          <div className="border border-[#ddd] rounded-lg p-4 bg-white self-start sticky top-4">
            <p className="text-[24px] font-normal text-[var(--amazon-text-primary)] mb-1 leading-none">
              <span className="text-[14px] align-top leading-5">Rs</span>
              {Math.floor(price).toLocaleString("en-IN")}
              <span className="text-[14px]">.00</span>
            </p>
            <p className="text-[13px] mb-1">
              <span className="font-bold">FREE delivery </span>
              <span className="font-bold">{freeDate}.</span>
            </p>
            <p className="text-[13px] text-[var(--amazon-text-muted)] mb-1">
              Order within <span className="text-[#007185] font-bold">11 hrs 50 mins</span>.{" "}
              <span className="text-[#007185] cursor-pointer hover:underline">Details</span>
            </p>
            <div className="flex items-center gap-1 text-[12px] mb-2">
              <span>📍</span>
              <button className="text-[#007185] hover:underline cursor-pointer">Update location</button>
            </div>
            <p className={cn("text-[15px] mb-2", isOOS ? "text-[#cc0c39]" : "text-[var(--amazon-success)]")}>
              {isOOS ? "Currently unavailable" : lowStock ? `Only ${product.stock} left` : "In stock"}
            </p>
            <div className="text-[12px] mb-3 space-y-0.5">
              <div className="flex gap-4"><span className="text-[var(--amazon-text-muted)] w-14 shrink-0">Ships from</span><span>Amazon</span></div>
              <div className="flex gap-4"><span className="text-[var(--amazon-text-muted)] w-14 shrink-0">Sold by</span><span className="text-[#007185] hover:underline cursor-pointer">EMAZING DEALS</span></div>
              <div className="flex gap-4"><span className="text-[var(--amazon-text-muted)] w-14 shrink-0">Payment</span><span className="text-[#007185] hover:underline cursor-pointer">Secure transaction</span></div>
            </div>
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border border-[#ddd] rounded-md bg-[#f0f2f2] px-3 py-1.5 text-[13px] cursor-pointer mb-3 focus:outline-none focus:border-[var(--amazon-border-focus)]">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>Quantity: {n}</option>)}
            </select>
            <button disabled={isOOS || addItem.isPending} onClick={handleAddToCart}
              className={cn("btn-amazon w-full mb-2 transition-colors", isOOS && "opacity-50 cursor-not-allowed")}>
              {isOOS ? "Currently unavailable" : addItem.isPending ? "Adding..." : "Add to cart"}
            </button>
            <button disabled={isOOS} onClick={handleBuyNow}
              className={cn("w-full py-[9px] rounded-[20px] text-[13px] font-medium cursor-pointer mb-3 transition-colors bg-[#ff9900] border border-[#e68900] text-[#0f1111] hover:bg-[#e68900]", isOOS && "opacity-50 cursor-not-allowed")}>
              Buy Now
            </button>
            <label className="flex items-start gap-2 text-[12px] mb-3 cursor-pointer">
              <input type="checkbox" checked={giftOption} onChange={(e) => setGiftOption(e.target.checked)}
                className="mt-0.5 accent-[var(--amazon-warning)] cursor-pointer" />
              Add gift options
            </label>
            <button onClick={() => toggle.mutate(product.id)}
              className={cn("w-full py-1.5 border rounded text-[13px] cursor-pointer transition-colors",
                isWished ? "border-[#c45500] text-[#c45500] bg-[#fff8f0]" : "border-[#ddd] text-[var(--amazon-text-primary)] bg-white hover:bg-[#f7f7f7]")}>
              {isWished ? "Saved to Wish List" : "Add to Wish List"}
            </button>
          </div>
        </div>

        {/* Related products */}
        {product.category && (
          <div className="mt-8 border-t border-[var(--amazon-border)] pt-6">
            <ProductRow title="Products related to this item" viewAllLabel="See all"
              filters={{ categoryId: product.category.id, limit: 12 }}
              viewAllHref={`${ROUTES.PRODUCTS}?categoryId=${product.category.id}`} />
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8 border-t border-[var(--amazon-border)] pt-6">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            <ReviewList productId={product.id} avgRating={product.avgRating} reviewCount={product.reviewCount} />
            <div>
              <h2 className="text-[17px] font-bold mb-3">Share your thoughts</h2>
              <ReviewForm productId={product.id} hasPurchased={!!user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
