"""Titel-normalisatie voor scrape-resultaten.

Vooral Bol-titels zijn vaak machinevertaald of door marketplace-verkopers
verminkt. Spiegel van src/lib/clean-name.ts - bij wijzigingen beide
bestanden bijwerken.
"""

import re

_BRAND_FIXES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\bwees stil!?", re.I), "be quiet!"),
]

_PREFIX_STRIP = re.compile(
    r"^(atx (semi-?tower )?box|box ventilator( pc)?|motherboard|processor|cpu -)\s+", re.I
)

_NOISE_FRAGMENTS: list[re.Pattern] = [
    re.compile(r"\bbehuizing voor s-?am\d+ computer\b", re.I),
    re.compile(r",?\s*hoge prestaties\.?$", re.I),
]

_CASING: dict[str, str] = {
    "amd": "AMD", "intel": "Intel", "ryzen": "Ryzen", "nvidia": "NVIDIA",
    "geforce": "GeForce", "radeon": "Radeon", "asus": "ASUS", "msi": "MSI",
    "ghz": "GHz", "mhz": "MHz", "cpu": "CPU", "gpu": "GPU", "psu": "PSU",
    "ddr3": "DDR3", "ddr4": "DDR4", "ddr5": "DDR5", "nvme": "NVMe",
    "rtx": "RTX", "gtx": "GTX", "atx": "ATX", "wifi": "WiFi", "usb": "USB",
    "hdmi": "HDMI", "ssd": "SSD", "hdd": "HDD", "argb": "ARGB", "rgb": "RGB",
    "pwm": "PWM", "aio": "AIO", "oem": "OEM", "am4": "AM4", "am5": "AM5",
    "lga": "LGA", "pcie": "PCIe",
}


def _dedupe_phrases(name: str) -> str:
    tokens = name.split()
    for length in range(len(tokens) // 2, 0, -1):
        for i in range(len(tokens) - 2 * length + 1):
            a = " ".join(tokens[i : i + length]).lower()
            b = " ".join(tokens[i + length : i + 2 * length]).lower()
            if a == b:
                del tokens[i + length : i + 2 * length]
                return _dedupe_phrases(" ".join(tokens))
    return " ".join(tokens)


def clean_name(raw: str) -> str:
    name = re.sub(r"\s+", " ", raw).strip()

    for pattern, fix in _BRAND_FIXES:
        name = pattern.sub(fix, name)
    name = _PREFIX_STRIP.sub("", name)
    for pattern in _NOISE_FRAGMENTS:
        name = pattern.sub("", name)

    for key, value in _CASING.items():
        name = re.sub(rf"\b{key}\b", value, name, flags=re.I)
    name = re.sub(r"\b(\d+)\s?mm\b", r"\1mm", name, flags=re.I)
    name = re.sub(r"\brx(?=\s?\d{3,4})", "RX", name, flags=re.I)

    name = _dedupe_phrases(name)

    name = re.sub(r"\s+([,.])", r"\1", name)
    name = re.sub(r",\s*,", ",", name)
    name = re.sub(r"\s{2,}", " ", name)
    name = re.sub(r"[\s,.\-–|]+$", "", name).strip()

    return name if len(name) >= 3 else raw.strip()
