import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time stringvergelijking. Beide kanten worden eerst naar een SHA-256
 * digest gehasht zodat de buffers altijd even lang zijn (timingSafeEqual eist
 * dat) én er geen lengte-informatie via een timing-side-channel lekt.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Verifieert de CRON_SECRET-Bearer op een cron-route. Geeft een foutrespons
 * terug als de secret ontbreekt (503) of de Authorization-header niet klopt
 * (401), en `null` wanneer de aanroep geautoriseerd is.
 *
 * De vergelijking is constant-time (i.p.v. `!==`) zodat het secret niet via een
 * timing-side-channel te raden valt — Vercel stuurt de header bij elke cron-run,
 * maar de routes zijn ook publiek aanroepbaar.
 */
export function checkCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET niet geconfigureerd" }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }
  return null;
}
