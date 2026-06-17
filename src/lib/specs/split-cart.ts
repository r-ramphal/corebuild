/**
 * Split-cart-optimizer (puur, geen DB/netwerk → los testbaar).
 *
 * Een PC-build koop je zelden in één winkel: de goedkoopste CPU staat bij de
 * ene retailer, de GPU bij de andere. Deze module bepaalt per onderdeel de
 * goedkoopste (op voorraad) aanbieding, groepeert die per winkel en rekent
 * geschatte verzendkosten mee. Daarnaast bepaalt 'ie het goedkoopste
 * "alles bij één winkel"-alternatief, zodat we eerlijk de echte besparing
 * van spreiden kunnen tonen (incl. verzendkosten — anders is het misleidend).
 */

export interface Offer {
  retailer: string;
  url: string;
  priceCents: number;
  inStock: boolean;
}

export interface PartOffers {
  slot: string;
  name: string;
  /** Eén aanbieding per retailer (de goedkoopste op voorraad voor dit onderdeel). */
  offers: Offer[];
}

export interface ShippingRule {
  freeFrom: number;
  fee: number;
}
export type ShippingConfig = Record<string, ShippingRule>;

export interface SplitItem {
  slot: string;
  retailer: string;
  url: string;
  priceCents: number;
  inStock: boolean;
}
export interface SplitGroup {
  retailer: string;
  items: SplitItem[];
  subtotalCents: number;
  shippingCents: number;
}
export interface SingleStore {
  retailer: string;
  itemsCents: number;
  shippingCents: number;
  totalCents: number;
}
export interface SplitResult {
  partsTotal: number;
  /** Onderdelen waarvoor we live prijsdata hebben. */
  covered: number;
  /** Slots zonder enige aanbieding (niet meegerekend in de totalen). */
  uncovered: string[];
  split: {
    groups: SplitGroup[];
    itemsCents: number;
    shippingCents: number;
    totalCents: number;
  };
  /** Goedkoopste winkel die álle gedekte onderdelen voert, of null. */
  singleStore: SingleStore | null;
  /** singleStore.total − split.total (positief = spreiden is goedkoper). */
  savingsCents: number | null;
  bestStrategy: "split" | "single";
}

function shippingFor(cfg: ShippingConfig, retailer: string, subtotalCents: number): number {
  const rule = cfg[retailer];
  if (!rule) return 0;
  return subtotalCents >= rule.freeFrom ? 0 : rule.fee;
}

/** Goedkoopste aanbieding: op voorraad heeft voorrang, dan prijs. */
export function cheapestOffer(offers: Offer[]): Offer | null {
  if (offers.length === 0) return null;
  const inStock = offers.filter((o) => o.inStock);
  const pool = inStock.length > 0 ? inStock : offers;
  return pool.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
}

export function optimizeSplitCart(parts: PartOffers[], cfg: ShippingConfig): SplitResult {
  const covered = parts.filter((p) => p.offers.length > 0);
  const uncovered = parts.filter((p) => p.offers.length === 0).map((p) => p.slot);

  // ── Slim verdeeld: per onderdeel de goedkoopste aanbieding, gegroepeerd per winkel
  const groupMap = new Map<string, SplitItem[]>();
  for (const part of covered) {
    const off = cheapestOffer(part.offers)!;
    const item: SplitItem = {
      slot: part.slot,
      retailer: off.retailer,
      url: off.url,
      priceCents: off.priceCents,
      inStock: off.inStock,
    };
    const arr = groupMap.get(off.retailer) ?? [];
    arr.push(item);
    groupMap.set(off.retailer, arr);
  }
  const groups: SplitGroup[] = [...groupMap.entries()]
    .map(([retailer, items]) => {
      const subtotalCents = items.reduce((s, i) => s + i.priceCents, 0);
      return { retailer, items, subtotalCents, shippingCents: shippingFor(cfg, retailer, subtotalCents) };
    })
    .sort((a, b) => b.subtotalCents - a.subtotalCents);
  const splitItems = groups.reduce((s, g) => s + g.subtotalCents, 0);
  const splitShip = groups.reduce((s, g) => s + g.shippingCents, 0);
  const splitTotal = splitItems + splitShip;

  // ── Alles bij één winkel: alleen winkels die élk gedekt onderdeel voeren
  const retailers = [...new Set(covered.flatMap((p) => p.offers.map((o) => o.retailer)))];
  let single: SingleStore | null = null;
  for (const r of retailers) {
    let itemsCents = 0;
    let carriesAll = true;
    for (const part of covered) {
      const ofRetailer = part.offers.filter((o) => o.retailer === r);
      if (ofRetailer.length === 0) {
        carriesAll = false;
        break;
      }
      itemsCents += cheapestOffer(ofRetailer)!.priceCents;
    }
    if (!carriesAll) continue;
    const shippingCents = shippingFor(cfg, r, itemsCents);
    const totalCents = itemsCents + shippingCents;
    if (single === null || totalCents < single.totalCents) {
      single = { retailer: r, itemsCents, shippingCents, totalCents };
    }
  }

  const savingsCents = single ? single.totalCents - splitTotal : null;
  const bestStrategy = single && single.totalCents <= splitTotal ? "single" : "split";

  return {
    partsTotal: parts.length,
    covered: covered.length,
    uncovered,
    split: { groups, itemsCents: splitItems, shippingCents: splitShip, totalCents: splitTotal },
    singleStore: single,
    savingsCents,
    bestStrategy,
  };
}
