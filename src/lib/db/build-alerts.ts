import { and, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "./index";
import { builds, user, type BuildRow } from "./schema";
import { getBuildPricingData, type BuildPart } from "./build-pricing";
import { alertFires } from "./alerts";
import { optimizeSplitCart } from "@/lib/specs/split-cart";
import { RETAILER_SHIPPING } from "@/lib/retailers";
import { COMPONENT_TYPES } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

/**
 * Zet een build-component-snapshot (jsonb in `builds.components`) om in BuildParts
 * voor de prijsberekening. Alleen build-slots met een échte (niet-mock) aanbieding
 * met een link tellen mee. Puur — los testbaar.
 */
export function partsFromComponents(components: unknown): BuildPart[] {
  if (!components || typeof components !== "object" || Array.isArray(components)) return [];
  const out: BuildPart[] = [];
  for (const [slot, value] of Object.entries(components as Record<string, unknown>)) {
    if (!(COMPONENT_TYPES as string[]).includes(slot)) continue;
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    if (v.mock === true) continue;
    const name = typeof v.name === "string" ? v.name : "";
    const url = typeof v.url === "string" ? v.url : "";
    const priceEur = typeof v.priceEur === "number" && isFinite(v.priceEur) ? v.priceEur : 0;
    if (!name || !url) continue;
    out.push({
      slot: slot as ComponentType,
      category: slot as ComponentType,
      name,
      url,
      retailer: typeof v.retailer === "string" ? v.retailer : "onbekend",
      priceCents: Math.round(priceEur * 100),
    });
  }
  return out;
}

/**
 * Actuele goedkoopste totaalprijs van een build (som van de goedkoopste aanbieding
 * per onderdeel, excl. verzending) — dezelfde basis als de "Nu" op de prijsindex en
 * de split-onderdeelprijs. Null als er geen live prijsdata is.
 */
export async function currentBuildTotalCents(db: Db, components: unknown): Promise<number | null> {
  const parts = partsFromComponents(components);
  if (parts.length === 0) return null;
  const { offers } = await getBuildPricingData(db, parts);
  const split = optimizeSplitCart(offers, RETAILER_SHIPPING);
  return split.covered > 0 ? split.split.itemsCents : null;
}

/** Zet of wis de prijsalert van een eigen build; reset de anti-spam bij wijziging. */
export async function setBuildAlert(
  db: Db,
  publicId: string,
  userId: string,
  targetCents: number | null
): Promise<{ id: number; alertTargetCents: number | null }[]> {
  return db
    .update(builds)
    .set({
      alertTargetCents: targetCents,
      alertLastNotifiedCents: null,
      alertLastNotifiedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(builds.publicId, publicId), eq(builds.userId, userId)))
    .returning({ id: builds.id, alertTargetCents: builds.alertTargetCents });
}

export interface FiredBuildAlert {
  build: BuildRow;
  currentCents: number;
  email: string;
}

/**
 * Bepaal welke build-alerts moeten afgaan: de actuele laagste totaalprijs ligt
 * op/onder de drempel én lager dan de laatst gemailde prijs (anti-spam, hergebruikt
 * `alertFires`). Verstuurt zelf niets en muteert niets — dat doet de cron-route.
 */
export async function findFiredBuildAlerts(db: Db): Promise<FiredBuildAlert[]> {
  const rows = await db.select().from(builds).where(isNotNull(builds.alertTargetCents));
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const users = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const fired: FiredBuildAlert[] = [];
  for (const b of rows) {
    const current = await currentBuildTotalCents(db, b.components);
    if (current == null) continue;
    if (!alertFires(b.alertTargetCents!, b.alertLastNotifiedCents, current)) continue;
    const email = emailById.get(b.userId);
    if (!email) continue;
    fired.push({ build: b, currentCents: current, email });
  }
  return fired;
}

/** Markeer een build-alert als gemaild op de gegeven prijs (anti-spam). */
export async function markBuildAlertNotified(db: Db, id: number, cents: number): Promise<void> {
  await db
    .update(builds)
    .set({ alertLastNotifiedCents: cents, alertLastNotifiedAt: new Date() })
    .where(eq(builds.id, id));
}
