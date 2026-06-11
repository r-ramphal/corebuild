import { NextRequest, NextResponse } from "next/server";
import { searchAmazon } from "@/lib/amazon";
import { searchMegekko } from "@/lib/scrapers/megekko";
import { searchAzerty } from "@/lib/scrapers/azerty";
import { searchAlternate } from "@/lib/scrapers/alternate";
import type { PriceResult, SearchResults } from "@/lib/types";
import type { Retailer } from "@/lib/types";

export const runtime = "nodejs";
// Max 60s — scrapers can be slow in parallel
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Zoekterm te kort" }, { status: 400 });
  }

  type SettledResult =
    | { retailer: Retailer; status: "fulfilled"; results: PriceResult[] }
    | { retailer: Retailer; status: "rejected"; reason: string };

  const [amazon, megekko, azerty, alternate] = await Promise.allSettled([
    searchAmazon(query),
    searchMegekko(query),
    searchAzerty(query),
    searchAlternate(query),
  ]);

  const settled: SettledResult[] = [
    { retailer: "amazon" as const, ...amazon },
    { retailer: "megekko" as const, ...megekko },
    { retailer: "azerty" as const, ...azerty },
    { retailer: "alternate" as const, ...alternate },
  ].map((s) =>
    s.status === "fulfilled"
      ? { retailer: s.retailer, status: "fulfilled" as const, results: s.value as PriceResult[] }
      : { retailer: s.retailer, status: "rejected" as const, reason: String((s as PromiseRejectedResult).reason) }
  );

  const results = settled
    .filter((s): s is Extract<SettledResult, { status: "fulfilled" }> => s.status === "fulfilled")
    .flatMap((s) => s.results)
    .sort((a, b) => a.priceEur - b.priceEur);

  const errors = settled
    .filter((s): s is Extract<SettledResult, { status: "rejected" }> => s.status === "rejected")
    .map((s) => ({ retailer: s.retailer, message: s.reason }));

  const body: SearchResults = { query, results, errors };
  return NextResponse.json(body);
}
