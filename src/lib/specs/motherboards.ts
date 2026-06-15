import data from "./data/motherboards.json";

/**
 * Moederbord-referentie per socket (socket↔chipset), afgeleid uit de Pawikoski
 * PC-Components dataset. Klein genoeg voor de client-bundle. We gebruiken vooral
 * de **chipsets** (B550, X570, …) — die zijn nog courant en vormen een goede
 * zoekterm naar actuele listings; specifieke 2021-board-SKU's zijn grotendeels EOL.
 * Zie `data/ATTRIBUTION.md`.
 */
interface SocketInfo {
  chipsets: string[];
  boards: string[];
}

const SOCKETS = (data as { sockets: Record<string, SocketInfo> }).sockets;

/** Gangbare chipsets voor een socket (populairste eerst), of een lege lijst. */
export function socketChipsets(socket: string): string[] {
  return SOCKETS[socket]?.chipsets ?? [];
}

/** Voorbeeld-moederborden voor een socket (referentie; kunnen EOL zijn). */
export function exampleBoards(socket: string): string[] {
  return SOCKETS[socket]?.boards ?? [];
}
