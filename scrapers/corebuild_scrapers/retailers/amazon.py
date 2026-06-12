"""Amazon.nl: werkt vanaf residentiële IP's; datacenter-IP's worden geblokkeerd.

Zet AMAZON_ASSOCIATE_TAG in .env.local om affiliate-tags aan links toe te voegen.
"""

import os
from urllib.parse import quote

from bs4 import BeautifulSoup

from .common import MAX_RESULTS, get, parse_nl_price

BASE = "https://www.amazon.nl"


def search(query: str) -> list[dict]:
    res = get(f"{BASE}/s?k={quote(query)}&ref=nb_sb_noss")
    soup = BeautifulSoup(res.text, "html.parser")
    tag = os.environ.get("AMAZON_ASSOCIATE_TAG")
    results = []

    for el in soup.select('[data-component-type="s-search-result"]'):
        title = el.select_one("h2 .a-text-normal") or el.select_one("h2 span")
        price_el = el.select_one(".a-price .a-offscreen")
        img = el.select_one(".s-image")
        asin = el.get("data-asin")

        if not title or not price_el:
            continue
        price = parse_nl_price(price_el.get_text())
        if price is None:
            continue

        if asin:
            url = f"{BASE}/dp/{asin}"
        else:
            link = el.select_one('a.a-link-normal[href*="/dp/"]') or el.select_one("h2 a")
            href = link.get("href", "") if link else ""
            url = href if href.startswith("http") else f"{BASE}{href}"
        if tag:
            url += f"?tag={tag}"

        results.append(
            {
                "retailer": "amazon",
                "name": title.get_text(strip=True),
                "price_eur": price,
                "url": url,
                "image_url": img.get("src") if img else None,
                "in_stock": True,  # prijs getoond = leverbaar
            }
        )
        if len(results) >= MAX_RESULTS:
            break

    return results
