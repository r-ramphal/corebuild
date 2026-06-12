import { NextRequest, NextResponse } from "next/server";
import { searchAmazon } from "@/lib/scrapers/amazon";
import { searchBol } from "@/lib/scrapers/bol";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import { searchMock } from "@/lib/mock/catalog";
import type { PriceResult, Retailer, SearchResults } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Bol en Amazon blokkeren scrapers vanaf datacenter-IP's. Tot de officiële
 * API's beschikbaar zijn (KvK / 3 verkopen) proberen we live en vallen we
 * terug op demo-data uit de mock-catalogus.
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

  const body: SearchResults = { query, results, errors };
  return NextResponse.json(body);
}
