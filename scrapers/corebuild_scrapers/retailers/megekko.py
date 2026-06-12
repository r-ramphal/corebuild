"""Megekko: zoekresultaten via het XHR-endpoint v5.php (JSON met html-veld)."""

import re

from bs4 import BeautifulSoup

from .common import MAX_RESULTS, parse_nl_price, post

BASE = "https://www.megekko.nl"


def search(query: str) -> list[dict]:
    res = post(
        f"{BASE}/pages/zoeken/v5/v5.php",
        data={
            "zoek": query,
            "cache": "0",
            "pageuri": "/info/zoeken",
            "filter": "",
            "pagemutate": "",
            "output": "html",
        },
        headers={
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{BASE}/info/zoeken",
        },
    )
    html = res.json().get("html", "")
    soup = BeautifulSoup(html, "html.parser")
    results = []

    for el in soup.select(".prdContainer"):
        title = el.select_one(".prdTitle")
        price_el = el.select_one(".prsEuro")
        link = el.select_one("a.prdImg")
        img = el.select_one(".prdImg img")
        sub = el.select_one(".prdSubheader")

        if not title or not price_el or not link:
            continue
        price = parse_nl_price(price_el.get_text())
        if price is None:
            continue

        href = link.get("href", "")
        sub_text = sub.get_text(" ").lower() if sub else ""
        in_stock = bool(re.search(r"leverbaar|voorraad", sub_text)) and not re.search(
            r"niet (meer )?leverbaar", sub_text
        )

        img_src = img.get("src", "") if img else ""

        results.append(
            {
                "retailer": "megekko",
                "name": title.get_text(strip=True),
                "price_eur": price,
                "url": href if href.startswith("http") else f"{BASE}{href}",
                "image_url": (img_src if img_src.startswith("http") else f"{BASE}{img_src}") if img_src else None,
                "in_stock": in_stock,
            }
        )
        if len(results) >= MAX_RESULTS:
            break

    return results
