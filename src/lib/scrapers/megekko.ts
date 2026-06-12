import * as cheerio from "cheerio";
import type { PriceResult } from "../types";

const BASE = "https://www.megekko.nl";

/**
 * Megekko rendert zoekresultaten via een XHR-endpoint (v5.php) dat JSON
 * teruggeeft met een `html`-veld. De resultatenpagina zelf is een lege shell.
 */
export async function searchMegekko(query: string): Promise<PriceResult[]> {
  const body = new URLSearchParams({
    zoek: query,
    cache: "0",
    pageuri: "/info/zoeken",
    filter: "",
    pagemutate: "",
    output: "html",
  });

  const res = await fetch(`${BASE}/pages/zoeken/v5/v5.php`, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "nl-NL,nl;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${BASE}/info/zoeken`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Megekko HTTP ${res.status}`);

  const json = (await res.json()) as { html?: string };
  if (!json.html) return [];

  const $ = cheerio.load(json.html);
  const results: PriceResult[] = [];

  $(".prdContainer").each((_, el) => {
    const name = $(el).find(".prdTitle").first().text().trim();

    // Prijs als "1299,-" / "1.299,-" / "129,99"
    const rawPrice = $(el).find(".prsEuro").first().text().trim();
    const price = parseFloat(
      rawPrice
        .replace(/\./g, "")
        .replace(",-", ",00")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
    );

    const href = $(el).find("a.prdImg").attr("href") ?? "";
    const link = href.startsWith("http") ? href : `${BASE}${href}`;

    const imgSrc = $(el).find(".prdImg img").attr("src");
    const img = imgSrc
      ? imgSrc.startsWith("http")
        ? imgSrc
        : `${BASE}${imgSrc}`
      : undefined;

    const sub = $(el).find(".prdSubheader").text().toLowerCase();
    const inStock =
      /leverbaar|voorraad/.test(sub) && !/niet (meer )?leverbaar/.test(sub);

    if (name && !isNaN(price) && price > 0) {
      results.push({ retailer: "megekko", name, priceEur: price, url: link, imageUrl: img, inStock });
    }
  });

  return results.slice(0, 10);
}
