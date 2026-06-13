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
    "microphone": (
        [
            re.compile(r"\b(microfoon|microphone|\bmic\b)\b", re.I),
            re.compile(r"\b(blue\s?yeti|quadcast|nt-?usb|wave\s?[13]|condensator(microfoon)?)\b", re.I),
        ],
        re.compile(
            r"headset|koptelefoon|micro(foon)?.?arm|mic.?arm|popfilter|plopkap|windkap"
            r"|spuitkap|standaard|statief|kabel|adapter|ontvanger|\bin-?ear\b|oordopjes|earbuds",
            re.I,
        ),
    ),
    "webcam": (
        [re.compile(r"\b(webcam|web\s?camera|streamcam|facecam|brio)\b", re.I)],
        re.compile(
            r"beveiligingscamera|ip-?camera|babyfoon|dashcam|actiecamera|bodycam|\bgopro\b"
            r"|\bcover\b|afdek|privacy.?(cover|schuif)|statief|tripod|laptop|telefoon|deurbel|\bring\b",
            re.I,
        ),
    ),
    "speaker": (
        [re.compile(r"\b(speaker|speakers|speakerset|luidspreker|soundbar)\b", re.I)],
        re.compile(
            r"koptelefoon|hoofdtelefoon|headset|oordopjes|earbuds|kabel|standaard|beugel"
            r"|muurbeugel|\barm\b|partybox|party\s?speaker|\bsonos\b|google\s?nest|amazon\s?echo"
            r"|\balexa\b|smart\s?speaker|draagbare?\s?speaker|portable|bluetooth\s?box",
            re.I,
        ),
    ),
    "casefan": (
        [
            re.compile(r"\bcase\s?fans?\b", re.I),
            re.compile(r"behuizingsventilator", re.I),
            re.compile(r"\b(120|140|92|80)\s?mm\b.*\b(fan|ventilator|pwm|rgb|argb)\b", re.I),
            re.compile(r"\b(fan|ventilator)\b.*\b(120|140|92|80)\s?mm\b", re.I),
        ],
        re.compile(
            r"cpu.?koeler|cpu.?cooler|\baio\b|waterkoel|liquid|heatsink|tower\s?cooler"
            r"|nh-[dlup]\d|dark\s?rock|peerless|assassin|gpu|grafische|videokaart|moederbord"
            r"|laptop|notebook|fan\s?hub|fan\s?controller|\bfilter\b|stofkap|föhn|haardroge"
            r"|staande\s?ventilator|tafelventilator|plafond|airco|\bbracket\b",
            re.I,
        ),
    ),
    "thermalpaste": (
        [
            re.compile(r"koelpasta|warmtegeleidingspasta", re.I),
            re.compile(r"thermal\s?(paste|grizzly|compound)", re.I),
            re.compile(r"\b(kryonaut|hydronaut|nt-h[12]|mx-?[2-6])\b", re.I),
        ],
        re.compile(r"thermal\s?pad|laptop|notebook|\bfan\b|koeler|cooler|reiniger|cleaner|verwijder", re.I),
    ),
    "soundcard": (
        [
            re.compile(r"\b(geluidskaart|sound\s?card|sound\s?blaster)\b", re.I),
            re.compile(r"\b(externe?|usb|pcie?)\s?(dac|geluidskaart|audio\s?interface)\b", re.I),
        ],
        re.compile(
            r"speaker|luidspreker|koptelefoon|hoofdtelefoon|headset|oordopjes|microfoon"
            r"|\bkabel\b|soundbar|behuizing|moederbord",
            re.I,
        ),
    ),
    "networkcard": (
        [
            re.compile(r"\b(netwerkkaart|network\s?card|nic)\b", re.I),
            re.compile(r"\b(wifi|wi-fi|ethernet|lan|2\.5\s?gbe|5\s?gbe|10\s?gbe)\b.*\b(kaart|adapter|pcie?|card)\b", re.I),
            re.compile(r"\b(kaart|adapter|pcie?|card)\b.*\b(wifi|wi-fi|ethernet|lan)\b", re.I),
            re.compile(r"\b(2\.5|5|10)\s?gbe\b", re.I),
        ],
        re.compile(
            r"\brouter\b|\bswitch\b|\bmodem\b|access\s?point|repeater|powerline|\bmesh\b"
            r"|\bkabel\b|patch|laptop|notebook|\busb-?stick\b|moederbord|motherboard|mainboard",
            re.I,
        ),
    ),
    "capturecard": (
        [
            re.compile(r"\b(capture\s?card|capturekaart|video\s?capture|game\s?capture|hdmi\s?capture|cam\s?link)\b", re.I),
            re.compile(r"\belgato\b.*\b(hd60|4k|capture)\b", re.I),
        ],
        re.compile(r"\bkabel\b|splitter|verloop|stream\s?deck|toetsenbord|microfoon|\bswitch\b", re.I),
    ),
    "os": (
        [
            re.compile(r"windows\s?1[01]\s?(home|pro|professional|education|enterprise|n\b)?", re.I),
            re.compile(r"\b(microsoft\s?windows|besturingssysteem|operating\s?system)\b", re.I),
            re.compile(r"\bos\b\s?(licentie|license|key)", re.I),
        ],
        re.compile(
            r"laptop|notebook|desktop|game.?pc|gaming\s?pc|mini.?pc|all.?in.?one|sticker"
            r"|\bboek\b|cursus|\bkabel\b|toetsenbord|\bmuis\b|tablet|telefoon|\boffice\b"
            r"|antivirus|server\s?20",
            re.I,
        ),
    ),
    "accessory": (
        [
            re.compile(r"\b(kabel|cable|usb[\s-]?hub|hub|riser|verlengkabel|kabelmanagement|kabelset|kabelgoot|kabelbinder)\b", re.I),
            re.compile(r"\b(rgb|led|argb).?strip\b", re.I),
            re.compile(r"\b(stoffilter|stofkap|standoff|fan\s?hub|fan\s?controller|sleeve)\b", re.I),
        ],
        re.compile(
            r"processor|videokaart|grafische|moederbord|geheugen|\bssd\b|\bhdd\b|\bnvme\b"
            r"|voeding|behuizing|monitor|toetsenbord|\bmuis\b|headset|\bcpu\b|\bgpu\b|laptop|notebook",
            re.I,
        ),
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
        "motherboard", "gpu", "cpu", "psu",
        # casefan vóór cooling: een losse behuizingsventilator hoort in casefan,
        # een CPU-koeler valt via de casefan-exclude alsnog door naar cooling.
        "casefan", "cooling", "thermalpaste", "storage", "ram", "case",
        "soundcard", "networkcard", "capturecard", "os",
        "monitor", "keyboard", "mouse", "headset", "microphone", "webcam", "speaker",
        # accessory is het meest generiek (kabel/hub/strip) -> altijd als laatste.
        "accessory",
    ):
        if matches_category(name, category):
            return category
    return None
