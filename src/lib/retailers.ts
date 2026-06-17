import type { Retailer } from "@/lib/types";

/**
 * Verzendkosten per retailer (in centen), voor de "slimste verdeling" (split-cart)
 * zodat het totaal eerlijk is: een besparing door spreiden mag niet verdampen door
 * vier keer verzendkosten.
 *
 * Tarieven voor een standaard NL-pakket (<10kg), geverifieerd juni 2026 tegen de
 * bezorgpagina's van de retailers. Ze kunnen per actie, lidmaatschap (bol Select /
 * Amazon Prime) of bezorgmethode verschillen, en zware/grote items (kast, monitor)
 * kunnen meer kosten. Aanpassen = één regel hieronder.
 */
export interface ShippingRule {
  /** Gratis verzending vanaf dit bedrag (in centen). */
  freeFrom: number;
  /** Anders dit vaste tarief (in centen). */
  fee: number;
}

/** Retailers zonder gratis-verzending-drempel rekenen altijd het vaste tarief. */
const NOOIT_GRATIS = Number.MAX_SAFE_INTEGER;

export const RETAILER_SHIPPING: Record<Retailer, ShippingRule> = {
  amazon: { freeFrom: 2000, fee: 299 }, // gratis v.a. €20 (door Amazon verzonden, niet-Prime), anders €2,99
  bol: { freeFrom: 2500, fee: 299 }, // gratis v.a. €25, anders €2,99
  megekko: { freeFrom: 5000, fee: 395 }, // gratis v.a. €50, anders €3,95
  azerty: { freeFrom: NOOIT_GRATIS, fee: 595 }, // geen drempel: altijd €5,95
  alternate: { freeFrom: NOOIT_GRATIS, fee: 495 }, // geen drempel: altijd €4,95
};

export const SHIPPING_NOTE =
  "Verzendkosten zijn een schatting en kunnen per winkel of actie verschillen.";
