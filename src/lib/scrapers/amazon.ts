import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.amazon.nl";

/**
 * Best-effort scraper: werkt vanaf residentiële IP's, maar wordt vanaf
 * datacenter-IP's (Vercel) vaak geblokkeerd. De zoekroute valt dan terug
 * op demo-data totdat de PA-API beschikbaar is (3 verkopen vereist).
 */
export async function searchAmazon(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Amazon HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  $('[data-component-type="s-search-result"]').each((_, el) => {
    const name = $(el).find("h2 .a-text-normal, h2 span").first().text().trim();

    // Screen-reader span heeft de schoonste prijs, bijv. "€ 549,99"
    const priceText = $(el)
      .find(".a-price .a-offscreen")
      .first()
      .text()
      .replace(/[^\d,]/g, "")
      .replace(",", ".");
    const price = parseFloat(priceText);

    // Canonieke URL via het ASIN op de result-container
    const asin = $(el).attr("data-asin");
    const href = $(el).find('a.a-link-normal[href*="/dp/"], h2 a').first().attr("href") ?? "";
    let link = asin
      ? `${BASE}/dp/${asin}`
      : href.startsWith("http")
        ? href
        : `${BASE}${href}`;
    if (associateTag) link += `?tag=${associateTag}`;

    const img = $(el).find(".s-image").attr("src");

    if (name && !isNaN(price) && price > 0) {
      results.push({
        retailer: "amazon",
        name,
        priceEur: price,
        url: link,
        imageUrl: img,
        inStock: true, // prijs getoond = leverbaar
        asin: asin || undefined,
      });
    }
  });

  return results.slice(0, 10);
}
