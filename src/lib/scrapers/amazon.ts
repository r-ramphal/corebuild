import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.amazon.nl";

export async function searchAmazon(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Amazon HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  $('[data-component-type="s-search-result"]').each((_, el) => {
    // Title
    const name = $(el).find("h2 .a-text-normal, h2 span").first().text().trim();

    // Price — the screen-reader span has the cleanest value, e.g. "€ 549,99"
    const priceText = $(el)
      .find(".a-price .a-offscreen")
      .first()
      .text()
      .replace(/[^\d,]/g, "")
      .replace(",", ".");
    const price = parseFloat(priceText);

    // Link — relative ASIN path
    const href = $(el).find("h2 a.a-link-normal").attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    // Image
    const img = $(el).find(".s-image").attr("src");

    if (name && !isNaN(price) && price > 0) {
      results.push({
        retailer: "amazon",
        name,
        priceEur: price,
        url: link,
        imageUrl: img,
        inStock: true, // if a price is shown, it's available
      });
    }
  });

  return results.slice(0, 10);
}
