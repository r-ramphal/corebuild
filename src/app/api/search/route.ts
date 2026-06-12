import { NextRequest, NextResponse } from "next/server";
import { searchAmazon } from "@/lib/scrapers/amazon";
import { searchBol } from "@/lib/scrapers/bol";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import type { PriceResult, Retailer, SearchResults } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Zoekterm te kort" }, { status: 400 });
  }

  const [amazon, bol, megekko, azerty, alternate] = await Promise.allSettled([
    searchAmazon(query),
    searchBol(query),
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
