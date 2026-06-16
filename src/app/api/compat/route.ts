import { NextRequest, NextResponse } from "next/server";
import { gpuLength, matchCase, matchCooler } from "@/lib/specs/dimensions";
import type { CompatData } from "@/lib/specs/compat-types";

/**
 * Geeft de fysieke maten terug die bij de namen in de huidige build horen
 * (videokaartlengte-range, behuizing-clearances, koeler-hoogte/socket). De
 * builder vraagt dit op en laat analyzeBuild() er de verdicten uit afleiden.
 *
 * Server-only omdat de dimensie-datasets (~1 MB) niet in de client-bundle mogen.
 */
export const runtime = "nodejs";

const MAX_NAME = 200;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const gpuName = (sp.get("gpu") ?? "").slice(0, MAX_NAME).trim();
  const caseName = (sp.get("case") ?? "").slice(0, MAX_NAME).trim();
  const coolerName = (sp.get("cooler") ?? "").slice(0, MAX_NAME).trim();

  const body: CompatData = {
    gpu: gpuName ? gpuLength(gpuName) : null,
    case: caseName ? matchCase(caseName) : null,
    cooler: coolerName ? matchCooler(coolerName) : null,
  };

  return NextResponse.json(body, {
    // Maten veranderen niet (functie van de namen + statische datasets); cache
    // mag lang staan. Ook op de CDN (s-maxage) zodat herhaalde builder-checks
    // niet steeds de server raken.
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
