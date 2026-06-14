"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Trash2, TrendingDown, TrendingUp, Package } from "lucide-react";
import { useWatchlist, type WatchItem } from "@/lib/store/watchlist";
import { usePriceHistory } from "@/lib/use-price-history";
import { useHydrated } from "@/lib/use-hydrated";
import { COMPONENT_META } from "@/lib/categories";
import { productUrl } from "@/lib/product-url";
import { formatEur } from "@/lib/format";

function addedLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

function WatchRow({ item, onRemove }: { item: WatchItem; onRemove: (id: string) => void }) {
  // Actuele prijs ≈ het laatste meetpunt voor deze aanbieding (uit price_history)
  const points = usePriceHistory([item.url]);
  const currentCents = points.length > 0 ? points[points.length - 1].priceCents : null;
  const addedCents = Math.round(item.priceEurAtAdd * 100);
  const delta = currentCents !== null ? currentCents - addedCents : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary transition-colors">
      <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={64}
            height={64}
            className="object-contain max-w-full max-h-full"
            unoptimized
          />
        ) : (
          <Package className="w-7 h-7 text-outline" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wide">
            {COMPONENT_META[item.category]?.label ?? item.category}
          </span>
          <span className="font-label-technical text-[11px] text-on-surface-variant">
            · gevolgd sinds {addedLabel(item.addedAt)}
          </span>
        </div>
        <Link
          href={productUrl({ name: item.name }, item.category)}
          className="font-title-md text-title-md text-on-surface hover:text-primary transition-colors line-clamp-2"
        >
          {item.name}
        </Link>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <span className="font-label-price text-label-price text-primary block">
            {formatEur((currentCents ?? addedCents) / 100)}
          </span>
          {delta !== 0 ? (
            <span
              className={`inline-flex items-center gap-1 font-label-technical text-[11px] ${
                delta < 0 ? "text-success-emerald" : "text-error-crimson"
              }`}
            >
              {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {formatEur(Math.abs(delta) / 100)} sinds toevoegen
            </span>
          ) : (
            <span className="font-label-technical text-[11px] text-on-surface-variant">
              prijs bij toevoegen
            </span>
          )}
        </div>

        <Link
          href={productUrl({ name: item.name }, item.category)}
          className="px-4 py-2 border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          Bekijk
        </Link>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Verwijder ${item.name} van de volglijst`}
          className="px-3 py-2 border border-outline-variant rounded-lg text-on-surface-variant hover:border-error-crimson hover:text-error-crimson transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function VolglijstClient() {
  const items = useWatchlist((s) => s.items);
  const remove = useWatchlist((s) => s.remove);
  const clear = useWatchlist((s) => s.clear);

  // Hydration-veilig: pas na hydratie de (localStorage-)inhoud tonen
  const mounted = useHydrated();

  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Volglijst</h1>
          {mounted && items.length > 0 && (
            <button
              onClick={clear}
              className="font-label-technical text-label-technical text-on-surface-variant hover:text-error-crimson transition-colors"
            >
              Wis volglijst
            </button>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-10 max-w-2xl">
          De producten waarvan je de prijs volgt. We tonen de prijsbeweging sinds je ze toevoegde.
          E-mailmeldingen bij een prijsdaling volgen zodra meldingen aanstaan.
        </p>

        {!mounted ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-outline-variant rounded-xl">
            <Bell className="w-8 h-8 text-outline mx-auto mb-3" />
            <p className="font-title-md text-title-md text-on-surface mb-2">
              Je volgt nog geen producten
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Klik op &ldquo;Volg prijs&rdquo; bij een product of in een categorie om het hier te zien.
            </p>
            <Link
              href="/categorie"
              className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90"
            >
              Blader door categorieën
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <WatchRow key={item.id} item={item} onRemove={remove} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
