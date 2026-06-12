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
}

export interface SearchResults {
  query: string;
  results: PriceResult[];
  errors: { retailer: Retailer; message: string }[];
}
