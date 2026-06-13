/**
 * Genereert een leesbare, deels educatieve omschrijving van een product op
 * basis van de gedetecteerde specs. Retailers leveren geen omschrijvingen, dus
 * bouwen we er zelf een uit het model + categorie. Alles is feitelijk of
 * expliciet een *indicatie*; geen marketingtaal.
 */
import type { ComponentType } from "@/lib/types";
import {
  detectCpu, detectGpu, detectRamGb, detectDdr, detectSocket,
  detectPsuWatts, detectFormFactor,
} from "./detect";

export interface SpecRow {
  label: string;
  value: string;
}

export interface GlossaryItem {
  term: string;
  explain: string;
}

export interface ProductDescription {
  summary: string;
  specs: SpecRow[];
  goodFor: string[];
  note?: string;
  /** Korte uitleg van vaktermen — voor wie nog leert. */
  learn: GlossaryItem[];
  /** True als de tekst uit herkende specs komt (i.p.v. generiek). */
  detailed: boolean;
}

const BRAND_LABEL: Record<string, string> = { nvidia: "NVIDIA", amd: "AMD", intel: "Intel" };

export function describeProduct(name: string, category: ComponentType): ProductDescription {
  switch (category) {
    case "cpu":
      return describeCpu(name);
    case "gpu":
      return describeGpu(name);
    case "ram":
      return describeRam(name);
    case "psu":
      return describePsu(name);
    case "motherboard":
      return describeMotherboard(name);
    case "storage":
      return describeStorage(name);
    case "case":
      return describeCase(name);
    case "cooling":
      return describeCooling(name);
    default:
      return generic(category);
  }
}

function describeCpu(name: string): ProductDescription {
  const c = detectCpu(name);
  if (!c) return generic("cpu");

  const tier =
    c.gamingIndex >= 90 ? "Hij hoort bij de snelste processors voor gaming die je nu kunt kopen."
    : c.gamingIndex >= 78 ? "Een sterke keuze voor high-fps gaming en zwaardere taken."
    : c.gamingIndex >= 60 ? "Een prima allrounder voor gaming op 1080p en 1440p."
    : "Een instapprocessor voor lichtere games en alledaags gebruik.";

  const goodFor = ["Gamen"];
  if (c.multiIndex >= 85) goodFor.push("Renderen & zwaar multitasken");
  else if (c.multiIndex >= 70) goodFor.push("Streamen & multitasken");
  if (c.igpu) goodFor.push("Werkt ook zónder losse videokaart");

  return {
    detailed: true,
    summary: `De ${c.label} is een ${BRAND_LABEL[c.brand]}-processor met ${c.cores} kernen en ${c.threads} threads op socket ${c.socket} (${c.ddr}-geheugen). ${tier}`,
    specs: [
      { label: "Kernen / threads", value: `${c.cores} / ${c.threads}` },
      { label: "Socket", value: c.socket },
      { label: "Geheugentype", value: c.ddr },
      { label: "Verbruik (TDP)", value: `~${c.tdp} W` },
      { label: "Geïntegreerde GPU", value: c.igpu ? "Ja" : "Nee" },
      { label: "Gaming-index", value: `${c.gamingIndex}/100 (indicatie)` },
    ],
    goodFor,
    note: `Voor een werkend systeem heb je een moederbord met socket ${c.socket} en ${c.ddr}-geheugen nodig.`,
    learn: [
      { term: "Kernen & threads", explain: "Kernen zijn de aparte rekeneenheden; threads zijn de taken die ze tegelijk aankunnen. Meer = beter voor zwaar multitasken en renderen." },
      { term: "Socket", explain: "De fysieke aansluiting op het moederbord. CPU en moederbord moeten dezelfde socket hebben." },
    ],
  };
}

function describeGpu(name: string): ProductDescription {
  const g = detectGpu(name);
  if (!g) return generic("gpu");

  const target =
    g.index >= 78 ? "vlot 4K-gaming op hoge instellingen"
    : g.index >= 55 ? "1440p-gaming op hoge framerates, en 4K met wat concessies"
    : g.index >= 38 ? "soepel 1080p-gamen op hoog en instap-1440p"
    : "1080p-gaming op medium tot hoge instellingen";

  const goodFor: string[] = [];
  if (g.index >= 78) goodFor.push("4K gaming", "Zware AAA-titels op ultra");
  else if (g.index >= 55) goodFor.push("1440p gaming", "High-fps 1080p");
  else if (g.index >= 38) goodFor.push("1080p gaming op hoog", "Instap 1440p");
  else goodFor.push("1080p gaming", "E-sports op hoge fps");
  if (g.brand === "nvidia" && g.index >= 55) goodFor.push("Ray tracing & DLSS");

  return {
    detailed: true,
    summary: `De ${g.label} van ${BRAND_LABEL[g.brand]} heeft ${g.vramGb}GB videogeheugen en is gemaakt voor ${target}.`,
    specs: [
      { label: "Videogeheugen", value: `${g.vramGb} GB` },
      { label: "Verbruik (TDP)", value: `~${g.tdp} W` },
      { label: "Aanbevolen voeding", value: `${g.recommendedPsu} W` },
      { label: "Prestatie-index", value: `${g.index}/100 (indicatie)` },
      { label: "Generatie", value: `${g.releaseYear}` },
    ],
    goodFor,
    note: `Reken op een voeding van minstens ${g.recommendedPsu}W voor een systeem met deze videokaart. Gebruik de PC Builder om de exacte FPS bij jouw CPU te zien.`,
    learn: [
      { term: "VRAM (videogeheugen)", explain: "Geheugen op de videokaart zelf. Meer VRAM helpt bij hoge resoluties en textuur-instellingen. 8GB is genoeg voor 1080p, 12–16GB is fijner voor 1440p/4K." },
      { term: "Prestatie-index", explain: "Onze relatieve maat (0–100) om videokaarten snel te vergelijken. Gebaseerd op publieke benchmark-gemiddelden — een indicatie, geen exacte meting." },
    ],
  };
}

function describeRam(name: string): ProductDescription {
  const gb = detectRamGb(name);
  const ddr = detectDdr(name);
  const specs: SpecRow[] = [];
  if (gb) specs.push({ label: "Capaciteit", value: `${gb} GB` });
  if (ddr) specs.push({ label: "Type", value: ddr });

  const advice =
    gb && gb >= 32 ? "32GB is ruim voldoende, ook voor streamen en zwaar multitasken."
    : gb && gb >= 16 ? "16GB is de zoete plek voor de meeste gamers."
    : gb ? `${gb}GB is krap voor moderne games — overweeg 16GB of meer.`
    : "Voor gaming is 16GB de aanrader, 32GB voor zwaarder werk.";

  return {
    detailed: Boolean(gb || ddr),
    summary: `Werkgeheugen (RAM) bewaart de gegevens waar je systeem actief mee bezig is. ${advice}`,
    specs,
    goodFor: ["Gamen", "Multitasken", gb && gb >= 32 ? "Streamen & renderen" : ""].filter(Boolean) as string[],
    note: ddr ? `Let op: ${ddr} werkt alleen op een moederbord en CPU die ${ddr} ondersteunen.` : undefined,
    learn: [
      { term: "DDR4 vs DDR5", explain: "Twee generaties geheugen. DDR5 is nieuwer en sneller, maar je CPU én moederbord moeten het ondersteunen — ze zijn niet onderling uitwisselbaar." },
      { term: "Dual channel", explain: "Twee reepjes geheugen samen zijn sneller dan één enkele. Een kit van 2×8GB is daarom vaak beter dan 1×16GB." },
    ],
  };
}

function describePsu(name: string): ProductDescription {
  const w = detectPsuWatts(name);
  return {
    detailed: Boolean(w),
    summary: w
      ? `Deze voeding levert ${w} watt en is daarmee geschikt voor systemen die ongeveer tot ${Math.round(w * 0.65)}W verbruiken — met comfortabele marge.`
      : "De voeding (PSU) levert stroom aan alle onderdelen. Kies altijd wat extra wattage als marge voor stabiliteit en stilte.",
    specs: w ? [{ label: "Vermogen", value: `${w} W` }] : [],
    goodFor: [],
    note: "Een 80+-certificaat (Bronze/Gold/Platinum) zegt iets over de efficiëntie: hoe hoger, hoe minder energieverlies.",
    learn: [
      { term: "Wattage-marge", explain: "Kies een voeding met ~30–50% meer wattage dan je systeem trekt. Dat geeft stabiliteit, stillere ventilatoren en ruimte voor toekomstige upgrades." },
    ],
  };
}

function describeMotherboard(name: string): ProductDescription {
  const socket = detectSocket(name);
  const ddr = detectDdr(name);
  const form = detectFormFactor(name);
  const specs: SpecRow[] = [];
  if (socket) specs.push({ label: "Socket", value: socket });
  if (ddr) specs.push({ label: "Geheugentype", value: ddr });
  if (form) specs.push({ label: "Formaat", value: form });

  return {
    detailed: Boolean(socket || ddr || form),
    summary: `Het moederbord verbindt al je onderdelen. ${socket ? `Dit bord gebruikt socket ${socket}` : "Let op de socket"}${ddr ? ` en ${ddr}-geheugen` : ""}${form ? ` in ${form}-formaat` : ""}.`,
    specs,
    goodFor: [],
    note: socket ? `Je CPU moet socket ${socket} hebben, en je RAM moet ${ddr ?? "het juiste DDR-type"} zijn.` : undefined,
    learn: [
      { term: "Formfactor", explain: "De maat van het bord (ATX, Micro-ATX, Mini-ITX). Het moet in je behuizing passen — een ATX-bord past niet in een Mini-ITX-kast." },
    ],
  };
}

function describeStorage(name: string): ProductDescription {
  const isNvme = /\bnvme\b|m\.?2/i.test(name);
  const isSsd = /\bssd\b/i.test(name);
  const isHdd = /\bhdd\b|harde schijf/i.test(name);
  const type = isNvme ? "NVMe-SSD" : isSsd ? "SSD" : isHdd ? "harde schijf (HDD)" : "opslag";
  const summary = isNvme
    ? "Een NVMe-SSD is de snelste opslag: razendsnel opstarten en games laden in seconden."
    : isSsd
      ? "Een SSD is veel sneller dan een harde schijf en ideaal als systeemschijf."
      : isHdd
        ? "Een harde schijf biedt veel ruimte voor weinig geld, maar is trager — handig als extra opslag."
        : "Opslag bewaart je besturingssysteem, games en bestanden.";
  return {
    detailed: isNvme || isSsd || isHdd,
    summary,
    specs: [{ label: "Type", value: type }],
    goodFor: isHdd ? ["Massa-opslag", "Back-ups"] : ["Systeemschijf", "Games", "Snel laden"],
    learn: [
      { term: "NVMe vs SATA", explain: "NVMe-SSD's (via M.2) zijn veel sneller dan oudere SATA-SSD's. Voor je systeemschijf is NVMe de aanrader." },
    ],
  };
}

function describeCase(name: string): ProductDescription {
  const form = detectFormFactor(name);
  return {
    detailed: Boolean(form),
    summary: `De behuizing huisvest en koelt je onderdelen.${form ? ` Dit is een ${form}-model.` : ""} Let op dat je moederbord en videokaart erin passen.`,
    specs: form ? [{ label: "Formaat", value: form }] : [],
    goodFor: [],
    note: "Controleer de maximale videokaartlengte en koelerhoogte van de behuizing voordat je koopt.",
    learn: [
      { term: "Airflow", explain: "Goede luchtstroom (mesh-front, genoeg ventilatoren) houdt je onderdelen koeler en daarmee sneller en stiller." },
    ],
  };
}

function describeCooling(name: string): ProductDescription {
  const isAio = /\baio\b|waterkoel|liquid/i.test(name);
  return {
    detailed: true,
    summary: isAio
      ? "Dit is een AIO-waterkoeling: een gesloten waterkoelsysteem dat warmte efficiënt afvoert, ideaal voor warme processors."
      : "Een CPU-koeler houdt je processor op temperatuur. Een goede koeler voorkomt dat je CPU terugschakelt onder belasting.",
    specs: [{ label: "Type", value: isAio ? "AIO-waterkoeling" : "Luchtkoeler" }],
    goodFor: isAio ? ["Warme/krachtige CPU's", "Stille high-end builds"] : ["De meeste builds", "Betrouwbaar & onderhoudsvrij"],
    learn: [
      { term: "Lucht vs water", explain: "Luchtkoelers zijn simpel en betrouwbaar; AIO-waterkoeling koelt zware CPU's stiller, maar is duurder. Voor de meeste builds volstaat een goede luchtkoeler." },
    ],
  };
}

function generic(category: ComponentType): ProductDescription {
  const text: Record<ComponentType, string> = {
    cpu: "De processor (CPU) is het rekenhart van je pc en bepaalt sterk je gaming- en werkprestaties.",
    gpu: "De videokaart (GPU) rendert je beeld en is de belangrijkste factor voor je FPS in games.",
    ram: "Werkgeheugen (RAM) bewaart de gegevens waar je systeem actief mee bezig is.",
    storage: "Opslag bewaart je besturingssysteem, games en bestanden — een SSD maakt alles merkbaar sneller.",
    psu: "De voeding (PSU) levert stabiele stroom aan al je onderdelen.",
    motherboard: "Het moederbord verbindt en voedt al je onderdelen.",
    case: "De behuizing huisvest en koelt je onderdelen.",
    cooling: "Koeling houdt je processor op temperatuur voor stabiele prestaties.",
  };
  return { detailed: false, summary: text[category], specs: [], goodFor: [], learn: [] };
}
