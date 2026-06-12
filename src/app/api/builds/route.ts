import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { builds } from "@/lib/db/schema";
import { COMPONENT_TYPES } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BUILDS_PER_USER = 100;
const MAX_NAME_LENGTH = 80;
const MAX_COMPONENT_NAME = 300;
const MAX_URL_LENGTH = 2000;

function newPublicId(): string {
  return randomBytes(8).toString("base64url");
}

/**
 * Valideer en normaliseer de client-side buildcomponenten: alleen bekende
 * slots, alleen verwachte velden, http(s)-URL's en begrensde waardes —
 * de body is onvertrouwde invoer die later weer aan andere bezoekers
 * getoond wordt (gedeelde builds).
 */
function sanitizeComponents(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const out: Record<string, unknown> = {};
  for (const [slot, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!COMPONENT_TYPES.includes(slot as ComponentType)) continue;
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;

    const name = typeof v.name === "string" ? v.name.slice(0, MAX_COMPONENT_NAME) : null;
    const priceEur =
      typeof v.priceEur === "number" && isFinite(v.priceEur) && v.priceEur >= 0 && v.priceEur < 1_000_000
        ? Math.round(v.priceEur * 100) / 100
        : null;
    const url = typeof v.url === "string" ? v.url.slice(0, MAX_URL_LENGTH) : "";
    let safeUrl: string | null = null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") safeUrl = url;
    } catch {
      safeUrl = null;
    }

    if (!name || priceEur === null || !safeUrl) continue;

    out[slot] = {
      retailer: typeof v.retailer === "string" ? v.retailer.slice(0, 40) : "onbekend",
      name,
      priceEur,
      url: safeUrl,
      imageUrl:
        typeof v.imageUrl === "string" && v.imageUrl.startsWith("https://")
          ? v.imageUrl.slice(0, MAX_URL_LENGTH)
          : undefined,
      inStock: v.inStock === true,
      mock: v.mock === true || undefined,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Lijst van eigen opgeslagen builds. */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  const rows = await db
    .select()
    .from(builds)
    .where(eq(builds.userId, session.user.id))
    .orderBy(desc(builds.updatedAt));

  return NextResponse.json({ builds: rows });
}

/** Sla de huidige build op. Body: { name: string, components: object } */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  const components = sanitizeComponents(body?.components);

  if (!name || !components) {
    return NextResponse.json(
      { error: "Naam en minimaal één geldig component vereist" },
      { status: 400 }
    );
  }

  const [{ value: buildCount }] = await db
    .select({ value: count() })
    .from(builds)
    .where(eq(builds.userId, session.user.id));
  if (buildCount >= MAX_BUILDS_PER_USER) {
    return NextResponse.json(
      { error: `Maximaal ${MAX_BUILDS_PER_USER} builds — verwijder er eerst een` },
      { status: 400 }
    );
  }

  const [row] = await db
    .insert(builds)
    .values({
      publicId: newPublicId(),
      userId: session.user.id,
      name,
      components,
    })
    .returning();

  return NextResponse.json({ build: row }, { status: 201 });
}
