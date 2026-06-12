import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.bol.com";

/**
 * Best-effort scraper: bol.com heeft sterke bot-detectie (consent-wall /
 * client-side rendering). Vanaf datacenter-IP's levert dit vaak 0 resultaten
 * op; de zoekroute valt dan terug op demo-data totdat de Marketing Catalog
 * API beschikbaar is (KvK vereist).
 */
export async function searchBol(query: string): Promise<PriceResult[]> {
  const url = `${BASE}/nl/nl/s/?searchtext=${encodeURIComponent(query)}`;

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

  if (!res.ok) throw new Error(`Bol.com HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results: PriceResult[] = [];

  // Elke product-card is een div[role="button"] met daarin een /nl/nl/p/-link
  $('div[role="button"]').each((_, el) => {
    const titleLink = $(el)
      .find('a[href^="/nl/nl/p/"]')
      .filter((_, a) => $(a).text().trim().length > 10)
      .first();
    const name = titleLink.text().trim();
    const href = titleLink.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    // Screen-reader span: "De prijs van dit product is '2261' euro en '00' cent"
    const srPrice = $(el)
      .find("span")
      .filter((_, s) => $(s).text().startsWith("De prijs van dit product"))
      .first()
      .text();
    const m = srPrice.match(/'(\d+)' euro en '(\d+)' cent/);
    const price = m ? Number(m[1]) + Number(m[2]) / 100 : NaN;

    // Productafbeelding staat in de parent-wrapper naast de content-kolom
    const img = $(el).parent().find('img[src*="media.s-bol"]').first().attr("src");

    const cardText = $(el).text();
    const inStock = !/uitverkocht|niet leverbaar/i.test(cardText);

    if (name && !isNaN(price) && price > 0) {
      results.push({ retailer: "bol", name, priceEur: price, url: link, imageUrl: img, inStock });
    }
  });

  return results.slice(0, 10);
}
