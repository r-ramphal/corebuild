export type Retailer = "amazon" | "bol" | "megekko" | "azerty" | "alternate";

export type ComponentType =
  // Kerncomponenten — verschijnen als build-slot
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooling"
  // Randapparatuur — wel in de catalogus, niet in de build-slots
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headset"
  | "microphone"
  | "webcam"
  | "speaker"
  // Accessoires & extra's — browsbaar/vergelijkbaar, geen build-slot
  | "casefan"
  | "thermalpaste"
  | "soundcard"
  | "networkcard"
  | "capturecard"
  | "os"
  | "accessory";

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
