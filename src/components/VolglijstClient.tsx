"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, BellRing, Trash2, TrendingDown, TrendingUp, Package } from "lucide-react";
import { useWatchlist, type WatchItem } from "@/lib/store/watchlist";
import { usePriceHistory } from "@/lib/use-price-history";
import { useHydrated } from "@/lib/use-hydrated";
import { useAlerts } from "@/lib/use-alerts";
import { useSession } from "@/lib/auth-client";
import { COMPONENT_META } from "@/lib/categories";
import { productUrl } from "@/lib/product-url";
import { formatEur } from "@/lib/format";

function addedLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

interface WatchRowProps {
  item: WatchItem;
  onRemove: (id: string) => void;
  loggedIn: boolean;
  hasAlert: boolean;
  alertBusy: boolean;
  onToggleAlert: (item: WatchItem, priceEur: number, enable: boolean) => void;
}

function WatchRow({ item, onRemove, loggedIn, hasAlert, alertBusy, onToggleAlert }: WatchRowProps) {
  // Actuele prijs ≈ het laatste meetpunt voor deze aanbieding (uit price_history)
  const points = usePriceHistory([item.url]);
  const currentCents = points.length > 0 ? points[points.length - 1].priceCents : null;
  const addedCents = Math.round(item.priceEurAtAdd * 100);
  const delta = currentCents !== null ? currentCents - addedCents : 0;
  const alertPriceEur = (currentCents ?? addedCents) / 100;

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

        {loggedIn && (
          <button
            onClick={() => onToggleAlert(item, alertPriceEur, !hasAlert)}
            disabled={alertBusy}
            aria-pressed={hasAlert}
            title={
              hasAlert
                ? "E-mail bij prijsdaling staat aan"
                : "Krijg een e-mail als de prijs daalt"
            }
            className={`px-3 py-2 rounded-lg border font-label-technical text-label-technical flex items-center gap-1.5 transition-all disabled:opacity-50 ${
              hasAlert
                ? "border-primary text-primary bg-primary-container/10"
                : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
            }`}
          >
            {hasAlert ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span className="hidden sm:inline">{hasAlert ? "Alert aan" : "Mail-alert"}</span>
          </button>
        )}
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

  const { data: session } = useSession();
  const loggedIn = !!session;
  const { alertIds, mutate: mutateAlerts } = useAlerts(loggedIn);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleAlert(item: WatchItem, priceEur: number, enable: boolean) {
    setBusyId(item.id);
    try {
      if (enable) {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            url: item.url,
            retailer: item.retailer,
            imageUrl: item.imageUrl,
            priceEur,
          }),
        });
      } else {
        await fetch(`/api/alerts?productId=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      }
      await mutateAlerts();
    } catch {
      // stil: de toggle blijft staan zoals hij was
    } finally {
      setBusyId(null);
    }
  }

  // Verwijderen uit de volglijst ruimt ook een eventuele server-alert op
  function handleRemove(id: string) {
    remove(id);
    if (loggedIn && alertIds.has(id)) {
      fetch(`/api/alerts?productId=${encodeURIComponent(id)}`, { method: "DELETE" })
        .then(() => mutateAlerts())
        .catch(() => {});
    }
  }

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
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 max-w-2xl">
          De producten waarvan je de prijs volgt. We tonen de prijsbeweging sinds je ze toevoegde.
          Zet een mail-alert aan om bericht te krijgen zodra de prijs daalt.
        </p>

        {mounted && items.length > 0 && !loggedIn && (
          <div className="mb-8 flex items-center gap-3 flex-wrap bg-primary-container/10 border border-primary/20 rounded-xl px-4 py-3">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            <span className="font-body-sm text-body-sm text-on-surface">
              Wil je een e-mail zodra een prijs daalt?{" "}
              <Link href="/inloggen" className="text-primary hover:underline font-medium">
                Log in
              </Link>{" "}
              en zet per product een alert aan.
            </span>
          </div>
        )}

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
              <WatchRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                loggedIn={loggedIn}
                hasAlert={alertIds.has(item.id)}
                alertBusy={busyId === item.id}
                onToggleAlert={toggleAlert}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
