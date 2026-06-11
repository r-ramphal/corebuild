import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.azerty.nl";

export async function searchAzerty(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/zoeken/?q=${encodeURIComponent(query)}&sorteer=laagste-prijs`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Azerty HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  $("[class*='product'], .item, article").each((_, el) => {
    const name = $(el)
      .find("[class*='title'], [class*='name'], h2, h3")
      .first()
      .text()
      .trim();

    const priceText = $(el)
      .find("[class*='price']")
      .first()
      .text()
      .replace(/[^\d,]/g, "")
      .replace(",", ".");
    const price = parseFloat(priceText);

    const href = $(el).find("a").attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    const img = $(el).find("img").attr("src") ?? $(el).find("img").attr("data-src");

    const stockText = $(el).find("[class*='stock'], [class*='lever'], [class*='beschikbaar']").text().toLowerCase();
    const inStock =
      stockText.includes("op voorraad") ||
      stockText.includes("leverbaar") ||
      stockText.includes("beschikbaar");

    if (name && !isNaN(price) && price > 0) {
      results.push({ retailer: "azerty", name, priceEur: price, url: link, imageUrl: img, inStock });
    }
  });

  return results.slice(0, 10);
}
