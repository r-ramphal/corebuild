import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { builds } from "@/lib/db/schema";
import { setBuildAlert } from "@/lib/db/build-alerts";

export const runtime = "nodejs";

const MAX_TARGET_EUR = 1_000_000;

interface Params {
  params: Promise<{ publicId: string }>;
}

/** Publieke lookup — voor gedeelde builds (/build/[publicId]). */
export async function GET(_req: NextRequest, { params }: Params) {
  const { publicId } = await params;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  const [row] = await db.select().from(builds).where(eq(builds.publicId, publicId));
  if (!row) {
    return NextResponse.json({ error: "Build niet gevonden" }, { status: 404 });
  }

  // Geen userId teruggeven op een publieke route
  return NextResponse.json({
    build: {
      id: row.id,
      publicId: row.publicId,
      name: row.name,
      components: row.components,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
}

/**
 * Werk een eigen build bij. Body kan bevatten:
 * - `published` (boolean) — publiceren/verbergen in de community.
 * - `alertTargetEur` (number >= 0, of null) — prijsalert zetten/wissen (mail zodra
 *   de actuele laagste totaalprijs op/onder deze drempel komt).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const { publicId } = await params;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const hasPublished = typeof body?.published === "boolean";
  const hasAlert = body != null && "alertTargetEur" in body;
  if (!hasPublished && !hasAlert) {
    return NextResponse.json(
      { error: "published (boolean) of alertTargetEur (number|null) vereist" },
      { status: 400 }
    );
  }

  if (hasAlert) {
    const raw = (body as { alertTargetEur?: unknown }).alertTargetEur;
    let targetCents: number | null;
    if (raw === null) {
      targetCents = null;
    } else if (typeof raw === "number" && isFinite(raw) && raw > 0 && raw < MAX_TARGET_EUR) {
      targetCents = Math.round(raw * 100);
    } else {
      return NextResponse.json(
        { error: "alertTargetEur moet een positief bedrag of null zijn" },
        { status: 400 }
      );
    }
    const updated = await setBuildAlert(db, publicId, session.user.id, targetCents);
    if (updated.length === 0) {
      return NextResponse.json({ error: "Build niet gevonden" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, alertTargetCents: updated[0].alertTargetCents });
  }

  const updated = await db
    .update(builds)
    .set({ published: (body as { published: boolean }).published, updatedAt: new Date() })
    .where(and(eq(builds.publicId, publicId), eq(builds.userId, session.user.id)))
    .returning({ id: builds.id, published: builds.published });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Build niet gevonden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, published: updated[0].published });
}

/** Verwijder een eigen build. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const { publicId } = await params;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });
  }

  const deleted = await db
    .delete(builds)
    .where(and(eq(builds.publicId, publicId), eq(builds.userId, session.user.id)))
    .returning({ id: builds.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Build niet gevonden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
