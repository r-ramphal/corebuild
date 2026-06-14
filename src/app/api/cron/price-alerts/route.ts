import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { findFiredAlerts, markAlertNotified, type FiredAlert } from "@/lib/db/alerts";
import { sendEmail } from "@/lib/email";
import { priceDropEmail, type PriceDropItem } from "@/lib/email-templates";
import { productUrl } from "@/lib/product-url";
import type { ComponentType } from "@/lib/types";

/**
 * Dagelijkse prijsalert-check (Vercel Cron, zie vercel.json). Vergelijkt de
 * laatste price_history-prijs met de drempel per alert en mailt de eigenaar
 * via Resend. Beveiligd met CRON_SECRET (Vercel stuurt die als Bearer mee).
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const BASE_URL = "https://corebuildnl.com";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET niet geconfigureerd" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  const fired = await findFiredAlerts(db);
  if (fired.length === 0) {
    return NextResponse.json({ fired: 0, sent: 0 });
  }

  // Groepeer per e-mailadres → één mail per gebruiker met al hun dalingen
  const byEmail = new Map<string, FiredAlert[]>();
  for (const f of fired) {
    const list = byEmail.get(f.email) ?? [];
    list.push(f);
    byEmail.set(f.email, list);
  }

  let sent = 0;
  for (const [email, items] of byEmail) {
    const dropItems: PriceDropItem[] = items.map((f) => ({
      name: f.alert.name,
      oldCents: f.alert.lastNotifiedCents ?? f.alert.priceAtAddCents,
      newCents: f.currentCents,
      productUrl:
        BASE_URL + productUrl({ name: f.alert.name }, f.alert.category as ComponentType),
    }));

    const ok = await sendEmail({
      to: email,
      subject:
        items.length === 1
          ? `Prijsdaling: ${items[0].alert.name}`
          : `${items.length} producten op je volglijst zijn goedkoper`,
      html: priceDropEmail(dropItems),
      text: dropItems
        .map((d) => `${d.name}: nu €${(d.newCents / 100).toFixed(2)} — ${d.productUrl}`)
        .join("\n"),
    });

    if (ok) {
      sent++;
      // Pas anti-spam bij na een geslaagde verzending
      for (const f of items) {
        await markAlertNotified(db, f.alert.id, f.currentCents);
      }
    }
  }

  return NextResponse.json({ fired: fired.length, sent });
}
