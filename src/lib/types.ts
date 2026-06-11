export type Retailer = "amazon" | "megekko" | "azerty" | "alternate";

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
