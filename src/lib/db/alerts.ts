import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./index";
import { priceAlerts, user, type PriceAlertRow } from "./schema";

export const MAX_ALERTS_PER_USER = 100;

/** Stabiele product-identiteit — spiegelt `watchId()` uit de volglijst-store. */
export function alertProductId(category: string, name: string): string {
  return `${category}::${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export async function listUserAlerts(db: Db, userId: string): Promise<PriceAlertRow[]> {
  return db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.userId, userId))
    .orderBy(desc(priceAlerts.createdAt));
}

export async function countUserAlerts(db: Db, userId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(priceAlerts)
    .where(eq(priceAlerts.userId, userId));
  return value;
}

export interface UpsertAlertInput {
  userId: string;
  productId: string;
  name: string;
  category: string;
  url: string;
  retailer: string;
  imageUrl?: string | null;
  targetCents: number;
  priceAtAddCents: number;
}

/** Maak of werk een alert bij (uniek per gebruiker+product). */
export async function upsertAlert(db: Db, input: UpsertAlertInput): Promise<PriceAlertRow> {
  const [row] = await db
    .insert(priceAlerts)
    .values({
      userId: input.userId,
      productId: input.productId,
      name: input.name,
      category: input.category,
      url: input.url,
      retailer: input.retailer,
      imageUrl: input.imageUrl ?? null,
      targetCents: input.targetCents,
      priceAtAddCents: input.priceAtAddCents,
    })
    .onConflictDoUpdate({
      target: [priceAlerts.userId, priceAlerts.productId],
      set: {
        name: input.name,
        url: input.url,
        retailer: input.retailer,
        imageUrl: input.imageUrl ?? null,
        targetCents: input.targetCents,
        priceAtAddCents: input.priceAtAddCents,
        // nieuwe drempel → anti-spam resetten zodat een nieuwe daling weer mailt
        lastNotifiedCents: null,
        lastNotifiedAt: null,
      },
    })
    .returning();
  return row;
}

export async function deleteAlert(db: Db, userId: string, productId: string): Promise<void> {
  await db
    .delete(priceAlerts)
    .where(and(eq(priceAlerts.userId, userId), eq(priceAlerts.productId, productId)));
}

export interface FiredAlert {
  alert: PriceAlertRow;
  currentCents: number;
  email: string;
}

/**
 * Bepaal welke alerts moeten afgaan: de laatste `price_history`-prijs voor de
 * gevolgde url ligt op/onder de drempel én lager dan de laatst gemailde prijs
 * (anti-spam). Geeft per afgaande alert het e-mailadres van de eigenaar terug.
 * Verstuurt zelf niets en muteert niets — dat doet de cron-route.
 */
export async function findFiredAlerts(db: Db): Promise<FiredAlert[]> {
  const alerts = await db.select().from(priceAlerts);
  if (alerts.length === 0) return [];

  const urls = [...new Set(alerts.map((a) => a.url))];
  const latest = await db.execute(sql`
    SELECT DISTINCT ON (url) url, price_cents
    FROM price_history
    WHERE url IN (${sql.join(urls.map((u) => sql`${u}`), sql`, `)})
    ORDER BY url, recorded_at DESC
  `);
  const priceByUrl = new Map<string, number>();
  for (const r of latest.rows as { url: string; price_cents: number }[]) {
    priceByUrl.set(r.url, Number(r.price_cents));
  }

  const candidates = alerts.filter((a) => {
    const cur = priceByUrl.get(a.url);
    if (cur == null) return false;
    if (cur > a.targetCents) return false;
    return a.lastNotifiedCents == null || cur < a.lastNotifiedCents;
  });
  if (candidates.length === 0) return [];

  const userIds = [...new Set(candidates.map((a) => a.userId))];
  const users = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return candidates
    .map((alert) => ({
      alert,
      currentCents: priceByUrl.get(alert.url)!,
      email: emailById.get(alert.userId) ?? "",
    }))
    .filter((f) => f.email);
}

/** Markeer een alert als gemaild op de gegeven prijs (anti-spam). */
export async function markAlertNotified(db: Db, alertId: number, cents: number): Promise<void> {
  await db
    .update(priceAlerts)
    .set({ lastNotifiedCents: cents, lastNotifiedAt: new Date() })
    .where(eq(priceAlerts.id, alertId));
}
