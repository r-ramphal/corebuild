"""Azerty: Magento-zoekpagina. Let op: zonder www (met www redirect naar home)."""

import re
from urllib.parse import quote

from bs4 import BeautifulSoup

from .common import MAX_RESULTS, get

BASE = "https://azerty.nl"


def search(query: str) -> list[dict]:
    res = get(f"{BASE}/catalogsearch/result/?q={quote(query)}")
    soup = BeautifulSoup(res.text, "html.parser")
    results = []

    for form in soup.find_all("form", id=re.compile(r"^product_addtocart_form")):
        link = form.select_one("a.product-item-link")
        price_el = form.select_one('[data-price-type="finalPrice"][data-price-amount]') or form.select_one(
            "[data-price-amount]"
        )
        img = form.select_one("img.product-image-photo")
        delivery = form.select_one(".product-delivery-time")

        if not link or not price_el:
            continue
        try:
            price = round(float(price_el["data-price-amount"]), 2)
        except (KeyError, ValueError):
            continue
        if price <= 0:
            continue

        href = link.get("href", "")
        delivery_text = delivery.get_text(" ").lower() if delivery else ""
        in_stock = not re.search(r"uitverkocht|niet leverbaar|onbekend", delivery_text)

        results.append(
            {
                "retailer": "azerty",
                "name": link.get_text(strip=True),
                "price_eur": price,
                "url": href if href.startswith("http") else f"{BASE}{href}",
                "image_url": img.get("src") if img else None,
                "in_stock": in_stock,
            }
        )
        if len(results) >= MAX_RESULTS:
            break

    return results
