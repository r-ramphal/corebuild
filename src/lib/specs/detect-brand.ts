/**
 * Merkdetectie uit een (vrije) productnaam. Retailers leveren geen
 * gestructureerd merkveld, dus matchen we tegen een curated lijst van bekende
 * PC-merken. Meest specifieke/multi-word eerst zodat "Cooler Master" niet als
 * iets anders valt. Sub-merken (ROG/TUF→ASUS, AORUS→Gigabyte, FURY→Kingston,
 * XPG→ADATA, T-Force→TeamGroup) mappen naar het hoofdmerk.
 */
const BRANDS: { name: string; re: RegExp }[] = [
  { name: "be quiet!", re: /\bbe\s?quiet!?\b/i },
  { name: "Cooler Master", re: /\bcooler\s?master\b/i },
  { name: "Western Digital", re: /\bwestern\s?digital\b|\bwd[_\s-]?(black|blue|red|green|elements)\b|\bwd\b/i },
  { name: "Fractal Design", re: /\bfractal(\s?design)?\b/i },
  { name: "Lian Li", re: /\blian[\s-]?li\b/i },
  { name: "G.Skill", re: /\bg\.?\s?skill\b/i },
  { name: "ID-Cooling", re: /\bid[\s-]?cooling\b/i },
  { name: "TeamGroup", re: /\bteam\s?group\b|\bteamgroup\b|\bt-?force\b/i },
  { name: "ASRock", re: /\basrock\b/i },
  { name: "ASUS", re: /\b(asus|rog|tuf)\b/i },
  { name: "MSI", re: /\bmsi\b/i },
  { name: "Gigabyte", re: /\b(gigabyte|aorus)\b/i },
  { name: "Corsair", re: /\bcorsair\b/i },
  { name: "Kingston", re: /\b(kingston|fury)\b/i },
  { name: "Crucial", re: /\bcrucial\b/i },
  { name: "Samsung", re: /\bsamsung\b/i },
  { name: "Seagate", re: /\b(seagate|barracuda|ironwolf)\b/i },
  { name: "Lexar", re: /\blexar\b/i },
  { name: "SanDisk", re: /\bsandisk\b/i },
  { name: "Sabrent", re: /\bsabrent\b/i },
  { name: "Solidigm", re: /\bsolidigm\b/i },
  { name: "Kioxia", re: /\bkioxia\b/i },
  { name: "ADATA", re: /\b(adata|xpg)\b/i },
  { name: "Patriot", re: /\bpatriot\b/i },
  { name: "Seasonic", re: /\bseasonic\b/i },
  { name: "Thermaltake", re: /\bthermaltake\b/i },
  { name: "Thermalright", re: /\bthermalright\b/i },
  { name: "Noctua", re: /\bnoctua\b/i },
  { name: "Arctic", re: /\barctic\b/i },
  { name: "DeepCool", re: /\bdeepcool\b/i },
  { name: "Scythe", re: /\bscythe\b/i },
  { name: "NZXT", re: /\bnzxt\b/i },
  { name: "Phanteks", re: /\bphanteks\b/i },
  { name: "Montech", re: /\bmontech\b/i },
  { name: "Antec", re: /\bantec\b/i },
  { name: "Zotac", re: /\bzotac\b/i },
  { name: "Palit", re: /\bpalit\b/i },
  { name: "Gainward", re: /\bgainward\b/i },
  { name: "Sapphire", re: /\bsapphire\b/i },
  { name: "PowerColor", re: /\bpowercolor\b/i },
  { name: "XFX", re: /\bxfx\b/i },
  { name: "Inno3D", re: /\binno3d\b/i },
  { name: "PNY", re: /\bpny\b/i },
  { name: "EVGA", re: /\bevga\b/i },
  { name: "Biostar", re: /\bbiostar\b/i },
  { name: "AMD", re: /\b(amd|ryzen|radeon)\b/i },
  { name: "Intel", re: /\b(intel|core\s?i[3579]|arc)\b/i },
  { name: "NVIDIA", re: /\bnvidia\b/i },
];

/** Eerste herkende merk in de naam, of null. */
export function detectBrand(name: string): string | null {
  for (const b of BRANDS) if (b.re.test(name)) return b.name;
  return null;
}
