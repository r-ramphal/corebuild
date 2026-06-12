import { NextRequest, NextResponse } from "next/server";
import { searchAmazon } from "@/lib/scrapers/amazon";
import { searchBol } from "@/lib/scrapers/bol";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import { searchMock } from "@/lib/mock/catalog";
import { getDb, normalizeQuery } from "@/lib/db";
import { getFreshListings, saveListings } from "@/lib/db/listings";
import type { PriceResult, Retailer, SearchResults } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Database-first zoekflow:
 * 1. Verse rijen in de database (< 30 min)? → direct teruggeven.
 * 2. Anders: live scrapen (Bol/Amazon met mock-fallback), resultaat
 *    teruggeven én opslaan in de database (write-through cache).
 * Zonder DATABASE_URL werkt alles zoals voorheen, puur live.
 */

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
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Zoekterm te kort" }, { status: 400 });
  }

  const db = getDb();
  const nq = normalizeQuery(query);

  // 1. Database-cache — alleen serveren als er échte data tussen zit;
  //    puur mock-rijen (bijv. uit de seed) mogen live scrapen niet blokkeren
  if (db) {
    try {
      const cached = await getFreshListings(db, nq);
      if (cached.length > 0 && cached.some((r) => !r.mock)) {
        const body: SearchResults = { query, results: cached, errors: [] };
        return NextResponse.json(body, {
          headers: { "x-corebuild-source": "database" },
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

  const results = sources
    .filter((s): s is typeof s & { outcome: PromiseFulfilledResult<PriceResult[]> } =>
      s.outcome.status === "fulfilled"
    )
    .flatMap((s) => s.outcome.value)
    .sort((a, b) => a.priceEur - b.priceEur);

  const errors = sources
    .filter((s) => s.outcome.status === "rejected")
    .map((s) => ({
      retailer: s.retailer,
      message: String((s.outcome as PromiseRejectedResult).reason),
    }));

  // 3. Write-through naar de database (best-effort, blokkeert het antwoord niet lang)
  if (db && results.length > 0) {
    try {
      await saveListings(db, nq, results);
    } catch (err) {
      console.error("DB-opslag mislukt:", err);
    }
  }

  const body: SearchResults = { query, results, errors };
  return NextResponse.json(body, {
    headers: { "x-corebuild-source": "live" },
  });
}
