from . import alternate, amazon, azerty, bol, megekko

# Naam → scrape-functie; elke functie: (query: str) -> list[dict]
SCRAPERS = {
    "amazon": amazon.search,
    "bol": bol.search,
    "megekko": megekko.search,
    "azerty": azerty.search,
    "alternate": alternate.search,
}
