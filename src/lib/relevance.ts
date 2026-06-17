import type { ComponentType } from "./types";

/**
 * Categorie-relevantie voor scrape-resultaten.
 *
 * Retailer-zoekmachines matchen fuzzy ("processor" → Harry Potter
 * "Professor"-figuren) en geven accessoires terug (waterblocks bij GPU's,
 * SSD-behuizingen bij opslag). Deze module classificeert productnamen zodat
 * elke categorie alleen échte componenten toont.
 *
 * Spiegel van scrapers/corebuild_scrapers/relevance.py — bij wijzigingen
 * beide bestanden bijwerken.
 */

/** Nooit een PC-component, ongeacht categorie. */
const JUNK = new RegExp(
  [
    "harry potter", "schleich", "funko", "\\blego\\b", "playmobil",
    "speelfiguur", "actiefiguur", "rollenspel", "speelgoed", "knuffel",
    "sleutelhanger", "puzzel", "verkleed", "kostuum", "t-shirt", "hoodie",
    "poster", "\\bmok\\b", "sticker", "\\bboek\\b", "verzamelfiguur",
    "\\bwand\\b.*(collection|replica)", "(collection|replica).*\\bwand\\b",
  ].join("|"),
  "i"
);

/**
 * Onverenigbare platforms: een moederbord of CPU hoort bij precies één socket.
 * Een titel die zowel een AMD-platform (AM4/AM5-socket of -chipset) als een
 * Intel-platform (LGA-socket of Intel-chipset) noemt, is een junk-/spamtitel
 * (bv. "X670E … LGA 1150 … B85"). Geldt bewust NIET voor koelers/pasta e.d., die
 * legitiem meerdere sockets ondersteunen — daarom alleen op motherboard/cpu.
 */
const AMD_PLATFORM =
  /\b(am5|am4|am3\+?|x870e?|x670e?|b850|b840|b650e?|a620|x570|b550|a520|b450|x470|b350|a320|trx40|trx50|wrx80|tr4)\b/i;
const INTEL_PLATFORM =
  /\b(lga\s?(?:1150|1151|1155|1156|1200|1700|1851|2011|2066)|socket\s?115\d|h81|b85|h87|z87|h97|z97|h110|b150|h170|z170|b250|z270|z370|z390|b360|h310|b365|z490|b460|h410|z590|b560|h510|b660|z690|b760|z790|h610|b860|z890)\b/i;

/** True als een titel sockets/chipsets van twee onverenigbare platforms noemt. */
export function hasContradictorySocket(name: string): boolean {
  return AMD_PLATFORM.test(name) && INTEL_PLATFORM.test(name);
}

interface CategoryRule {
  /** Naam moet op minstens één van deze patronen matchen. */
  require: RegExp[];
  /** Naam mag op géén van deze patronen matchen (accessoires e.d.). */
  exclude: RegExp;
}

const RULES: Record<ComponentType, CategoryRule> = {
  cpu: {
    require: [
      /\b(ryzen\s*[3579]|threadripper|athlon|epyc)\b/i,
      /\bcore\s*(i[3579]|ultra\s*[3579])\b/i,
      /\b(pentium|celeron|xeon)\b/i,
    ],
    exclude:
      /(?<!zonder )\bkoeler\b|\bcooler\b(?!.*(zonder|without))|cooling|waterkoel|ventilator|\bfan\b|moederbord|motherboard|mainboard|laptop|notebook|mini.?pc|desktop|game.?pc|gaming\s?pc|barebone|all.?in.?one|combokit|bundel|geheugen|\bssd\b|grafische|videokaart|contact\s?frame|bracket|socket\s?kit/i,
  },
  gpu: {
    require: [
      /\b(geforce|radeon)\b/i,
      /\b(rtx|gtx)\s*\d{3,4}/i,
      /\brx\s*\d{3,4}/i,
      /\barc\s*[ab]\d{3}/i,
      /(videokaart|grafische kaart|graphics card)/i,
    ],
    exclude:
      /waterkoel|waterblock|water\s?block|backplate|eisblock|ek-quantum|alphacool|bracket|houder|riser|verticale?\s?(gpu)?\s?mount|support|standaard|kabel|\bcable\b|stofkap|anti.?sag|game.?pc|gaming\s?pc|desktop|laptop|notebook/i,
  },
  motherboard: {
    require: [/\b(moederbord|motherboard|mainboard)\b/i],
    exclude: /laptop|notebook|behuizing|standoff|schroev|fan\s?hub|kit voor vloeistofkoeling/i,
  },
  ram: {
    require: [/\bddr[345]\b/i],
    exclude:
      /laptop|notebook|probook|macbook|sodimm|so-dimm|laptopgeheugen|lighting|ledverlichting|enhancement kit|\bled\b|heatsink|heatspreader|koeler|moederbord|motherboard|mainboard/i,
  },
  storage: {
    require: [
      /\b(ssd|hdd|nvme)\b/i,
      /harde schijf|hard\s?drive|solid\s?state/i,
    ],
    exclude:
      /behuizing|enclosure|docking|\bdock\b|adapter|usb-c|usb 3|extern|schroev|bevestig|montage|caddy|\bhoes\b|kabel|reader|hub\b|nas\b|laptop|notebook|macbook|playstation|\bxbox\b|console/i,
  },
  psu: {
    require: [
      /\b(voeding|psu|power\s?supply)\b/i,
      /\b\d{3,4}\s?w(att)?\b.*\b(80\s?\+|80\s?plus|gold|platinum|bronze|titanium|modulair|modular|atx)\b/i,
      /\b(80\s?\+|80\s?plus|gold|platinum|bronze|titanium|modulair|modular|atx)\b.*\b\d{3,4}\s?w(att)?\b/i,
    ],
    exclude:
      /adapter|oplader|laptop|notebook|powerbank|\bups\b|verlengkabel|splitter|sleeve|extension|kabelset|\bkabel\b|behuizing|tower|\bcase\b|game.?pc|gaming\s?pc/i,
  },
  case: {
    require: [/(behuizing|tower|case|chassis)/i],
    exclude:
      /standaard|\bstand\b|wieltjes|muismat|telefoon|phone|tablet|hoes\b|sleeve|laptop|hdd|ssd|extern|sleutel|koffer|trolley|displaykast/i,
  },
  cooling: {
    require: [
      /\b(cpu.?koeler|waterkoel|waterkoeler|aio|liquid\s?cool)\b/i,
      /\b(koeler|cooler|heatsink)\b/i,
      /\bcase\s?fan|ventilator\b/i,
    ],
    exclude:
      /screen module|lcd-?(display|scherm)\b.*module|backplate|eisblock|waterblock|ek-quantum|bracket|montagebeugel|beugel|montagekit|mounting|houder|koelpasta|thermal\s?(paste|pad)|fan\s?hub|controller\s?module|laptop|notebook|gpu|behuizing|midi tower|mid.?tower|full tower|chassis|zonder koeler|\btray\b|combokit/i,
  },
  monitor: {
    require: [/\b(monitor|beeldscherm)\b/i, /\bultrawide\b/i],
    exclude:
      /monitor.?arm|\barm\b|vesa|gasveer|muursteun|bureausteun|\b(standaard|stand|muurbeugel|beugel|houder|kabel|adapter|reiniger|sleeve|hoes)\b|laptop|all.?in.?one|\btv\b/i,
  },
  keyboard: {
    require: [/\b(toetsenbord|keyboard)\b/i],
    exclude:
      /laptop|\bcover\b|\bhoes\b|sticker|keycaps?|polssteun|switch(es)?\b|stabilizers?|ontvanger|receiver|unifying|dongle/i,
  },
  mouse: {
    require: [/\b(muis|mouse)\b/i],
    exclude: /muismat|mousepad|bungee|laptop|toetsenbord|skates|grip\s?tape|ontvanger|receiver|unifying|dongle/i,
  },
  headset: {
    require: [/\b(headset|koptelefoon|hoofdtelefoon|headphones?)\b/i],
    exclude: /\b(standaard|hanger|\bstand\b|kabel|case|adapter|oordopjes|earbuds)\b/i,
  },
  microphone: {
    require: [
      /\b(microfoon|microphone|\bmic\b)\b/i,
      /\b(blue\s?yeti|quadcast|nt-?usb|wave\s?[13]|condensator(microfoon)?)\b/i,
    ],
    exclude:
      /headset|koptelefoon|micro(foon)?.?arm|mic.?arm|popfilter|plopkap|windkap|spuitkap|standaard|statief|kabel|adapter|ontvanger|\bin-?ear\b|oordopjes|earbuds/i,
  },
  webcam: {
    require: [/\b(webcam|web\s?camera|streamcam|facecam|brio)\b/i],
    exclude:
      /beveiligingscamera|ip-?camera|babyfoon|dashcam|actiecamera|bodycam|\bgopro\b|\bcover\b|afdek|privacy.?(cover|schuif)|statief|tripod|laptop|telefoon|deurbel|\bring\b/i,
  },
  speaker: {
    require: [/\b(speaker|speakers|speakerset|luidspreker|soundbar)\b/i],
    exclude:
      /koptelefoon|hoofdtelefoon|headset|oordopjes|earbuds|kabel|standaard|beugel|muurbeugel|\barm\b|partybox|party\s?speaker|\bsonos\b|google\s?nest|amazon\s?echo|\balexa\b|smart\s?speaker|draagbare?\s?speaker|portable|bluetooth\s?box/i,
  },
  casefan: {
    require: [
      /\bcase\s?fans?\b/i,
      /behuizingsventilator/i,
      /\b(120|140|92|80)\s?mm\b.*\b(fan|ventilator|pwm|rgb|argb)\b/i,
      /\b(fan|ventilator)\b.*\b(120|140|92|80)\s?mm\b/i,
    ],
    exclude:
      /cpu.?koeler|cpu.?cooler|\baio\b|waterkoel|liquid|heatsink|tower\s?cooler|nh-[dlup]\d|dark\s?rock|peerless|assassin|gpu|grafische|videokaart|moederbord|laptop|notebook|fan\s?hub|fan\s?controller|\bfilter\b|stofkap|föhn|haardroge|staande\s?ventilator|tafelventilator|plafond|airco|\bbracket\b/i,
  },
  thermalpaste: {
    require: [
      /koelpasta|warmtegeleidingspasta/i,
      /thermal\s?(paste|grizzly|compound)/i,
      /\b(kryonaut|hydronaut|nt-h[12]|mx-?[2-6])\b/i,
    ],
    exclude: /thermal\s?pad|laptop|notebook|\bfan\b|koeler|cooler|reiniger|cleaner|verwijder/i,
  },
  soundcard: {
    require: [
      /\b(geluidskaart|sound\s?card|sound\s?blaster)\b/i,
      /\b(externe?|usb|pcie?)\s?(dac|geluidskaart|audio\s?interface)\b/i,
    ],
    exclude:
      /speaker|luidspreker|koptelefoon|hoofdtelefoon|headset|oordopjes|microfoon|\bkabel\b|soundbar|behuizing|moederbord/i,
  },
  networkcard: {
    require: [
      /\b(netwerkkaart|network\s?card|nic)\b/i,
      /\b(wifi|wi-fi|ethernet|lan|2\.5\s?gbe|5\s?gbe|10\s?gbe)\b.*\b(kaart|adapter|pcie?|card)\b/i,
      /\b(kaart|adapter|pcie?|card)\b.*\b(wifi|wi-fi|ethernet|lan)\b/i,
      /\b(2\.5|5|10)\s?gbe\b/i,
    ],
    exclude:
      /\brouter\b|\bswitch\b|\bmodem\b|access\s?point|repeater|powerline|\bmesh\b|\bkabel\b|patch|laptop|notebook|\busb-?stick\b|moederbord|motherboard|mainboard/i,
  },
  capturecard: {
    require: [
      /\b(capture\s?card|capturekaart|video\s?capture|game\s?capture|hdmi\s?capture|cam\s?link)\b/i,
      /\belgato\b.*\b(hd60|4k|capture)\b/i,
    ],
    exclude: /\bkabel\b|splitter|verloop|stream\s?deck|toetsenbord|microfoon|\bswitch\b/i,
  },
  os: {
    require: [
      /windows\s?1[01]\s?(home|pro|professional|education|enterprise|n\b)?/i,
      /\b(microsoft\s?windows|besturingssysteem|operating\s?system)\b/i,
      /\bos\b\s?(licentie|license|key)/i,
    ],
    exclude:
      /laptop|notebook|desktop|game.?pc|gaming\s?pc|mini.?pc|all.?in.?one|sticker|\bboek\b|cursus|\bkabel\b|toetsenbord|\bmuis\b|tablet|telefoon|\boffice\b|antivirus|server\s?20/i,
  },
  accessory: {
    require: [
      /\b(kabel|cable|usb[\s-]?hub|hub|riser|verlengkabel|kabelmanagement|kabelset|kabelgoot|kabelbinder)\b/i,
      /\b(rgb|led|argb).?strip\b/i,
      /\b(stoffilter|stofkap|standoff|fan\s?hub|fan\s?controller|sleeve)\b/i,
    ],
    exclude:
      /processor|videokaart|grafische|moederbord|geheugen|\bssd\b|\bhdd\b|\bnvme\b|voeding|behuizing|monitor|toetsenbord|\bmuis\b|headset|\bcpu\b|\bgpu\b|laptop|notebook/i,
  },
};

/** True als de productnaam overduidelijk geen PC-component is. */
export function isJunk(name: string): boolean {
  return JUNK.test(name);
}

/** True als de productnaam in deze categorie thuishoort. */
export function matchesCategory(name: string, cat: ComponentType): boolean {
  if (isJunk(name)) return false;
  const rule = RULES[cat];
  if (!rule) return true;
  if (rule.exclude.test(name)) return false;
  // Eén moederbord/CPU = één platform; twee onverenigbare platforms = junk.
  if ((cat === "motherboard" || cat === "cpu") && hasContradictorySocket(name)) return false;
  return rule.require.some((re) => re.test(name));
}

/** Best-effort: leid de categorie af uit een productnaam (voor de catalogus). */
export function inferCategory(name: string): ComponentType | null {
  if (isJunk(name)) return null;
  // Volgorde is belangrijk: specifieke signalen eerst (een moederbordnaam
  // noemt vaak DDR5, een koelernaam vaak de CPU-socket).
  const order: ComponentType[] = [
    "motherboard", "gpu", "cpu", "psu",
    // casefan vóór cooling: een losse behuizingsventilator hoort in casefan,
    // een CPU-koeler valt via casefan.exclude alsnog door naar cooling.
    "casefan", "cooling", "thermalpaste", "storage", "ram", "case",
    "soundcard", "networkcard", "capturecard", "os",
    "monitor", "keyboard", "mouse", "headset", "microphone", "webcam", "speaker",
    // accessory is het meest generiek (kabel/hub/strip) → altijd als laatste.
    "accessory",
  ];
  for (const cat of order) {
    if (matchesCategory(name, cat)) return cat;
  }
  return null;
}

export function isComponentType(value: string | null): value is ComponentType {
  // RULES bevat één entry per ComponentType (afgedwongen door het Record-type),
  // dus dit blijft vanzelf in sync wanneer er een categorie bijkomt.
  return value !== null && Object.prototype.hasOwnProperty.call(RULES, value);
}
