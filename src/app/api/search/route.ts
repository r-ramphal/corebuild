import { NextRequest, NextResponse } from "next/server";
import { searchAmazon } from "@/lib/scrapers/amazon";
import { searchBol } from "@/lib/scrapers/bol";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import { searchMock } from "@/lib/mock/catalog";
import { getDb, normalizeQuery } from "@/lib/db";
import { getFreshListings, getCatalogListings, saveListings } from "@/lib/db/listings";
import { isJunk, matchesCategory, isComponentType } from "@/lib/relevance";
import { rankResults, filterByQueryModel } from "@/lib/search-rank";
import { cleanName } from "@/lib/clean-name";
import { COMPONENT_META } from "@/lib/categories";
import type { ComponentType, PriceResult, Retailer, SearchResults } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Database-first zoekflow:
 * 1. `cat` zonder `q` → catalogusmodus: alle verse rijen voor die categorie.
 * 2. Verse rijen in de database (< 30 min)? → direct teruggeven.
 * 3. Anders: live scrapen (Bol/Amazon met mock-fallback), resultaat
 *    teruggeven én opslaan in de database (write-through cache).
 *
 * Alle resultaten gaan door de relevantiefilter (`src/lib/relevance.ts`):
 * junk wordt altijd geweerd, en met `cat` blijven alleen producten over die
 * echt in die categorie thuishoren.
 */

const MAX_QUERY_LENGTH = 100;

/** Naïeve per-instance rate limit: beperkt scrape-fanout-misbruik. */
const RATE_LIMIT = 30; // requests per minuut per IP
const rateWindow = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateWindow.get(ip);
  if (!entry || entry.resetAt < now) {
    rateWindow.set(ip, { count: 1, resetAt: now + 60_000 });
    if (rateWindow.size > 10_000) rateWindow.clear(); // memory-guard
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/** Alleen http(s)-URL's doorlaten — scrape-bronnen zijn extern en onvertrouwd. */
function hasSafeUrl(item: PriceResult): boolean {
  try {
    const u = new URL(item.url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function applyRelevance(results: PriceResult[], cat: ComponentType | null): PriceResult[] {
  return results
    .map((r) => (r.mock ? r : { ...r, name: cleanName(r.name) }))
    .filter((r) => {
      if (!hasSafeUrl(r)) return false;
      if (cat) return r.mock ? true : matchesCategory(r.name, cat);
      return !isJunk(r.name);
    });
}

async function withMockFallback(
  retailer: Retailer,
  live: Promise<PriceResult[]>,
  query: string
): Promise<PriceResult[]> {
  try {
    const results = await live;
    if (results.length > 0) return results;
  } catch {
    // genegeerd — fallback hieronder
  }
  return searchMock(retailer, query);
}

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const rawCat = req.nextUrl.searchParams.get("cat");
  const cat = isComponentType(rawCat) ? rawCat : null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Te veel zoekopdrachten, probeer het zo weer" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (rawQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Zoekterm te lang" }, { status: 400 });
  }

  // Catalogusmodus: categorie browsen zonder zoekterm
  const db = getDb();
  if (!rawQuery && cat) {
    if (db) {
      try {
        // applyRelevance als extra vangnet: ook al staat de category-kolom goed,
        // we weren hier alsnog producten die niet (meer) bij de categorie passen.
        const catalog = applyRelevance(await getCatalogListings(db, cat), cat);
        if (catalog.length > 0) {
          const body: SearchResults = { query: "", results: catalog, errors: [] };
          return NextResponse.json(body, {
            headers: {
              "x-corebuild-source": "catalog",
              // Catalogus verandert hooguit elke 6 uur (scraper). Edge-cachen zodat
              // herhaald openen (builder-picker, categoriepagina) bijna instant is.
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
            },
          });
        }
      } catch (err) {
        console.error("Catalogus-lookup mislukt:", err);
      }
    }
    // Lege catalogus → val terug op de standaard-zoekterm van de categorie
  }

  const query = rawQuery || (cat ? COMPONENT_META[cat].searchTerm : "");
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Zoekterm te kort" }, { status: 400 });
  }

  const nq = normalizeQuery(query);

  // 1. Database-cache — alleen serveren als er échte data tussen zit;
  //    puur mock-rijen (bijv. uit de seed) mogen live scrapen niet blokkeren
  if (db) {
    try {
      const cached = applyRelevance(await getFreshListings(db, nq), cat);
      if (cached.length > 0 && cached.some((r) => !r.mock)) {
        // Bij een echte zoekterm: ander-model-resultaten weren (RTX 5070 ≠ 5070 Ti)
        // en op relevantie ordenen; anders prijs asc.
        const ordered = rawQuery
          ? rankResults(filterByQueryModel(cached, rawQuery), rawQuery)
          : [...cached].sort((a, b) => a.priceEur - b.priceEur);
        const body: SearchResults = { query, results: ordered, errors: [] };
        return NextResponse.json(body, {
          headers: {
            "x-corebuild-source": "database",
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=1800",
          },
        });
      }
    } catch (err) {
      console.error("DB-lookup mislukt, val terug op live scrape:", err);
    }
  }

  // 2. Live scrapen
  const [amazon, bol, megekko, azerty, alternate] = await Promise.allSettled([
    withMockFallback("amazon", searchAmazon(query), query),
    withMockFallback("bol", searchBol(query), query),
    searchMegekko(query),
    searchAzerty(query),
    searchAlternate(query),
  ]);

  const sources: { retailer: Retailer; outcome: PromiseSettledResult<PriceResult[]> }[] = [
    { retailer: "amazon", outcome: amazon },
    { retailer: "bol", outcome: bol },
    { retailer: "megekko", outcome: megekko },
    { retailer: "azerty", outcome: azerty },
    { retailer: "alternate", outcome: alternate },
  ];

  const filtered = applyRelevance(
    sources
      .filter((s): s is typeof s & { outcome: PromiseFulfilledResult<PriceResult[]> } =>
        s.outcome.status === "fulfilled"
      )
      .flatMap((s) => s.outcome.value),
    cat
  );
  // Bij een echte zoekterm: ander-model-resultaten weren + op relevantie ordenen;
  // anders (categorie-fallback) prijs asc.
  const results = rawQuery
    ? rankResults(filterByQueryModel(filtered, rawQuery), rawQuery)
    : filtered.sort((a, b) => a.priceEur - b.priceEur);

  const errors = sources
    .filter((s) => s.outcome.status === "rejected")
    .map((s) => {
      // De echte reden alleen server-side loggen; naar de client gaat een
      // generieke melding zodat interne details (URLs, stacktraces) niet lekken.
      console.error(
        `Zoeken bij ${s.retailer} mislukt:`,
        (s.outcome as PromiseRejectedResult).reason
      );
      return { retailer: s.retailer, message: "Tijdelijk niet beschikbaar" };
    });

  // 3. Write-through naar de database (best-effort, blokkeert het antwoord niet lang)
  if (db && results.length > 0) {
    try {
      await saveListings(db, nq, results, "scraper", cat ?? undefined);
    } catch (err) {
      console.error("DB-opslag mislukt:", err);
    }
  }

  const body: SearchResults = { query, results, errors };
  return NextResponse.json(body, {
    headers: {
      "x-corebuild-source": "live",
      "x-corebuild-db": db ? "on" : "off",
    },
  });
}
