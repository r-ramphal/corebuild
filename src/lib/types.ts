export type Retailer = "amazon" | "bol" | "megekko" | "azerty" | "alternate";

export type ComponentType =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooling";

export interface PriceResult {
  retailer: Retailer;
  name: string;
  priceEur: number;
  url: string;
  imageUrl?: string;
  inStock: boolean;
  asin?: string;
  /** True wanneer dit demo-data is (retailer-API nog niet beschikbaar) */
  mock?: boolean;
}

export interface SearchResults {
  query: string;
  results: PriceResult[];
  errors: { retailer: Retailer; message: string }[];
}
