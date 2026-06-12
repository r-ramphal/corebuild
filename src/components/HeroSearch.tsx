"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/zoeken?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full group transition-transform focus-within:scale-[1.01]"
    >
      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
        <Search className="w-6 h-6 text-outline group-focus-within:text-primary transition-colors" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een component — bijv. RTX 4070, Ryzen 7"
        className="w-full h-16 pl-16 pr-6 bg-white border border-outline-variant rounded-xl shadow-sm text-on-surface placeholder:text-on-surface-variant font-body-lg text-body-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
      />
      <div className="absolute inset-y-0 right-4 flex items-center">
        <kbd className="hidden md:inline-flex h-8 items-center gap-1 rounded border border-outline-variant bg-surface-container-low px-2 font-label-technical text-label-technical text-on-surface-variant">
          <span>⌘</span>K
        </kbd>
      </div>
    </form>
  );
}
