import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

// Let op: zonder www — www.azerty.nl redirect naar de homepage
const BASE = "https://azerty.nl";

export async function searchAzerty(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/catalogsearch/result/?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Azerty HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  $('form[id^="product_addtocart_form"]').each((_, el) => {
    const titleLink = $(el).find("a.product-item-link").first();
    const name = titleLink.text().trim();

    const href = titleLink.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    // Magento zet de exacte prijs in een data-attribuut
    const priceAttr =
      $(el).find('[data-price-type="finalPrice"][data-price-amount]').first().attr("data-price-amount") ??
      $(el).find("[data-price-amount]").first().attr("data-price-amount");
    const price = Math.round(parseFloat(priceAttr ?? "") * 100) / 100;

    const img = $(el).find("img.product-image-photo").first().attr("src");

    const delivery = $(el).find(".product-delivery-time").text().toLowerCase();
    const inStock = !/uitverkocht|niet leverbaar|onbekend/.test(delivery);

    if (name && !isNaN(price) && price > 0) {
      results.push({ retailer: "azerty", name, priceEur: price, url: link, imageUrl: img, inStock });
    }
  });

  return results.slice(0, 10);
}
