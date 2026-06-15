import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./index";
import { listings, priceAlerts, user, type PriceAlertRow } from "./schema";

export const MAX_ALERTS_PER_USER = 100;

/** Genormaliseerde productnaam (lowercase, enkele spaties). */
function normName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stabiele product-identiteit — spiegelt `watchId()` uit de volglijst-store. */
export function alertProductId(category: string, name: string): string {
  return `${category}::${normName(name)}`;
}

// ── Pure helpers voor de cross-retailer alert-check (apart testbaar) ──────────

/** Minimale lengte van de genormaliseerde naam om als zoeksleutel te dienen —
 *  korter is te generiek en zou andere producten kunnen matchen. */
const MIN_KEY_LEN = 6;

export interface AlertSiblingInput {
  url: string;
  category: string;
  name: string;
}
export interface SiblingListing {
  category: string | null;
  name: string;
  url: string;
}

/**
 * Alle aanbiedings-urls voor hetzelfde product, over álle retailers heen: de
 * gevolgde url zelf + elke listing in dezelfde categorie waarvan de naam de
 * (genormaliseerde) productnaam bevat. Zo vergelijkt de alert de laagste prijs
 * in de hele markt, niet alleen bij de oorspronkelijk gevolgde winkel.
 */
export function siblingUrls(alert: AlertSiblingInput, listingRows: SiblingListing[]): string[] {
  const urls = new Set<string>([alert.url]);
  const key = normName(alert.name);
  if (key.length < MIN_KEY_LEN) return [...urls];
  for (const l of listingRows) {
    if (l.category !== alert.category) continue;
    if (normName(l.name).includes(key)) urls.add(l.url);
  }
  return [...urls];
}

/** Laagste actuele prijs (+ bijbehorende url) over een set urls. */
export function lowestPrice(
  urls: string[],
  priceByUrl: Map<string, number>
): { cents: number; url: string } | null {
  let best: { cents: number; url: string } | null = null;
  for (const u of urls) {
    const c = priceByUrl.get(u);
    if (c == null) continue;
    if (best === null || c < best.cents) best = { cents: c, url: u };
  }
  return best;
}

/** Mag deze alert afgaan? Prijs op/onder de drempel én lager dan laatst gemaild. */
export function alertFires(
  targetCents: number,
  lastNotifiedCents: number | null,
  currentCents: number
): boolean {
  if (currentCents > targetCents) return false;
  return lastNotifiedCents == null || currentCents < lastNotifiedCents;
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
 * Bepaal welke alerts moeten afgaan. v2: vergelijkt de drempel met de **laagste
 * actuele prijs over álle retailers** voor het product (cross-retailer), niet
 * alleen de oorspronkelijk gevolgde url. Een alert gaat af als die laagste prijs
 * op/onder `targetCents` ligt én lager is dan de laatst gemailde prijs (anti-spam).
 * Geeft per afgaande alert het e-mailadres van de eigenaar terug. Verstuurt zelf
 * niets en muteert niets — dat doet de cron-route.
 */
export async function findFiredAlerts(db: Db): Promise<FiredAlert[]> {
  const alerts = await db.select().from(priceAlerts);
  if (alerts.length === 0) return [];

  // Kandidaat-listings (echte data, geen mock) in de betrokken categorieën →
  // hieruit leiden we per alert de zuster-urls over retailers af.
  const categories = [...new Set(alerts.map((a) => a.category))];
  const listingRows = await db
    .select({ category: listings.category, name: listings.name, url: listings.url })
    .from(listings)
    .where(and(inArray(listings.category, categories), eq(listings.mock, false)));

  const urlsByAlertId = new Map<number, string[]>();
  const allUrls = new Set<string>();
  for (const a of alerts) {
    const urls = siblingUrls(a, listingRows);
    urlsByAlertId.set(a.id, urls);
    for (const u of urls) allUrls.add(u);
  }
  if (allUrls.size === 0) return [];

  const urlList = [...allUrls];
  const latest = await db.execute(sql`
    SELECT DISTINCT ON (url) url, price_cents
    FROM price_history
    WHERE url IN (${sql.join(urlList.map((u) => sql`${u}`), sql`, `)})
    ORDER BY url, recorded_at DESC
  `);
  const priceByUrl = new Map<string, number>();
  for (const r of latest.rows as { url: string; price_cents: number }[]) {
    priceByUrl.set(r.url, Number(r.price_cents));
  }

  const candidates = alerts
    .map((alert) => {
      const low = lowestPrice(urlsByAlertId.get(alert.id) ?? [alert.url], priceByUrl);
      return low ? { alert, currentCents: low.cents } : null;
    })
    .filter((c): c is { alert: PriceAlertRow; currentCents: number } => c !== null)
    .filter((c) => alertFires(c.alert.targetCents, c.alert.lastNotifiedCents, c.currentCents));
  if (candidates.length === 0) return [];

  const userIds = [...new Set(candidates.map((c) => c.alert.userId))];
  const users = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return candidates
    .map((c) => ({
      alert: c.alert,
      currentCents: c.currentCents,
      email: emailById.get(c.alert.userId) ?? "",
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
