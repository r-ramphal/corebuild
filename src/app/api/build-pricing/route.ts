import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getBuildPricingData, type BuildPart } from "@/lib/db/build-pricing";
import { optimizeSplitCart } from "@/lib/specs/split-cart";
import { summarizeBuildIndex } from "@/lib/specs/build-index";
import { RETAILER_SHIPPING, SHIPPING_NOTE } from "@/lib/retailers";
import { COMPONENT_TYPES } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

/**
 * "Slim Kopen": geeft voor de huidige build (a) de slimste verdeling over
 * winkels (split-cart, incl. geschatte verzendkosten) en (b) de build-prijsindex
 * (historisch laag/hoog + koop-nu/wacht-signaal). On-demand aangeroepen vanuit
 * de builder. Server-only (nodejs) omdat het de database raakt; POST omdat een
 * build meerdere lange retailer-urls meestuurt.
 */
export const runtime = "nodejs";

const MAX_PARTS = 8;
const MAX_NAME_LENGTH = 300;
const MAX_URL_LENGTH = 2000;

function isComponentType(v: unknown): v is ComponentType {
  return typeof v === "string" && (COMPONENT_TYPES as string[]).includes(v);
}

function safeUrl(u: unknown): string | null {
  if (typeof u !== "string" || u.length === 0 || u.length > MAX_URL_LENGTH) return null;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

/**
 * Valideer de client-side build naar veilige BuildParts (geen mock). `url` en
 * `priceEur` zijn optioneel: de builder stuurt ze mee (gekozen aanbieding), maar
 * de voorbeeldbuilds sturen alleen `slot` + `name` — die worden in de DB op naam
 * gematcht. Een ongeldige/ontbrekende url wordt "" (matching valt terug op de naam).
 */
function parseParts(raw: unknown): BuildPart[] {
  if (!Array.isArray(raw)) return [];
  const out: BuildPart[] = [];
  for (const item of raw.slice(0, MAX_PARTS)) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    if (v.mock === true) continue;
    if (!isComponentType(v.slot)) continue;
    const name = typeof v.name === "string" ? v.name.slice(0, MAX_NAME_LENGTH).trim() : "";
    if (!name) continue;
    const priceEur =
      typeof v.priceEur === "number" && isFinite(v.priceEur) && v.priceEur >= 0 && v.priceEur < 1_000_000
        ? v.priceEur
        : 0;
    out.push({
      slot: v.slot,
      category: v.slot,
      name,
      url: safeUrl(v.url) ?? "",
      retailer: typeof v.retailer === "string" ? v.retailer.slice(0, 40) : "onbekend",
      priceCents: Math.round(priceEur * 100),
    });
  }
  return out;
}

const EMPTY = { split: null, index: null, shippingNote: SHIPPING_NOTE };

export async function POST(req: NextRequest) {
  const db = getDb();
  if (!db) return NextResponse.json(EMPTY);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }

  const parts = parseParts((body as { parts?: unknown })?.parts);
  if (parts.length === 0) return NextResponse.json(EMPTY);

  try {
    const { offers, index } = await getBuildPricingData(db, parts);
    const split = optimizeSplitCart(offers, RETAILER_SHIPPING);
    const indexOut =
      index && { ...index, summary: summarizeBuildIndex(index.points) };

    return NextResponse.json(
      { split, index: indexOut, shippingNote: SHIPPING_NOTE },
      { headers: { "Cache-Control": "private, max-age=600" } }
    );
  } catch (err) {
    console.error("Build-pricing-lookup mislukt:", err);
    return NextResponse.json(EMPTY);
  }
}
