"""Ververs prijsdata in de centrale listings-tabel.

Gebruik:
  python refresh.py --query "rtx 4070"             # één zoekterm, alle retailers
  python refresh.py --all                          # alle populaire zoektermen
  python refresh.py --all --retailers megekko,azerty,alternate
  python refresh.py --all --limit 5 --delay 3
  python refresh.py --category monitor,keyboard    # alleen deze categorieën

De site serveert rijen direct uit de database (TTL 30 min per zoekterm).
"""

import argparse
import sys
import time

from corebuild_scrapers.db import get_conn, save_listings
from corebuild_scrapers.queries import CATEGORY_QUERIES, all_queries
from corebuild_scrapers.relevance import is_junk, matches_category
from corebuild_scrapers.retailers import SCRAPERS


def refresh_query(conn, query: str, retailers: list[str], delay: float, category: str | None = None) -> int:
    total = 0
    for name in retailers:
        scraper = SCRAPERS[name]
        try:
            items = scraper(query)
        except Exception as err:  # noqa: BLE001 — één retailer mag niet alles stoppen
            print(f"  {name:<10} FOUT: {err}")
            continue

        # Relevantiefilter: junk weren, en bij een categorie-query alleen
        # producten bewaren die echt in die categorie thuishoren
        raw = len(items)
        if category:
            items = [i for i in items if matches_category(i["name"], category)]
        else:
            items = [i for i in items if not is_junk(i["name"])]

        if items:
            save_listings(conn, query, items, category=category)
            total += len(items)
        skipped = f" ({raw - len(items)} irrelevant overgeslagen)" if raw != len(items) else ""
        print(f"  {name:<10} {len(items)} rijen{skipped}")
        time.sleep(delay)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="CoreBuild prijs-refresh")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--query", help="één zoekterm verversen")
    group.add_argument("--all", action="store_true", help="alle populaire zoektermen verversen")
    group.add_argument(
        "--category",
        help=f"alleen deze categorie(ën) verversen, komma-gescheiden: {','.join(CATEGORY_QUERIES)}",
    )
    parser.add_argument(
        "--retailers",
        default=",".join(SCRAPERS),
        help=f"komma-gescheiden subset van: {','.join(SCRAPERS)}",
    )
    parser.add_argument("--limit", type=int, help="max aantal zoektermen (bij --all)")
    parser.add_argument("--delay", type=float, default=2.0, help="seconden tussen requests (standaard 2)")
    args = parser.parse_args()

    retailers = [r.strip() for r in args.retailers.split(",") if r.strip()]
    unknown = [r for r in retailers if r not in SCRAPERS]
    if unknown:
        sys.exit(f"Onbekende retailer(s): {', '.join(unknown)}")

    if args.query:
        queries: list[tuple[str, str | None]] = [(args.query, None)]
    elif args.category:
        wanted = [c.strip() for c in args.category.split(",") if c.strip()]
        unknown_cat = [c for c in wanted if c not in CATEGORY_QUERIES]
        if unknown_cat:
            sys.exit(f"Onbekende categorie(ën): {', '.join(unknown_cat)}")
        queries = [
            (q, cat) for cat in wanted for q in CATEGORY_QUERIES[cat]
        ]
    else:
        queries = list(all_queries())
    if args.limit:
        queries = queries[: args.limit]

    print(f"{len(queries)} zoekterm(en), retailers: {', '.join(retailers)}\n")

    grand_total = 0
    with get_conn() as conn:
        for i, (q, category) in enumerate(queries, 1):
            label = f" [{category}]" if category else ""
            print(f"[{i}/{len(queries)}] {q}{label}")
            grand_total += refresh_query(conn, q, retailers, args.delay, category)

    print(f"\nKlaar - {grand_total} rijen geschreven (source='python').")


if __name__ == "__main__":
    main()
