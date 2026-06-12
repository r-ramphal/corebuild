"""Alternate: listing.xhtml — elke product-card is zelf een <a class="productBox">."""

from urllib.parse import quote

from bs4 import BeautifulSoup

from .common import MAX_RESULTS, get, parse_nl_price

BASE = "https://www.alternate.nl"


def search(query: str) -> list[dict]:
    res = get(f"{BASE}/listing.xhtml?q={quote(query)}&s=price_asc")
    soup = BeautifulSoup(res.text, "html.parser")
    results = []

    for card in soup.select("a.productBox"):
        name_el = card.select_one(".product-name")
        price_el = card.select_one("span.price")
        img = card.select_one("img.productPicture")
        delivery = card.select_one(".delivery-info")

        if not name_el or not price_el:
            continue
        price = parse_nl_price(price_el.get_text())
        if price is None:
            continue

        href = card.get("href", "")
        img_src = img.get("src", "") if img else ""
        in_stock = "op voorraad" in (delivery.get_text(" ").lower() if delivery else "")

        results.append(
            {
                "retailer": "alternate",
                "name": " ".join(name_el.get_text(" ", strip=True).split()),
                "price_eur": price,
                "url": href if href.startswith("http") else f"{BASE}{href}",
                "image_url": (img_src if img_src.startswith("http") else f"{BASE}{img_src}") if img_src else None,
                "in_stock": in_stock,
            }
        )
        if len(results) >= MAX_RESULTS:
            break

    return results
