import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.alternate.nl";

export async function searchAlternate(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/listing.xhtml?q=${encodeURIComponent(query)}&s=price_asc`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Alternate HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  // Elke product-card is zelf een <a class="productBox">
  $("a.productBox").each((_, el) => {
    const name = $(el).find(".product-name").first().text().replace(/\s+/g, " ").trim();

    const href = $(el).attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    // span.price is de actuele prijs; doorgestreepte prijzen hebben geen .price-class
    const priceText = $(el)
      .find("span.price")
      .first()
      .text()
      .replace(/[^\d,]/g, "")
      .replace(",", ".");
    const price = parseFloat(priceText);

    const imgSrc = $(el).find("img.productPicture").first().attr("src");
    const img = imgSrc
      ? imgSrc.startsWith("http")
        ? imgSrc
        : `${BASE}${imgSrc}`
      : undefined;

    const delivery = $(el).find(".delivery-info").text().toLowerCase();
    const inStock = delivery.includes("op voorraad");

    if (name && !isNaN(price) && price > 0) {
      results.push({ retailer: "alternate", name, priceEur: price, url: link, imageUrl: img, inStock });
    }
  });

  return results.slice(0, 10);
}
