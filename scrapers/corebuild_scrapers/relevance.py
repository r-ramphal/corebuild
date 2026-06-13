"""Categorie-relevantie voor scrape-resultaten.

Retailer-zoekmachines matchen fuzzy ("processor" -> Harry Potter
"Professor"-figuren) en geven accessoires terug (waterblocks bij GPU's,
SSD-behuizingen bij opslag). Deze module classificeert productnamen zodat
alleen echte componenten in de database belanden.

Spiegel van src/lib/relevance.ts - bij wijzigingen beide bestanden bijwerken.
"""

import re

_JUNK = re.compile(
    "|".join(
        [
            r"harry potter", r"schleich", r"funko", r"\blego\b", r"playmobil",
            r"speelfiguur", r"actiefiguur", r"rollenspel", r"speelgoed", r"knuffel",
            r"sleutelhanger", r"puzzel", r"verkleed", r"kostuum", r"t-shirt", r"hoodie",
            r"poster", r"\bmok\b", r"sticker", r"\bboek\b", r"verzamelfiguur",
            r"\bwand\b.*(collection|replica)", r"(collection|replica).*\bwand\b",
        ]
    ),
    re.IGNORECASE,
)

# Per categorie: (require-patronen waarvan er minstens één moet matchen, exclude-patroon)
_RULES: dict[str, tuple[list[re.Pattern], re.Pattern]] = {
    "cpu": (
        [
            re.compile(r"\b(ryzen\s*[3579]|threadripper|athlon|epyc)\b", re.I),
            re.compile(r"\bcore\s*(i[3579]|ultra\s*[3579])\b", re.I),
            re.compile(r"\b(pentium|celeron|xeon)\b", re.I),
        ],
        re.compile(
            r"(?<!zonder )\bkoeler\b|\bcooler\b(?!.*(zonder|without))|cooling|waterkoel|ventilator|\bfan\b"
            r"|moederbord|motherboard"
            r"|mainboard|laptop|notebook|mini.?pc|desktop|game.?pc|gaming\s?pc|barebone"
            r"|all.?in.?one|combokit|bundel|geheugen|\bssd\b|grafische|videokaart|contact\s?frame"
            r"|bracket|socket\s?kit",
            re.I,
        ),
    ),
    "gpu": (
        [
            re.compile(r"\b(geforce|radeon)\b", re.I),
            re.compile(r"\b(rtx|gtx)\s*\d{3,4}", re.I),
            re.compile(r"\brx\s*\d{3,4}", re.I),
            re.compile(r"\barc\s*[ab]\d{3}", re.I),
            re.compile(r"(videokaart|grafische kaart|graphics card)", re.I),
        ],
        re.compile(
            r"waterkoel|waterblock|water\s?block|backplate|eisblock|ek-quantum|alphacool"
            r"|bracket|houder|riser|verticale?\s?(gpu)?\s?mount|support|standaard|kabel"
            r"|\bcable\b|stofkap|anti.?sag|game.?pc|gaming\s?pc|desktop|laptop|notebook",
            re.I,
        ),
    ),
    "motherboard": (
        [re.compile(r"\b(moederbord|motherboard|mainboard)\b", re.I)],
        re.compile(
            r"laptop|notebook|behuizing|standoff|schroev|fan\s?hub|kit voor vloeistofkoeling",
            re.I,
        ),
    ),
    "ram": (
        [re.compile(r"\bddr[345]\b", re.I)],
        re.compile(
            r"laptop|notebook|probook|macbook|sodimm|so-dimm|laptopgeheugen|lighting"
            r"|ledverlichting|enhancement kit|\bled\b|heatsink|heatspreader|koeler"
            r"|moederbord|motherboard|mainboard",
            re.I,
        ),
    ),
    "storage": (
        [
            re.compile(r"\b(ssd|hdd|nvme)\b", re.I),
            re.compile(r"harde schijf|hard\s?drive|solid\s?state", re.I),
        ],
        re.compile(
            r"behuizing|enclosure|docking|\bdock\b|adapter|usb-c|usb 3|extern|schroev"
            r"|bevestig|montage|caddy|\bhoes\b|kabel|reader|hub\b|nas\b|laptop|notebook"
            r"|macbook|playstation|\bxbox\b|console",
            re.I,
        ),
    ),
    "psu": (
        [
            re.compile(r"\b(voeding|psu|power\s?supply)\b", re.I),
            re.compile(
                r"\b\d{3,4}\s?w(att)?\b.*\b(80\s?\+|80\s?plus|gold|platinum|bronze|titanium|modulair|modular|atx)\b",
                re.I,
            ),
            re.compile(
                r"\b(80\s?\+|80\s?plus|gold|platinum|bronze|titanium|modulair|modular|atx)\b.*\b\d{3,4}\s?w(att)?\b",
                re.I,
            ),
        ],
        re.compile(
            r"adapter|oplader|laptop|notebook|powerbank|\bups\b|verlengkabel|splitter"
            r"|sleeve|extension|kabelset|\bkabel\b|behuizing|tower|\bcase\b|game.?pc|gaming\s?pc",
            re.I,
        ),
    ),
    "case": (
        [re.compile(r"(behuizing|tower|case|chassis)", re.I)],
        re.compile(
            r"standaard|\bstand\b|wieltjes|muismat|telefoon|phone|tablet|hoes\b|sleeve"
            r"|laptop|hdd|ssd|extern|sleutel|koffer|trolley|displaykast",
            re.I,
        ),
    ),
    "cooling": (
        [
            re.compile(r"\b(cpu.?koeler|waterkoel|waterkoeler|aio|liquid\s?cool)\b", re.I),
            re.compile(r"\b(koeler|cooler|heatsink)\b", re.I),
            re.compile(r"\bcase\s?fan|ventilator\b", re.I),
        ],
        re.compile(
            r"screen module|lcd-?(display|scherm)\b.*module|backplate|eisblock|waterblock"
            r"|ek-quantum|bracket|houder|koelpasta|thermal\s?(paste|pad)|fan\s?hub"
            r"|controller\s?module|laptop|notebook|gpu|behuizing|midi tower|mid.?tower"
            r"|full tower|chassis|zonder koeler|\btray\b|combokit",
            re.I,
        ),
    ),
    "monitor": (
        [re.compile(r"\b(monitor|beeldscherm)\b", re.I), re.compile(r"\bultrawide\b", re.I)],
        re.compile(
            r"monitor.?arm|\barm\b|vesa|gasveer|muursteun|bureausteun"
            r"|\b(standaard|stand|muurbeugel|beugel|houder|kabel|adapter|reiniger|sleeve|hoes)\b"
            r"|laptop|all.?in.?one|\btv\b",
            re.I,
        ),
    ),
    "keyboard": (
        [re.compile(r"\b(toetsenbord|keyboard)\b", re.I)],
        re.compile(
            r"laptop|\bcover\b|\bhoes\b|sticker|keycaps?|polssteun|switch(es)?\b|stabilizers?"
            r"|ontvanger|receiver|unifying|dongle",
            re.I,
        ),
    ),
    "mouse": (
        [re.compile(r"\b(muis|mouse)\b", re.I)],
        re.compile(
            r"muismat|mousepad|bungee|laptop|toetsenbord|skates|grip\s?tape"
            r"|ontvanger|receiver|unifying|dongle",
            re.I,
        ),
    ),
    "headset": (
        [re.compile(r"\b(headset|koptelefoon|hoofdtelefoon|headphones?)\b", re.I)],
        re.compile(r"\b(standaard|hanger|stand|kabel|case|adapter|oordopjes|earbuds)\b", re.I),
    ),
}

CATEGORIES = list(_RULES)


def is_junk(name: str) -> bool:
    """True als de productnaam overduidelijk geen PC-component is."""
    return bool(_JUNK.search(name))


def matches_category(name: str, category: str) -> bool:
    """True als de productnaam in deze categorie thuishoort."""
    if is_junk(name):
        return False
    rule = _RULES.get(category)
    if rule is None:
        return True
    require, exclude = rule
    if exclude.search(name):
        return False
    return any(p.search(name) for p in require)


def infer_category(name: str) -> str | None:
    """Best-effort: leid de categorie af uit een productnaam."""
    if is_junk(name):
        return None
    for category in (
        "motherboard", "gpu", "cpu", "psu", "cooling", "storage", "ram", "case",
        "monitor", "keyboard", "mouse", "headset",
    ):
        if matches_category(name, category):
            return category
    return None
