import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComponentType } from "@/lib/types";

/**
 * Een gevolgd product op de volglijst. Client-only (localStorage): geen account
 * nodig. De prijs ten tijde van toevoegen laat ons later een prijsdaling tonen
 * (vergeleken met de actuele prijs uit `price_history`). E-mail/push-alerts
 * komen pas als er een e-mailprovider is gekoppeld.
 */
export interface WatchItem {
  /** Stabiele sleutel: categorie + genormaliseerde naam (ontdubbelt over retailers) */
  id: string;
  name: string;
  category: ComponentType;
  /** De aanbieding waarmee het product werd toegevoegd (voor link + prijsverloop) */
  url: string;
  retailer: string;
  priceEurAtAdd: number;
  imageUrl?: string;
  addedAt: number;
}

interface WatchlistState {
  items: WatchItem[];
  /** Toevoegen of verwijderen op basis van id */
  toggle: (item: WatchItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const watchId = (category: string, name: string) =>
  `${category}::${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id)
            ? { items: s.items.filter((i) => i.id !== item.id) }
            : { items: [item, ...s.items].slice(0, 100) }
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "corebuild-watchlist" }
  )
);
