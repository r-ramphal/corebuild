import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCatalogListings } from "@/lib/db/listings";
import { matchesCategory } from "@/lib/relevance";
import { COMPONENT_TYPES } from "@/lib/categories";
import {
  generateBuild,
  type UseCase,
  type Resolution,
  type GenerateInput,
} from "@/lib/specs/generate";
import type { ComponentType, PriceResult } from "@/lib/types";

/**
 * "Smart generate": stelt uit echte catalogus-producten een compatibele build
 * samen voor een gebruiksprofiel + budget. Geen persoonlijke data.
 *
 * GET /api/generate?budget=1500&use=gaming&res=1440p
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const USE_CASES: UseCase[] = ["gaming", "creator", "office"];
const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4k"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const budget = Math.min(6000, Math.max(400, Number(sp.get("budget")) || 1200));
  const useCase = (USE_CASES.includes(sp.get("use") as UseCase) ? sp.get("use") : "gaming") as UseCase;
  const resolution = (RESOLUTIONS.includes(sp.get("res") as Resolution) ? sp.get("res") : "1440p") as Resolution;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { components: {}, notes: ["De catalogus is nu niet beschikbaar."], total: 0, overBudget: false },
      { status: 200 }
    );
  }

  // Catalogus-kandidaten per build-slot (echte, op voorraad zijnde producten).
  const candidates: GenerateInput["candidates"] = {};
  await Promise.all(
    COMPONENT_TYPES.map(async (slot: ComponentType) => {
      try {
        const rows = await getCatalogListings(db, slot);
        // Extra vangnet: alleen producten die echt in de categorie thuishoren.
        candidates[slot] = rows.filter((r: PriceResult) => matchesCategory(r.name, slot));
      } catch {
        candidates[slot] = [];
      }
    })
  );

  const result = generateBuild({ budget, useCase, resolution, candidates });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=1800" },
  });
}
