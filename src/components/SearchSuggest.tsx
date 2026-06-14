"use client";

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, Cpu, Monitor, LayoutGrid, TrendingUp } from "lucide-react";
import { getSuggestions, type SuggestionKind } from "@/lib/search-suggestions";

// Platform-detectie zonder hydration-mismatch: server geeft false, client de
// echte waarde. useSyncExternalStore is hiervoor de juiste hook (geen setState).
const noopSubscribe = () => () => {};
function detectMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
}

type Variant = "hero" | "navbar" | "page";

const KIND_ICON: Record<SuggestionKind, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  category: LayoutGrid,
  term: TrendingUp,
};

export function SearchSuggest({
  variant = "navbar",
  initialValue = "",
  autoFocus = false,
  onNavigate,
}: {
  variant?: Variant;
  initialValue?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const isMac = useSyncExternalStore(noopSubscribe, detectMac, () => false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestions(value), [value]);

  // ⌘K / Ctrl+K om het hero-zoekveld te focussen
  useEffect(() => {
    if (variant !== "hero") return;
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant]);

  // Klik buiten sluit de suggesties
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  }

  function submit() {
    const q = value.trim();
    if (!q) return;
    go(`/zoeken?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && suggestions[active]) go(suggestions[active].href);
      else submit();
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showList = open && suggestions.length > 0;

  // Variant-afhankelijke maatvoering
  const inputClass =
    variant === "hero"
      ? "w-full h-16 pl-16 pr-20 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm text-on-surface placeholder:text-on-surface-variant font-body-lg text-body-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
      : variant === "page"
        ? "w-full h-12 pl-11 pr-4 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        : "w-full h-10 pl-10 pr-4 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary";

  const iconClass =
    variant === "hero"
      ? "absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-outline pointer-events-none"
      : variant === "page"
        ? "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none"
        : "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none";

  return (
    <div ref={wrapRef} className={`relative ${variant === "navbar" ? "w-48 lg:w-64" : "w-full"}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        role="search"
        className={variant === "hero" ? "group transition-transform focus-within:scale-[1.01]" : ""}
      >
        <Search className={iconClass} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={variant === "hero" ? "Zoek een component, bijv. RTX 4070 of Ryzen 7" : "Zoek componenten..."}
          aria-label="Zoek componenten"
          aria-expanded={showList}
          aria-autocomplete="list"
          role="combobox"
          aria-controls="search-suggesties"
          className={inputClass}
        />
        {variant === "hero" && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <kbd className="hidden md:inline-flex h-8 items-center gap-1 rounded border border-outline-variant bg-surface-container-low px-2 font-label-technical text-label-technical text-on-surface-variant">
              {isMac ? "⌘" : "Ctrl"} K
            </kbd>
          </div>
        )}
      </form>

      {showList && (
        <ul
          id="search-suggesties"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-1.5 overflow-hidden"
        >
          {suggestions.map((s, i) => {
            const Icon = KIND_ICON[s.kind];
            return (
              <li key={`${s.kind}-${s.label}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  // mousedown i.p.v. click: voorkomt dat blur de lijst sluit vóór de navigatie
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(s.href);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i === active ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                  }`}
                >
                  <Icon className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <span className="font-body-sm text-body-sm text-on-surface truncate flex-1">{s.label}</span>
                  <span className="font-label-technical text-[11px] text-on-surface-variant flex-shrink-0">{s.sub}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
