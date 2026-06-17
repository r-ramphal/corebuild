import type { Retailer } from "@/lib/types";

/**
 * Geschatte verzendkosten per retailer (in centen). Gebruikt door de
 * "slimste verdeling" (split-cart) om een eerlijk totaal te tonen: een
 * besparing door spreiden mag niet verdampen door vier keer verzendkosten.
 *
 * Let op: dit zijn schattingen op basis van publieke standaardtarieven en ze
 * kunnen per winkel, actie of bezorgmethode verschillen. Bewust conservatief
 * (eerder iets te hoog dan te laag), zodat we geen besparing beloven die er
 * niet is. Aanpassen = één regel hieronder.
 */
export interface ShippingRule {
  /** Gratis verzending vanaf dit bedrag (in centen). */
  freeFrom: number;
  /** Anders dit vaste tarief (in centen). */
  fee: number;
}

export const RETAILER_SHIPPING: Record<Retailer, ShippingRule> = {
  amazon: { freeFrom: 2000, fee: 199 }, // amazon.nl: gratis vanaf ~€20
  bol: { freeFrom: 2000, fee: 199 }, // bol.com: gratis vanaf ~€20 (Select)
  megekko: { freeFrom: 7500, fee: 595 },
  azerty: { freeFrom: 2000, fee: 495 },
  alternate: { freeFrom: 9900, fee: 590 },
};

export const SHIPPING_NOTE =
  "Verzendkosten zijn een schatting en kunnen per winkel of actie verschillen.";
