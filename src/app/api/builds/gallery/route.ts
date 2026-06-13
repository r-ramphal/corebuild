import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { builds } from "@/lib/db/schema";

export const runtime = "nodejs";

const GALLERY_LIMIT = 60;

/**
 * Publieke buildgalerij: alle builds die hun eigenaar opt-in heeft gepubliceerd.
 * Geen userId of andere persoonsgegevens — alleen naam + componenten + datum.
 */
export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  try {
    const rows = await db
      .select({
        id: builds.id,
        publicId: builds.publicId,
        name: builds.name,
        components: builds.components,
        createdAt: builds.createdAt,
        updatedAt: builds.updatedAt,
      })
      .from(builds)
      .where(eq(builds.published, true))
      .orderBy(desc(builds.updatedAt))
      .limit(GALLERY_LIMIT);

    return NextResponse.json(
      { builds: rows },
      { headers: { "Cache-Control": "public, max-age=120" } }
    );
  } catch (err) {
    console.error("Galerij-lookup mislukt:", err);
    return NextResponse.json({ error: "Galerij tijdelijk niet beschikbaar" }, { status: 503 });
  }
}
