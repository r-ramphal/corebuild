"""Bol.com: sterke bot-detectie — werkt vanaf residentiële IP's.

Prijs staat in een screen-reader-span:
"De prijs van dit product is '2261' euro en '00' cent".
"""

import re
from urllib.parse import quote

from bs4 import BeautifulSoup

from .common import MAX_RESULTS, get

BASE = "https://www.bol.com"

PRICE_RE = re.compile(r"'(\d+)' euro en '(\d+)' cent")


def search(query: str) -> list[dict]:
    res = get(f"{BASE}/nl/nl/s/?searchtext={quote(query)}")
    soup = BeautifulSoup(res.text, "html.parser")
    results = []

    for card in soup.select('div[role="button"]'):
        # Titel-link: de product-link met leesbare tekst
        title_link = None
        for a in card.select('a[href^="/nl/nl/p/"]'):
            if len(a.get_text(strip=True)) > 10:
                title_link = a
                break
        if not title_link:
            continue

        sr = card.find("span", string=PRICE_RE)
        m = PRICE_RE.search(sr.get_text()) if sr else None
        if not m:
            # fallback: zoek in alle span-teksten
            for span in card.find_all("span"):
                m = PRICE_RE.search(span.get_text())
                if m:
                    break
        if not m:
            continue
        price = int(m.group(1)) + int(m.group(2)) / 100

        href = title_link.get("href", "")
        parent = card.parent
        img = parent.select_one('img[src*="media.s-bol"]') if parent else None
        in_stock = not re.search(r"uitverkocht|niet leverbaar", card.get_text(" "), re.I)

        results.append(
            {
                "retailer": "bol",
                "name": title_link.get_text(strip=True),
                "price_eur": price,
                "url": href if href.startswith("http") else f"{BASE}{href}",
                "image_url": img.get("src") if img else None,
                "in_stock": in_stock,
            }
        )
        if len(results) >= MAX_RESULTS:
            break

    return results
