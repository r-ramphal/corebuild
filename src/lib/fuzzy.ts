/**
 * Lichte fuzzy-matching voor zoeksuggesties ("bedoelde je…?").
 *
 * De suggestie-index matchte alleen op prefix/contains, dus een typefout
 * ("ryzne 7", "geforce rtx 5070" met een verschrijving) gaf niets. Deze module
 * voegt tolerantie toe op woordniveau. Belangrijk: **modelnummers (cijfers)
 * moeten exact kloppen** — "5070" mag nooit als "5080" doorgaan, dat is een
 * ander product. Alleen alfabetische woorden krijgen edit-afstand-tolerantie.
 */

/** Optimal String Alignment-afstand (Levenshtein + transpositie van buren). */
export function editDistance(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Toegestane edit-afstand per woord. Cijfers → 0 (modelnummers exact). */
function tolerance(token: string): number {
  if (/\d/.test(token)) return 0;
  if (token.length <= 4) return 1;
  return 2;
}

/**
 * True als elk woord uit de query (fuzzy) terugkomt in het label. Geschikt als
 * fallback wanneer prefix/contains niets oplevert.
 */
export function fuzzyTokenMatch(query: string, label: string): boolean {
  const q = tokens(query);
  if (q.length === 0) return false;
  const l = tokens(label);
  if (l.length === 0) return false;
  return q.every((qt) => l.some((lt) => qt === lt || editDistance(qt, lt) <= tolerance(qt)));
}

/**
 * Dichtstbijzijnde kandidaat waarvan álle query-woorden fuzzy matchen, gekozen
 * op de laagste totale edit-afstand. `null` als niets binnen tolerantie valt.
 */
export function closestTerm(query: string, candidates: string[]): string | null {
  const q = tokens(query);
  if (q.length === 0) return null;

  let best: { value: string; dist: number } | null = null;
  for (const c of candidates) {
    const l = tokens(c);
    if (l.length === 0) continue;
    let total = 0;
    let allMatch = true;
    for (const qt of q) {
      let bd = Infinity;
      for (const lt of l) bd = Math.min(bd, qt === lt ? 0 : editDistance(qt, lt));
      if (bd > tolerance(qt)) {
        allMatch = false;
        break;
      }
      total += bd;
    }
    if (allMatch && (!best || total < best.dist)) best = { value: c, dist: total };
  }
  return best ? best.value : null;
}
