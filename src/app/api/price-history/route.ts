import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPriceHistory } from "@/lib/db/listings";

/**
 * Prijsverloop voor een product: de productpagina stuurt de aanbiedings-urls
 * die ze toont, wij geven de laagste prijs per dag terug (uit `price_history`).
 *
 * Server-only (nodejs) omdat het de database raakt. POST omdat een product
 * meerdere lange retailer-urls kan hebben — die passen niet netjes in een GET.
 */
export const runtime = "nodejs";

const MAX_URLS = 12;
const MAX_URL_LENGTH = 600;

/** Alleen http(s)-urls doorlaten — ze komen van onvertrouwde scrape-bronnen. */
function isSafeUrl(u: unknown): u is string {
  if (typeof u !== "string" || u.length === 0 || u.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const db = getDb();
  if (!db) return NextResponse.json({ points: [] });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }

  const rawUrls = (body as { urls?: unknown })?.urls;
  if (!Array.isArray(rawUrls)) {
    return NextResponse.json({ error: "urls ontbreekt" }, { status: 400 });
  }

  const urls = [...new Set(rawUrls.filter(isSafeUrl))].slice(0, MAX_URLS);
  if (urls.length === 0) return NextResponse.json({ points: [] });

  try {
    const points = await getPriceHistory(db, urls);
    return NextResponse.json(
      { points },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error("Prijshistorie-lookup mislukt:", err);
    return NextResponse.json({ points: [] });
  }
}
