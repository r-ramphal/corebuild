"""Database-laag: schrijft scrape-resultaten naar de centrale `listings`-tabel.

Zelfde semantiek als src/lib/db/listings.ts in de Next.js-app:
- query genormaliseerd (lowercase, enkele spaties)
- prijs in centen
- vervang per (query, retailer) in een transactie
"""

import os
import re
from pathlib import Path

import psycopg
from dotenv import load_dotenv

# Lees DATABASE_URL uit de .env.local van het Next.js-project
load_dotenv(Path(__file__).resolve().parents[2] / ".env.local")
load_dotenv()


def normalize_query(q: str) -> str:
    return re.sub(r"\s+", " ", q.strip().lower())


def get_conn() -> psycopg.Connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL niet gezet — zet hem in .env.local (projectroot)")
    return psycopg.connect(url)


def save_listings(conn: psycopg.Connection, query: str, items: list[dict], source: str = "python") -> int:
    """Vervang per retailer de rijen voor deze (genormaliseerde) zoekterm."""
    if not items:
        return 0

    nq = normalize_query(query)
    retailers = sorted({item["retailer"] for item in items})

    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM listings WHERE query = %s AND retailer = ANY(%s)",
                (nq, retailers),
            )
            cur.executemany(
                """
                INSERT INTO listings
                  (query, retailer, name, price_cents, url, image_url, in_stock, mock, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, false, %s)
                """,
                [
                    (
                        nq,
                        item["retailer"],
                        item["name"],
                        round(item["price_eur"] * 100),
                        item["url"],
                        item.get("image_url"),
                        item.get("in_stock", True),
                        source,
                    )
                    for item in items
                ],
            )
    return len(items)
