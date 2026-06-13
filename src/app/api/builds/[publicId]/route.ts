import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { builds } from "@/lib/db/schema";

export const runtime = "nodejs";

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

/** Publiceer of verberg een eigen build in de galerij. Body: { published: boolean } */
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
  if (typeof body?.published !== "boolean") {
    return NextResponse.json({ error: "published (boolean) vereist" }, { status: 400 });
  }

  const updated = await db
    .update(builds)
    .set({ published: body.published, updatedAt: new Date() })
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
