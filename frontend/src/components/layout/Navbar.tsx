"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, MapPin, Menu, ChevronDown, User, Search,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { authService } from "@/services/auth.service";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ── Category bar links ─────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Fresh",            href: "/products?category=fresh" },
  { label: "Sell",             href: "/sell" },
  { label: "Bestsellers",      href: "/products?sortBy=rating" },
  { label: "Mobiles",          href: "/products?category=electronics" },
  { label: "Customer Service", href: "/help" },
  { label: "Today's Deals",    href: "/products?sortBy=price_asc" },
  { label: "New Releases",     href: "/products?sortBy=newest" },
  { label: "Fashion",          href: "/products?category=clothing" },
  { label: "Electronics",      href: "/products?category=electronics" },
  { label: "Home & Kitchen",   href: "/products?category=home-kitchen" },
  { label: "Books",            href: "/products?category=books" },
  { label: "Toys & Games",     href: "/products?category=toys" },
  { label: "Beauty",           href: "/products?category=beauty" },
  { label: "Sports",           href: "/products?category=sports" },
];

/* ══════════════════════════════════════════════════════════════════
   SearchBar — standalone, with debounced suggestions
══════════════════════════════════════════════════════════════════ */
function SearchBar() {
  const router = useRouter();
  const [query,      setQuery]      = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [showSug,    setShowSug]    = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef   = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn:  () => categoryService.getAll().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  /* Fetch suggestions with debounce */
  const fetchSuggestions = useCallback((q: string) => {
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await productService.getAll({ search: q, limit: 6, categoryId: categoryId || undefined });
        setSuggestions(res.data.data.products.map((p) => ({ id: p.id, title: p.title, slug: p.slug })));
        setShowSug(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, [categoryId]);

  const handleInput = (val: string) => {
    setQuery(val);
    fetchSuggestions(val);
  };

  const submit = (q = query) => {
    clearTimeout(debounceRef.current);
    setShowSug(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    router.push(`/products?${params.toString()}`);
  };

  /* Close suggestions on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", fn);
    return () => { document.removeEventListener("mousedown", fn); clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex h-10 rounded-md overflow-hidden shadow-sm"
        role="search"
      >
        {/* Category select */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="hidden sm:block bg-[#f3f3f3] border-r border-[#cdcdcd] text-[#0f1111] text-xs px-2 focus:outline-none cursor-pointer hover:bg-[#e9e9e9] transition-colors min-w-[80px] max-w-[110px]"
          aria-label="Search category"
        >
          <option value="">All</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Text input */}
        <input
          type="search"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSug(true)}
          placeholder="Search Amazon.in"
          className="flex-1 px-3 text-sm text-[#0f1111] bg-white focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:ring-inset placeholder:text-[#999]"
          aria-label="Search"
          autoComplete="off"
        />

        {/* Search button */}
        <button
          type="submit"
          className="bg-[#febd69] hover:bg-[#f3a847] active:bg-[#e47911] px-4 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search size={18} className="text-[#0f1111]" />
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSug && suggestions.length > 0 && (
        <ul className="absolute top-[calc(100%+2px)] left-0 right-0 bg-white border border-[#d5d9d9] rounded shadow-lg z-[100] py-1 max-h-72 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setQuery(s.title); setShowSug(false); submit(s.title); }}
                className="w-full text-left px-4 py-2 text-sm text-[#0f1111] hover:bg-[#f3f3f3] flex items-center gap-2 cursor-pointer"
              >
                <Search size={13} className="text-[#999] shrink-0" />
                {s.title}
              </button>
            </li>
          ))}
          <li className="border-t border-[#eee] mt-1 pt-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowSug(false); submit(); }}
              className="w-full text-left px-4 py-2 text-sm text-[#007185] hover:bg-[#f3f3f3] cursor-pointer"
            >
              See all results for &ldquo;<strong>{query}</strong>&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Navbar
══════════════════════════════════════════════════════════════════ */
export function Navbar() {
  const router             = useRouter();
  const { user, logout }   = useAuthStore();
  const cartCount          = useCartStore((s) => s.count);
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstName = user?.name?.split(" ")[0] ?? null;

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /**/ }
    logout();
    setMobileOpen(false);
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-50" style={{ fontFamily: '"Noto Sans", Arial, sans-serif' }}>

      {/* ══ TOP BAR ══════════════════════════════════════════════════ */}
      <div className="bg-[#131921]">
        <div className="flex items-center gap-2 px-3 h-[60px] max-w-[1500px] mx-auto">

          {/* Logo */}
          <Link
            href={ROUTES.HOME}
            className="shrink-0 hover:outline hover:outline-1 hover:outline-white rounded px-1 py-1"
          >
            <Image
              src="/logo.png"
              alt="Amazon logo"
              width={120}
              height={36}
              priority
              className="h-auto w-[112px] sm:w-[120px]"
            />
          </Link>

          {/* Deliver to — desktop only */}
          <button className="hidden lg:flex flex-col leading-none hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 cursor-pointer shrink-0">
            <span className="text-[#ccc] text-[11px]">Delivering to India</span>
            <span className="text-white font-bold text-[13px] flex items-center gap-0.5">
              <MapPin size={13} className="text-white" /> Update location
            </span>
          </button>

          {/* Search — takes all space */}
          <div className="flex-1 min-w-0 hidden md:flex">
            <SearchBar />
          </div>

          {/* Language — desktop */}
          <button className="hidden lg:flex items-center gap-0.5 text-white hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 cursor-pointer shrink-0">
            <span className="text-xs font-semibold">🇮🇳 EN</span>
            <ChevronDown size={12} />
          </button>

          {/* Account — desktop hover dropdown */}
          <div className="hidden md:block relative group shrink-0">
            <button className="flex flex-col leading-none hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 cursor-pointer text-left">
              <span className="text-[#ccc] text-[11px]">
                {firstName ? `Hello, ${firstName}` : "Hello, sign in"}
              </span>
              <span className="text-white font-bold text-[13px] flex items-center gap-0.5">
                Account &amp; Lists <ChevronDown size={12} />
              </span>
            </button>

            {/* Invisible hover bridge */}
            <div className="absolute top-full left-0 right-0 h-3 hidden group-hover:block" />

            {/* Dropdown */}
            <div className="absolute right-0 top-[calc(100%+10px)] w-56 bg-white text-[#0f1111] rounded shadow-2xl border border-[#d5d9d9] py-2 z-50
                            invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-100 pointer-events-none group-hover:pointer-events-auto">
              {!user ? (
                <div className="px-4 pb-3 pt-2 text-center">
                  <Link
                    href={ROUTES.LOGIN}
                    className="block w-full bg-[#febd69] hover:bg-[#f3a847] text-[#0f1111] font-semibold text-sm py-1.5 rounded mb-2 transition-colors"
                  >
                    Sign in
                  </Link>
                  <p className="text-xs text-[#565959]">
                    New customer?{" "}
                    <Link href={ROUTES.REGISTER} className="text-[#007185] hover:underline cursor-pointer">
                      Start here.
                    </Link>
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#eee]">
                    <p className="text-xs text-[#565959]">Signed in as</p>
                    <p className="text-sm font-bold truncate">{user.name ?? user.email}</p>
                  </div>
                  <AccountDropdownLink href={ROUTES.ACCOUNT}>Your Account</AccountDropdownLink>
                  <AccountDropdownLink href={ROUTES.ORDERS}>Your Orders</AccountDropdownLink>
                  <AccountDropdownLink href={ROUTES.WISHLIST}>Your Wishlist</AccountDropdownLink>
                  {user.role === "ADMIN" && (
                    <AccountDropdownLink href="/admin">Admin Panel</AccountDropdownLink>
                  )}
                  <div className="border-t border-[#eee] mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-[#c7511f] hover:bg-[#f7f7f7] transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Returns & Orders — desktop */}
          <Link
            href={ROUTES.ORDERS}
            className="hidden md:flex flex-col leading-none hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 shrink-0"
          >
            <span className="text-[#ccc] text-[11px]">Returns</span>
            <span className="text-white font-bold text-[13px]">&amp; Orders</span>
          </Link>

          {/* Mobile: account control */}
          <button
            className="md:hidden ml-auto text-white flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 cursor-pointer"
            aria-label="Account"
            onClick={() => {
              if (!user) {
                router.push(ROUTES.LOGIN);
                return;
              }
              setMobileOpen((o) => !o);
            }}
          >
            <span className="text-[15px] font-bold leading-none max-w-[96px] truncate">
              {firstName ?? "Sign in"}
            </span>
            <User size={20} className="shrink-0" />
          </button>

          {/* Cart */}
          <Link
            href={ROUTES.CART}
            className="relative flex items-end gap-0.5 hover:outline hover:outline-1 hover:outline-white rounded px-1.5 py-1 cursor-pointer"
            aria-label="Cart"
          >
            <span className="relative">
              <ShoppingCart size={27} className="text-white" />
              {/* Badge */}
              <span className={cn(
                "absolute -top-1.5 left-[12px] min-w-[17px] h-[17px] rounded-full flex items-center justify-center text-[10px] font-extrabold px-0.5",
                cartCount > 0 ? "bg-[#f08804] text-[#0f1111]" : "bg-[#f08804] text-[#0f1111]"
              )}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </span>
            <span className="text-white font-bold text-[13px] hidden sm:inline pb-0.5">Cart</span>
          </Link>

        </div>
      </div>

      {/* ══ MOBILE SEARCH ROW ══════════════════════════════════════════ */}
      <div className="md:hidden bg-[#131921] px-3 pb-2">
        <SearchBar />
      </div>

      {/* ══ MOBILE: Shop By row ════════════════════════════════════════ */}
      <div className="md:hidden bg-[#232f3e] text-white px-3 py-1.5 flex items-center gap-4 text-sm overflow-x-auto scrollbar-none">
        <span className="text-[#ccc] text-xs shrink-0">Shop By</span>
        {["Category", "Deals", "Sell"].map((lbl) => (
          <Link key={lbl} href="/products" className="font-bold text-sm shrink-0 hover:text-[#ff9900]">
            {lbl}
          </Link>
        ))}
      </div>

      {/* ══ MOBILE: Deliver to row ═══════════════════════════════════════ */}
      <div className="md:hidden bg-[#37475a] text-white px-3 py-1.5 flex items-center gap-1 text-[13px]">
        <MapPin size={13} className="text-[#ff9900] shrink-0" />
        <span className="text-[#ccc]">Delivering to India</span>
        <span className="ml-1 text-[#ff9900] font-semibold cursor-pointer hover:underline">
          Update location ›
        </span>
      </div>

      {/* ══ DESKTOP: Category bar ════════════════════════════════════════ */}
      <div className="hidden md:block bg-[#232f3e]">
        <div className="max-w-[1500px] mx-auto px-3 h-9 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {/* ≡ All */}
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-white text-[13px] font-bold px-2 h-full hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Menu size={16} /> All
          </Link>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="text-white text-[13px] px-2 h-full flex items-center hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ══ MOBILE DRAWER ════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="md:hidden bg-white text-[#0f1111] shadow-2xl border-t border-[#ddd] z-50 absolute w-full">
          {/* User header */}
          <div className="bg-[#232f3e] text-white px-4 py-3 flex items-center gap-2">
            <User size={20} className="text-[#ff9900]" />
            {user
              ? <span className="font-bold">Hello, {firstName}</span>
              : <Link href={ROUTES.LOGIN} onClick={() => setMobileOpen(false)} className="font-bold text-[#ff9900]">Sign in</Link>
            }
          </div>

          {/* Links */}
          <div className="divide-y divide-[#eee]">
            {NAV_LINKS.slice(0, 8).map((l) => (
              <MobileDrawerLink key={l.href + l.label} href={l.href} onClick={() => setMobileOpen(false)}>
                {l.label}
              </MobileDrawerLink>
            ))}
            <div className="bg-[#f7f7f7]">
              {user ? (
                <>
                  <MobileDrawerLink href={ROUTES.ACCOUNT} onClick={() => setMobileOpen(false)}>Your Account</MobileDrawerLink>
                  <MobileDrawerLink href={ROUTES.ORDERS} onClick={() => setMobileOpen(false)}>Your Orders</MobileDrawerLink>
                  <MobileDrawerLink href={ROUTES.WISHLIST} onClick={() => setMobileOpen(false)}>Your Wishlist</MobileDrawerLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-[#c7511f] hover:bg-[#eee] cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MobileDrawerLink href={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>Sign In</MobileDrawerLink>
                  <MobileDrawerLink href={ROUTES.REGISTER} onClick={() => setMobileOpen(false)}>Create Account</MobileDrawerLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Small helpers ─────────────────────────────────────────────── */

function AccountDropdownLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-1.5 text-[13px] hover:bg-[#f7f7f7] transition-colors cursor-pointer">
      {children}
    </Link>
  );
}

function MobileDrawerLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 text-[14px] hover:bg-[#f7f7f7] transition-colors cursor-pointer">
      {children}
    </Link>
  );
}
