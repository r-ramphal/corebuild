import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  alertProductId,
  countUserAlerts,
  deleteAlert,
  listUserAlerts,
  upsertAlert,
  MAX_ALERTS_PER_USER,
} from "@/lib/db/alerts";
import { COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

export const runtime = "nodejs";

const MAX_NAME = 300;
const MAX_URL = 2000;

function safeHttpUrl(u: unknown): u is string {
  if (typeof u !== "string" || u.length === 0 || u.length > MAX_URL) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

/** Lijst van eigen prijsalerts. */
export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  const alerts = await listUserAlerts(db, session.user.id);
  return NextResponse.json({ alerts });
}

/** Zet (of werk) een prijsalert. Body: { name, category, url, retailer, priceEur, targetEur?, imageUrl? } */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, MAX_NAME) : "";
  const category = body?.category as ComponentType;
  const retailer = typeof body?.retailer === "string" ? body.retailer.slice(0, 40) : "";
  const priceEur =
    typeof body?.priceEur === "number" && isFinite(body.priceEur) && body.priceEur > 0 && body.priceEur < 1_000_000
      ? body.priceEur
      : null;
  const targetEur =
    typeof body?.targetEur === "number" && isFinite(body.targetEur) && body.targetEur > 0 && body.targetEur < 1_000_000
      ? body.targetEur
      : null;
  const imageUrl =
    typeof body?.imageUrl === "string" && body.imageUrl.startsWith("https://")
      ? body.imageUrl.slice(0, MAX_URL)
      : null;

  if (!name || !COMPONENT_META[category] || !retailer || priceEur === null || !safeHttpUrl(body?.url)) {
    return NextResponse.json({ error: "Ongeldige alert-gegevens" }, { status: 400 });
  }

  const productId = alertProductId(category, name);
  const priceAtAddCents = Math.round(priceEur * 100);
  // Standaard: mail bij élke daling onder de huidige prijs
  const targetCents = targetEur !== null ? Math.round(targetEur * 100) : priceAtAddCents;

  // Limiet alleen afdwingen voor een nieuw product (upsert van bestaand mag altijd)
  const existing = await listUserAlerts(db, session.user.id);
  const isNew = !existing.some((a) => a.productId === productId);
  if (isNew && (await countUserAlerts(db, session.user.id)) >= MAX_ALERTS_PER_USER) {
    return NextResponse.json(
      { error: `Maximaal ${MAX_ALERTS_PER_USER} alerts — verwijder er eerst een` },
      { status: 400 }
    );
  }

  const alert = await upsertAlert(db, {
    userId: session.user.id,
    productId,
    name,
    category,
    url: body.url,
    retailer,
    imageUrl,
    targetCents,
    priceAtAddCents,
  });

  return NextResponse.json({ alert }, { status: 201 });
}

/** Verwijder een alert. Query: ?productId=... */
export async function DELETE(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId ontbreekt" }, { status: 400 });

  await deleteAlert(db, session.user.id, productId);
  return NextResponse.json({ ok: true });
}
