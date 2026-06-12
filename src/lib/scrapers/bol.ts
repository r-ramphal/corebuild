import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.bol.com";

export async function searchBol(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/nl/nl/s/?searchtext=${encodeURIComponent(query)}&sort=price&priceSort=ASC`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Bol.com HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  $("[data-test='product-item'], .product-item--row, .js_item_root").each((_, el) => {
    const name = $(el)
      .find("[data-test='product-title'], .product-title, .sx-heading")
      .first()
      .text()
      .trim();

    // Price — integer + fractional cents, e.g. "549" + "99"
    const integer = $(el).find(".price__integer, [data-test='price'] .price__integer").first().text().replace(/\D/g, "");
    const fractional = $(el).find(".price__fractional, [data-test='price'] .price__fractional").first().text().replace(/\D/g, "") || "00";
    const price = parseFloat(`${integer}.${fractional.padEnd(2, "0")}`);

    // Fallback: plain text price
    const priceText = !price
      ? $(el).find("[data-test='price'], .price").first().text().replace(/[^\d,]/g, "").replace(",", ".")
      : "";
    const fallbackPrice = parseFloat(priceText);

    const finalPrice = price > 0 ? price : fallbackPrice;

    const href = $(el).find("a[data-test='product-title'], a.product-title, a").first().attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    const img =
      $(el).find("img[data-test='product-image'], .product-media img, img").first().attr("src") ??
      $(el).find("img").first().attr("data-src");

    const stockText = $(el).find("[data-test='delivery-info'], .delivery-highlight").text().toLowerCase();
    const inStock = !stockText.includes("niet") && !stockText.includes("uitverkocht");

    if (name && !isNaN(finalPrice) && finalPrice > 0) {
      results.push({
        retailer: "bol",
        name,
        priceEur: finalPrice,
        url: link,
        imageUrl: img,
        inStock,
      });
    }
  });

  return results.slice(0, 10);
}
