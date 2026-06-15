import type { ComponentType } from "@/lib/types";

/**
 * Community-favorieten per slot: merken/modellen die in r/buildapc, PSU-tierlists
 * (Cultists Network) en reviews van Gamers Nexus / Hardware Unboxed structureel
 * worden aanbevolen. De generator geeft kandidaten die hieraan voldoen voorrang
 * (binnen budget + compatibel), zodat de voorgestelde build aansluit bij wat
 * ervaren bouwers zouden goedkeuren — i.p.v. simpelweg het goedkoopste onderdeel.
 *
 * Bewust kwalitatief (naam-patronen), geen harde whitelist: de catalogus wisselt,
 * dus we matchen op de bekende sterke series. Geen match → val terug op prijs.
 */
const RECOMMENDED: Partial<Record<ComponentType, RegExp>> = {
  // Value- en premium-koelers met een sterke reputatie (lucht + AIO).
  cooling:
    /peerless assassin|phantom spirit|frost commander|thermalright|noctua|\bnh-(d15|u12|l)|arctic liquid freezer|dark rock|pure rock 2|deepcool (ak|le|ld)|scythe (fuma|mugen)|hyper 212/i,
  // Voedingen uit de hogere tiers (betrouwbare OEM's, goede beveiliging).
  psu:
    /corsair (rm|rmx|rme|shift|sf)\b|seasonic|be quiet.*(pure power|straight power|dark power)|msi (mag|mpg).*(gold|a\d+g)|super flower|nzxt c\d|asus (tuf|rog).*(gold|thor)|gigabyte.*ud.*gold|thermalright.*(gold|tg)|fractal.*(ion|anode)/i,
  // Behuizingen met goede luchtstroom en bouwkwaliteit.
  case:
    /fractal.*(north|pop|meshify|torrent|define)|lian li.*(lancool|o11|dan)|montech.*(air|sky|king)|phanteks.*(g\d|eclipse|nv)|nzxt h[5679]|corsair.*(4000d|5000d|3000d|6500).*air|be quiet.*(pure base|shadow base)|hyte (y\d)|antec.*(flux|c8)/i,
  // Moederborden uit de gangbare aanbevolen series.
  motherboard:
    /tomahawk|mortar|\btuf gaming\b|\bprime\b|rog strix|aorus|gaming x|steel legend|pro rs|\bmag b\d|msi pro/i,
  // Bekende, betrouwbare geheugenkits.
  ram:
    /corsair vengeance|g\.?skill (trident|flare|ripjaws)|kingston fury|crucial (pro|ballistix)|team.?group.*(t-force|expert)|adata.*xpg/i,
  // SSD's met goede prestaties/uithoudingsvermogen.
  storage:
    /samsung (9\d0|860|870)|wd.?black.*sn\d|crucial (t500|t700|p3|p5|mx500)|kingston (kc3000|nv2|fury)|lexar nm\d|sk.?hynix|sn850|sn770/i,
};

/** Is dit onderdeel een community-favoriet voor zijn slot? */
export function isRecommended(type: ComponentType, name: string): boolean {
  const re = RECOMMENDED[type];
  return re ? re.test(name) : false;
}
