"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { QUERY_KEYS } from "@/lib/constants";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => categoryService.getAll().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const submitSearch = (q: string, cat: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    if (cat) params.set("categoryId", cat);
    router.push(`/products?${params.toString()}`);
  };

  const handleInput = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => submitSearch(value, categoryId), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    submitSearch(query, categoryId);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 max-w-2xl h-10 rounded overflow-hidden"
      role="search"
    >
      {/* Category select */}
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="bg-[#f3f3f3] border-r border-gray-300 px-2 text-xs text-[#0f1111] focus:outline-none max-w-[120px] hidden sm:block"
        aria-label="Search category"
      >
        <option value="">All</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Text input */}
      <input
        type="search"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="Search Amazon"
        className="flex-1 px-3 text-sm text-[#0f1111] focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
        aria-label="Search"
      />

      {/* Search button */}
      <button
        type="submit"
        className="bg-[#febd69] hover:bg-[#f3a847] px-4 flex items-center justify-center transition-colors"
        aria-label="Submit search"
      >
        <Search size={18} className="text-[#0f1111]" />
      </button>
    </form>
  );
}
