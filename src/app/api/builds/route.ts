import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { builds } from "@/lib/db/schema";

export const runtime = "nodejs";

function newPublicId(): string {
  return randomBytes(8).toString("base64url");
}

/** Lijst van eigen opgeslagen builds. */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const db = getDb()!;

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
  const db = getDb()!;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const components = body?.components;

  if (!name || !components || typeof components !== "object" || Object.keys(components).length === 0) {
    return NextResponse.json(
      { error: "Naam en minimaal één component vereist" },
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
