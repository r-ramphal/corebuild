/**
 * Bouwt de moederbord-referentie (`src/lib/specs/data/motherboards.json`) uit de
 * Pawikoski PC-Components dataset (2021-snapshot, feitelijke socket/chipset-data).
 *
 * Bron: https://github.com/Pawikoski/PC-Components  (motherboards.json)
 * Gebruik: clone die repo en draai
 *   npx tsx scripts/build_motherboards.ts <pad-naar-motherboards.json>
 *
 * We bewaren bewust alleen de sockets die onze builder herkent (detect.ts) en de
 * durende socket↔chipset-relatie + een paar voorbeeldborden. Specifieke board-SKU's
 * uit 2021 zijn grotendeels EOL; chipsets (B550, X570, …) zijn nog wél courant en
 * vormen een betrouwbare zoekterm naar actuele listings.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Repo-socket → onze canonieke socket (detect.ts). Alleen deze houden we.
const SOCKET_MAP: Record<string, string> = {
  AM5: "AM5",
  AM4: "AM4",
  "LGA 1851": "LGA1851",
  "LGA 1700": "LGA1700",
  "LGA 1200": "LGA1200",
};

const MAX_BOARDS_PER_SOCKET = 12;

interface RawBoard {
  name: string;
  socket: string;
  chipset?: string;
}

function cleanChipset(chipset: string): string {
  // "AMD B550" / "Intel Z490" → "B550" / "Z490" (compacte, durende zoekterm)
  return chipset.replace(/^(AMD|Intel)\s+/i, "").trim();
}

function main() {
  const src = process.argv[2];
  if (!src) {
    console.error("Geef het pad naar motherboards.json mee.");
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(src, "utf8")) as RawBoard[];

  const bySocket = new Map<string, { boardsByChipset: Map<string, Set<string>> }>();

  for (const b of raw) {
    const socket = SOCKET_MAP[(b.socket ?? "").trim()];
    if (!socket) continue; // socket buiten onze vocabulaire → overslaan
    const name = (b.name ?? "").trim();
    if (!name) continue;
    const cs = b.chipset ? cleanChipset(b.chipset) : "";
    if (!cs) continue;
    const bucket = bySocket.get(socket) ?? { boardsByChipset: new Map<string, Set<string>>() };
    const set = bucket.boardsByChipset.get(cs) ?? new Set<string>();
    set.add(name);
    bucket.boardsByChipset.set(cs, set);
    bySocket.set(socket, bucket);
  }

  const sockets: Record<string, { chipsets: string[]; boards: string[] }> = {};
  for (const [socket, bucket] of bySocket) {
    // Chipsets gesorteerd op aantal borden (populairste eerst)
    const chipsets = [...bucket.boardsByChipset.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .map(([cs]) => cs);
    // Voorbeeldborden round-robin over chipsets → gevarieerd i.p.v. alfabetisch geklit
    const lists = chipsets.map((cs) => [...bucket.boardsByChipset.get(cs)!].sort());
    const boards: string[] = [];
    for (let i = 0; boards.length < MAX_BOARDS_PER_SOCKET; i++) {
      let added = false;
      for (const list of lists) {
        if (list[i]) {
          boards.push(list[i]);
          added = true;
          if (boards.length >= MAX_BOARDS_PER_SOCKET) break;
        }
      }
      if (!added) break;
    }
    sockets[socket] = { chipsets, boards };
  }

  const out = {
    _source:
      "github.com/Pawikoski/PC-Components (2021-snapshot, motherboards.json) — feitelijke socket/chipset-data, gefilterd op door de builder herkende sockets",
    sockets,
  };

  const dest = join(process.cwd(), "src/lib/specs/data/motherboards.json");
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");

  const summary = Object.entries(sockets)
    .map(([s, v]) => `${s}: ${v.chipsets.length} chipsets, ${v.boards.length} voorbeeldborden`)
    .join("\n  ");
  console.log(`Geschreven: ${dest}\n  ${summary}`);
}

main();
