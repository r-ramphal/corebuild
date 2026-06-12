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
  const { userId: _userId, ...publicBuild } = row;
  return NextResponse.json({ build: publicBuild });
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
