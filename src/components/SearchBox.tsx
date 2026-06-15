"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, TrendingUp } from "lucide-react";
import { getSuggestions } from "@/lib/search-suggestions";
import type { ComponentType } from "@/lib/types";

/**
 * Zoekveld met typeahead-suggesties voor lokaal filteren (categoriepagina,
 * builder-picker). Anders dan `SearchSuggest` navigeert dit niet weg: het roept
 * `onSubmit(term)` aan zodat de ouder de eigen zoek-/filterstate bijwerkt.
 * Met `category` worden alleen suggesties van dat type getoond.
 */
export function SearchBox({
  value,
  onChange,
  onSubmit,
  category,
  placeholder = "Zoeken…",
  autoFocus = false,
  inputClassName = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (term: string) => void;
  category?: ComponentType;
  placeholder?: string;
  autoFocus?: boolean;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestions(value, 7, category), [value, category]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function pick(term: string) {
    onChange(term);
    onSubmit(term);
    setOpen(false);
    setActive(-1);
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
      // Actieve suggestie kiezen; anders laat de form-submit de huidige waarde zoeken
      if (open && active >= 0 && suggestions[active]) {
        e.preventDefault();
        pick(suggestions[active].label);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-expanded={showList}
        aria-autocomplete="list"
        role="combobox"
        aria-controls="searchbox-suggesties"
        className={inputClassName || "w-full h-10 pl-10 pr-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"}
      />

      {showList && (
        <ul
          id="searchbox-suggesties"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-1.5 overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.kind}-${s.label}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s.label);
                }}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  i === active ? "bg-surface-container-low" : "hover:bg-surface-container-low"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                <span className="font-body-sm text-body-sm text-on-surface truncate flex-1">{s.label}</span>
                <span className="font-label-technical text-[11px] text-on-surface-variant flex-shrink-0">{s.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
