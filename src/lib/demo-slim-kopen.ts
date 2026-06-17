import { getDb } from "@/lib/db";
import { getBuildPricingData, type BuildPart } from "@/lib/db/build-pricing";
import { optimizeSplitCart } from "@/lib/specs/split-cart";
import { RETAILER_SHIPPING } from "@/lib/retailers";
import { getExampleBuild } from "@/lib/example-builds";

/** Live "Slim Kopen"-cijfers voor de homepage-sectie (server-side berekend). */
export interface DemoSlimKopen {
  singleTotalCents: number;
  singleRetailer: string;
  splitTotalCents: number;
  splitStores: number;
  savingCents: number;
  covered: number;
  partsTotal: number;
}

/** De build die de homepage-sectie als voorbeeld toont. */
const DEMO_SLUG = "1440p-gamer";

/**
 * Berekent de actuele split-cart voor de demo-build, zodat de homepage echte
 * cijfers toont i.p.v. een statisch voorbeeld. Dezelfde pipeline als
 * `/api/build-pricing`: catalogus-aanbiedingen → `optimizeSplitCart`.
 *
 * Geeft `null` terug (→ statische fallback in de sectie) als er geen DB is, de
 * berekening faalt (bv. tijdens de CI-build met een placeholder-DB), of het
 * resultaat niet overtuigend/compleet genoeg is om te tonen.
 */
export async function getDemoSlimKopen(): Promise<DemoSlimKopen | null> {
  const db = getDb();
  if (!db) return null;
  const build = getExampleBuild(DEMO_SLUG);
  if (!build) return null;

  const parts: BuildPart[] = build.parts.map((p) => ({
    slot: p.type,
    category: p.type,
    name: p.name,
    url: "",
    retailer: "onbekend",
    priceCents: 0,
  }));

  try {
    const { offers } = await getBuildPricingData(db, parts);
    const split = optimizeSplitCart(offers, RETAILER_SHIPPING);

    // Alleen tonen als het eerlijk overtuigend is: genoeg gedekte onderdelen,
    // een echte één-winkel-vergelijking, en spreiden is daadwerkelijk goedkoper.
    if (
      split.covered < 5 ||
      !split.singleStore ||
      split.savingsCents == null ||
      split.savingsCents <= 0
    ) {
      return null;
    }

    return {
      singleTotalCents: split.singleStore.totalCents,
      singleRetailer: split.singleStore.retailer,
      splitTotalCents: split.split.totalCents,
      splitStores: split.split.groups.length,
      savingCents: split.savingsCents,
      covered: split.covered,
      partsTotal: split.partsTotal,
    };
  } catch (err) {
    console.error("Demo Slim Kopen-berekening mislukt:", err);
    return null;
  }
}
