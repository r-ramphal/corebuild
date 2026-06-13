import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * Haalt de productomschrijving op die de retailer zélf online toont
 * (og:description / meta-description) van de opgegeven productpagina.
 *
 * Alleen bekende retailer-hosts zijn toegestaan (allowlist) — dit voorkomt
 * SSRF: zonder die check zou je dit endpoint kunnen misbruiken om willekeurige
 * interne adressen te laten opvragen.
 */
const ALLOWED_HOSTS = new Set([
  "megekko.nl", "www.megekko.nl",
  "azerty.nl", "www.azerty.nl",
  "alternate.nl", "www.alternate.nl",
  "bol.com", "www.bol.com",
  "amazon.nl", "www.amazon.nl",
]);

const HOST_LABEL: Record<string, string> = {
  "megekko.nl": "Megekko", "www.megekko.nl": "Megekko",
  "azerty.nl": "Azerty", "www.azerty.nl": "Azerty",
  "alternate.nl": "Alternate", "www.alternate.nl": "Alternate",
  "bol.com": "Bol.com", "www.bol.com": "Bol.com",
  "amazon.nl": "Amazon", "www.amazon.nl": "Amazon",
};

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ") // losse HTML-tags (bv. <br/>) uit de meta-tekst strippen
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "url ontbreekt" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "ongeldige url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.host)) {
    return NextResponse.json({ error: "host niet toegestaan" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 }, // 1 dag cachen
    });

    if (!res.ok) {
      return NextResponse.json({ description: null }, { headers: { "Cache-Control": "public, max-age=3600" } });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [
      $('meta[property="og:description"]').attr("content"),
      $('meta[name="description"]').attr("content"),
      $('meta[name="twitter:description"]').attr("content"),
    ];
    let description = candidates.map((c) => cleanText(c ?? "")).find((c) => c.length >= 40) ?? null;
    if (description && description.length > 600) {
      description = description.slice(0, 597).replace(/\s+\S*$/, "") + "…";
    }

    return NextResponse.json(
      { description, source: HOST_LABEL[target.host] ?? target.host },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch {
    return NextResponse.json({ description: null });
  }
}
