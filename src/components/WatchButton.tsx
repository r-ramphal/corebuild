"use client";

import { Bell } from "lucide-react";
import { useWatchlist, watchId, type WatchItem } from "@/lib/store/watchlist";
import { useHydrated } from "@/lib/use-hydrated";
import type { ComponentType } from "@/lib/types";

interface WatchButtonProps {
  name: string;
  category: ComponentType;
  url: string;
  retailer: string;
  priceEur: number;
  imageUrl?: string;
  /** "icon" = compacte toggle (kaarten); "full" = knop met label (productpagina) */
  variant?: "icon" | "full";
  className?: string;
}

/**
 * Volg de prijs van een product (volglijst, localStorage). Hydration-veilig: tot
 * de client gemonteerd is tonen we de "niet gevolgd"-staat, daarna pas de echte.
 */
export function WatchButton({
  name,
  category,
  url,
  retailer,
  priceEur,
  imageUrl,
  variant = "icon",
  className = "",
}: WatchButtonProps) {
  const id = watchId(category, name);
  const followed = useWatchlist((s) => s.items.some((i) => i.id === id));
  const toggle = useWatchlist((s) => s.toggle);
  const hydrated = useHydrated();

  const active = hydrated && followed;

  function handle() {
    const item: WatchItem = {
      id,
      name,
      category,
      url,
      retailer,
      priceEurAtAdd: priceEur,
      imageUrl,
      addedAt: Date.now(),
    };
    toggle(item);
  }

  if (variant === "full") {
    return (
      <button
        onClick={handle}
        aria-pressed={active}
        className={`px-6 py-3 rounded-lg font-label-technical text-label-technical flex items-center gap-2 transition-all border ${
          active
            ? "border-primary text-primary bg-primary-container/10"
            : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
        } ${className}`}
      >
        <Bell className={`w-4 h-4 ${active ? "fill-primary" : ""}`} />
        {active ? "Prijs gevolgd" : "Volg prijs"}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      aria-pressed={active}
      aria-label={active ? `Stop met ${name} volgen` : `Volg de prijs van ${name}`}
      title={active ? "Op je volglijst" : "Volg de prijs"}
      className={`p-2 rounded-lg border transition-all ${
        active
          ? "border-primary text-primary bg-primary-container/10"
          : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
      } ${className}`}
    >
      <Bell className={`w-4 h-4 ${active ? "fill-primary" : ""}`} />
    </button>
  );
}
