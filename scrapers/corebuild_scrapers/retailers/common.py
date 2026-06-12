"""Gedeelde HTTP-helpers voor alle retailer-scrapers.

Gebruikt curl_cffi met Chrome-impersonatie: Amazon (en mogelijk anderen)
blokkeren de standaard requests-library op TLS-fingerprint.
"""

import time

from curl_cffi import requests
from curl_cffi.requests.exceptions import RequestException

HEADERS = {
    "Accept-Language": "nl-NL,nl;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

IMPERSONATE = "chrome"
TIMEOUT = 20
MAX_RESULTS = 10


def get(url: str, retries: int = 2, **kwargs):
    """GET met retry — sommige retailers geven sporadisch 503 op de eerste poging."""
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            res = requests.get(
                url, headers=HEADERS, timeout=TIMEOUT, impersonate=IMPERSONATE, **kwargs
            )
            res.raise_for_status()
            return res
        except RequestException as err:
            last_err = err
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
    raise last_err  # type: ignore[misc]


def post(url: str, **kwargs):
    headers = {**HEADERS, **kwargs.pop("headers", {})}
    res = requests.post(url, headers=headers, timeout=TIMEOUT, impersonate=IMPERSONATE, **kwargs)
    res.raise_for_status()
    return res


def parse_nl_price(text: str) -> float | None:
    """Parseer een NL-prijs als '€ 1.299,00' / '1299,-' / '129,99' naar float."""
    cleaned = (
        text.strip()
        .replace(".", "")
        .replace(",-", ",00")
        .replace(",", ".")
    )
    digits = "".join(c for c in cleaned if c.isdigit() or c == ".")
    try:
        value = float(digits)
        return value if value > 0 else None
    except ValueError:
        return None
