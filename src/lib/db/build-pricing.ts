import { and, eq, gt, inArray, sql } from "drizzle-orm";
import type { Db } from "./index";
import { listings } from "./schema";
import { CATALOG_TTL_MS } from "./listings";
import type { ComponentType } from "@/lib/types";
import { computeBuildIndex, type PartDayPoints } from "@/lib/specs/build-index";
import { cheapestOffer, type PartOffers, type Offer } from "@/lib/specs/split-cart";
import { productMatches } from "@/lib/specs/match-product";

/** Eén gekozen onderdeel uit de build (de aanbieding die de gebruiker koos). */
export interface BuildPart {
  slot: ComponentType;
  name: string;
  category: ComponentType;
  url: string;
  retailer: string;
  priceCents: number;
}

export interface BuildPricingData {
  offers: PartOffers[];
  index: { points: { day: string; totalCents: number }[]; partsTracked: number; partsTotal: number } | null;
}

/**
 * Haalt voor een set gekozen onderdelen (a) alle concurrerende retailer-
 * aanbiedingen op (voor de split-cart) en (b) de prijshistorie per onderdeel
 * (voor de build-prijsindex). Eén `listings`-query + één `price_history`-query.
 *
 * Productidentiteit, net als de cross-retailer prijsalert (deel 17): zelfde
 * categorie + de listing-naam bevat de genormaliseerde productnaam (≥6 tekens).
 * Zo vergelijken we hetzelfde product over álle winkels, niet alleen de
 * oorspronkelijk gekozen aanbieding.
 */
export async function getBuildPricingData(
  db: Db,
  parts: BuildPart[],
  days = 90
): Promise<BuildPricingData> {
  if (parts.length === 0) return { offers: [], index: null };

  const categories = [...new Set(parts.map((p) => p.category))];
  const cutoff = new Date(Date.now() - CATALOG_TTL_MS);
  const rows = await db
    .select({
      retailer: listings.retailer,
      name: listings.name,
      url: listings.url,
      priceCents: listings.priceCents,
      inStock: listings.inStock,
      category: listings.category,
    })
    .from(listings)
    .where(and(inArray(listings.category, categories), eq(listings.mock, false), gt(listings.scrapedAt, cutoff)));

  const offers: PartOffers[] = [];
  const urlsByPart: string[][] = [];

  for (const part of parts) {
    const matches = rows.filter(
      (r) =>
        r.category === part.category &&
        (r.url === part.url || productMatches(part.name, r.name, part.category))
    );

    // Eén aanbieding per retailer: op voorraad heeft voorrang, dan de laagste prijs.
    const byRetailer = new Map<string, Offer>();
    for (const m of matches) {
      const off: Offer = { retailer: m.retailer, url: m.url, priceCents: m.priceCents, inStock: m.inStock };
      const cur = byRetailer.get(m.retailer);
      if (!cur) {
        byRetailer.set(m.retailer, off);
      } else {
        const better =
          (off.inStock && !cur.inStock) || (off.inStock === cur.inStock && off.priceCents < cur.priceCents);
        if (better) byRetailer.set(m.retailer, off);
      }
    }
    // De zelf gekozen aanbieding telt altijd mee (ook als de catalogus 'm net miste).
    if (part.url && !byRetailer.has(part.retailer)) {
      byRetailer.set(part.retailer, {
        retailer: part.retailer,
        url: part.url,
        priceCents: part.priceCents,
        inStock: true,
      });
    }

    offers.push({ slot: part.slot, name: part.name, offers: [...byRetailer.values()] });
    urlsByPart.push([...new Set(matches.map((m) => m.url).concat(part.url ? [part.url] : []))]);
  }

  // ── Build-prijsindex uit price_history ──────────────────────────────────────
  const allUrls = [...new Set(urlsByPart.flat())];
  let index: BuildPricingData["index"] = null;
  if (allUrls.length > 0) {
    const histCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const res = await db.execute(sql`
      SELECT url,
             to_char(date_trunc('day', recorded_at), 'YYYY-MM-DD') AS day,
             min(price_cents)::int AS price_cents
      FROM price_history
      WHERE url IN (${sql.join(allUrls.map((u) => sql`${u}`), sql`, `)})
        AND recorded_at > ${histCutoff}
      GROUP BY url, date_trunc('day', recorded_at)
    `);
    const hist = res.rows as { url: string; day: string; price_cents: number }[];

    const byUrlDay = new Map<string, Map<string, number>>();
    for (const h of hist) {
      let m = byUrlDay.get(h.url);
      if (!m) {
        m = new Map();
        byUrlDay.set(h.url, m);
      }
      m.set(h.day, Number(h.price_cents));
    }

    const partDay: PartDayPoints[] = urlsByPart.map((urls, i) => {
      const byDay = new Map<string, number>();
      for (const u of urls) {
        const m = byUrlDay.get(u);
        if (!m) continue;
        for (const [day, price] of m) {
          const cur = byDay.get(day);
          if (cur == null || price < cur) byDay.set(day, price);
        }
      }
      return { slot: parts[i].slot, byDay };
    });

    const today = new Date().toISOString().slice(0, 10);
    const { points, partsTracked } = computeBuildIndex(partDay, today);
    if (points.length >= 2) {
      // Anker het laatste punt (vandaag) op de live goedkoopste prijs per getrackt
      // onderdeel — dezelfde bron als de split-cart — zodat "Nu" op de index gelijk
      // is aan de onderdeelprijs van de slimme verdeling (price_history kan iets
      // achterlopen op de actuele catalogus).
      const trackedSlots = new Set(partDay.filter((p) => p.byDay.size > 0).map((p) => p.slot));
      let liveTracked = 0;
      for (const o of offers) {
        if (!trackedSlots.has(o.slot)) continue;
        const c = cheapestOffer(o.offers);
        if (c) liveTracked += c.priceCents;
      }
      if (liveTracked > 0) {
        points[points.length - 1] = { day: points[points.length - 1].day, totalCents: liveTracked };
      }
      index = { points, partsTracked, partsTotal: parts.length };
    }
  }

  return { offers, index };
}
