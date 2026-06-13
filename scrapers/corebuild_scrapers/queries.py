"""Zoektermen die periodiek ververst worden.

Spiegel van COMPONENT_META in src/lib/categories.ts: per categorie de
hoofdzoekterm + populaire tags. Bij wijzigingen beide bestanden bijwerken.
"""

CATEGORY_QUERIES: dict[str, list[str]] = {
    "cpu": [
        "processor",
        "Ryzen 7 9700X",
        "Core i7-14700K",
        "Ryzen 5 9600X",
        "Core i5-14600K",
        "Ryzen 9 9900X",
    ],
    "gpu": [
        "videokaart RTX",
        "RTX 4070",
        "RTX 4080 Super",
        "RTX 4060 Ti",
        "RX 7900 XTX",
        "RX 7800 XT",
    ],
    "motherboard": [
        "moederbord ATX motherboard",
        "B650 ATX",
        "Z790 ATX",
        "B760M DDR5",
        "X670E",
        "B650E",
    ],
    "ram": [
        "DDR5 RAM geheugen",
        "32GB DDR5-6000",
        "16GB DDR5-5200",
        "32GB DDR4-3200",
        "Corsair Vengeance DDR5",
    ],
    "storage": [
        "NVMe SSD M.2",
        "Samsung 990 Pro 2TB",
        "WD Black SN850X 2TB",
        "Crucial P3 Plus 2TB",
        "Seagate Barracuda",
    ],
    "psu": [
        "voeding PSU 850W ATX",
        "Corsair RM850x",
        "Seasonic Focus GX-850",
        "be quiet! 850W",
        "750W 80+ Gold",
    ],
    "case": [
        "pc behuizing ATX tower",
        "Fractal Design North",
        "NZXT H9 Flow",
        "Lian Li O11 Dynamic",
        "be quiet! Pure Base 500",
    ],
    "cooling": [
        "CPU koeler AIO waterkoeling",
        "Noctua NH-D15",
        "be quiet! Dark Rock Pro 5",
        "Corsair H150i Elite",
        "Arctic Liquid Freezer III",
    ],
    "monitor": [
        "gaming monitor",
        "1440p 144Hz monitor",
        "27 inch monitor",
        "4K monitor",
        "ultrawide monitor",
    ],
    "keyboard": [
        "mechanisch toetsenbord",
        "draadloos toetsenbord",
        "gaming toetsenbord",
        "60% keyboard",
    ],
    "mouse": [
        "gaming muis",
        "draadloze muis",
        "lichtgewicht gaming muis",
        "Logitech muis",
    ],
    "headset": [
        "gaming headset",
        "draadloze headset",
        "Bluetooth koptelefoon",
    ],
    "microphone": [
        "USB microfoon streaming",
        "Blue Yeti",
        "HyperX QuadCast",
        "Rode NT-USB",
    ],
    "webcam": [
        "webcam 1080p",
        "Logitech C920",
        "4K webcam",
        "streaming webcam",
    ],
    "speaker": [
        "pc speakers",
        "2.1 speakerset",
        "Logitech speakers",
        "gaming speakers",
    ],
    "casefan": [
        "case fan 120mm",
        "140mm fan",
        "RGB fan",
        "PWM ventilator",
        "Noctua fan",
    ],
    "thermalpaste": [
        "koelpasta thermal paste",
        "Thermal Grizzly Kryonaut",
        "Arctic MX-6",
        "Noctua NT-H2",
    ],
    "soundcard": [
        "geluidskaart sound card",
        "Sound Blaster",
        "externe DAC",
        "PCIe geluidskaart",
    ],
    "networkcard": [
        "netwerkkaart wifi PCIe",
        "wifi 6 PCIe kaart",
        "2.5GbE kaart",
        "ethernet kaart PCIe",
    ],
    "capturecard": [
        "capture card",
        "Elgato HD60",
        "Elgato 4K capture",
        "USB capture card",
    ],
    "os": [
        "Windows 11 licentie",
        "Windows 11 Home",
        "Windows 11 Pro",
        "Windows 10 Pro",
    ],
    "accessory": [
        "RGB strip pc",
        "PCIe riser kabel",
        "USB hub",
        "stoffilter pc kast",
    ],
}


def all_queries() -> list[tuple[str, str]]:
    """Alle (zoekterm, categorie)-paren, ontdubbeld op zoekterm."""
    seen: set[str] = set()
    result: list[tuple[str, str]] = []
    for category, queries in CATEGORY_QUERIES.items():
        for q in queries:
            key = q.lower()
            if key not in seen:
                seen.add(key)
                result.append((q, category))
    return result
