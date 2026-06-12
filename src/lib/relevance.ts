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
      /koeler|cooler|cooling|waterkoel|ventilator|\bfan\b|moederbord|motherboard|mainboard|laptop|notebook|mini.?pc|desktop|game.?pc|gaming\s?pc|barebone|all.?in.?one|geheugen|\bssd\b|grafische|videokaart|contact\s?frame|bracket|socket\s?kit/i,
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
      /screen module|lcd-?(display|scherm)\b.*module|backplate|eisblock|waterblock|ek-quantum|bracket|houder|koelpasta|thermal\s?(paste|pad)|fan\s?hub|controller\s?module|laptop|notebook|gpu|behuizing|midi tower|mid.?tower|full tower|chassis/i,
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
  return rule.require.some((re) => re.test(name));
}

/** Best-effort: leid de categorie af uit een productnaam (voor de catalogus). */
export function inferCategory(name: string): ComponentType | null {
  if (isJunk(name)) return null;
  // Volgorde is belangrijk: specifieke signalen eerst (een moederbordnaam
  // noemt vaak DDR5, een koelernaam vaak de CPU-socket).
  const order: ComponentType[] = [
    "motherboard", "gpu", "cpu", "psu", "cooling", "storage", "ram", "case",
  ];
  for (const cat of order) {
    if (matchesCategory(name, cat)) return cat;
  }
  return null;
}

export function isComponentType(value: string | null): value is ComponentType {
  return (
    value !== null &&
    ["cpu", "gpu", "motherboard", "ram", "storage", "psu", "case", "cooling"].includes(value)
  );
}
