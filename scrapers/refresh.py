"""Ververs prijsdata in de centrale listings-tabel.

Gebruik:
  python refresh.py --query "rtx 4070"             # één zoekterm, alle retailers
  python refresh.py --all                          # alle populaire zoektermen
  python refresh.py --all --retailers megekko,azerty,alternate
  python refresh.py --all --limit 5 --delay 3

De site serveert rijen direct uit de database (TTL 30 min per zoekterm).
"""

import argparse
import sys
import time

from corebuild_scrapers.db import get_conn, save_listings
from corebuild_scrapers.queries import all_queries
from corebuild_scrapers.retailers import SCRAPERS


def refresh_query(conn, query: str, retailers: list[str], delay: float) -> int:
    total = 0
    for name in retailers:
        scraper = SCRAPERS[name]
        try:
            items = scraper(query)
        except Exception as err:  # noqa: BLE001 — één retailer mag niet alles stoppen
            print(f"  {name:<10} FOUT: {err}")
            continue
        if items:
            save_listings(conn, query, items)
            total += len(items)
        print(f"  {name:<10} {len(items)} rijen")
        time.sleep(delay)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="CoreBuild prijs-refresh")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--query", help="één zoekterm verversen")
    group.add_argument("--all", action="store_true", help="alle populaire zoektermen verversen")
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

    queries = [args.query] if args.query else all_queries()
    if args.limit:
        queries = queries[: args.limit]

    print(f"{len(queries)} zoekterm(en), retailers: {', '.join(retailers)}\n")

    grand_total = 0
    with get_conn() as conn:
        for i, q in enumerate(queries, 1):
            print(f"[{i}/{len(queries)}] {q}")
            grand_total += refresh_query(conn, q, retailers, args.delay)

    print(f"\nKlaar - {grand_total} rijen geschreven (source='python').")


if __name__ == "__main__":
    main()
