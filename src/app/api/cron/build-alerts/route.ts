import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  findFiredBuildAlerts,
  markBuildAlertNotified,
  type FiredBuildAlert,
} from "@/lib/db/build-alerts";
import { sendEmail } from "@/lib/email";
import { buildPriceDropEmail, type BuildDropItem } from "@/lib/email-templates";

/**
 * Periodieke build-prijsalert-check (Vercel Cron, zie vercel.json). Per build met
 * een ingestelde drempel herberekent 'ie de actuele laagste totaalprijs (zelfde
 * bron als de "Slim Kopen"-index) en mailt de eigenaar via Resend zodra die op/onder
 * de drempel komt. Beveiligd met CRON_SECRET. Anti-spam via markBuildAlertNotified,
 * dus veilig om vaker te draaien (geen dubbele mails).
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

  const fired = await findFiredBuildAlerts(db);
  if (fired.length === 0) {
    return NextResponse.json({ fired: 0, sent: 0 });
  }

  // Eén mail per gebruiker met al hun gedaalde builds.
  const byEmail = new Map<string, FiredBuildAlert[]>();
  for (const f of fired) {
    const list = byEmail.get(f.email) ?? [];
    list.push(f);
    byEmail.set(f.email, list);
  }

  let sent = 0;
  for (const [email, items] of byEmail) {
    const dropItems: BuildDropItem[] = items.map((f) => ({
      name: f.build.name,
      oldCents: f.build.alertLastNotifiedCents ?? f.build.alertTargetCents!,
      newCents: f.currentCents,
      targetCents: f.build.alertTargetCents!,
      buildUrl: `${BASE_URL}/build/${f.build.publicId}`,
    }));

    const ok = await sendEmail({
      to: email,
      subject:
        items.length === 1
          ? `Je build "${items[0].build.name}" is goedkoper`
          : `${items.length} van je builds zijn goedkoper`,
      html: buildPriceDropEmail(dropItems),
      text: dropItems
        .map((d) => `${d.name}: nu €${(d.newCents / 100).toFixed(2)} — ${d.buildUrl}`)
        .join("\n"),
    });

    if (ok) {
      sent++;
      for (const f of items) {
        await markBuildAlertNotified(db, f.build.id, f.currentCents);
      }
    }
  }

  return NextResponse.json({ fired: fired.length, sent });
}
