/**
 * Build-prijsindex (puur, geen DB → los testbaar).
 *
 * De prijs van een hele build = de som van de laagste prijs per onderdeel.
 * `price_history` meet alleen op de momenten dat een onderdeel gescrapet werd,
 * en verschillende onderdelen worden op verschillende dagen gemeten. Om daar
 * één doorlopende "wat kost deze build per dag"-lijn van te maken gebruiken we
 * LOCF (last-observation-carried-forward): elk onderdeel draagt zijn laatst
 * bekende prijs mee tot er een nieuwe meting is.
 *
 * Eerlijk over dekking: alleen onderdelen mét prijshistorie tellen mee
 * (`partsTracked`), en de index start pas op de dag dat álle getrackte
 * onderdelen minstens één meting hebben — zodat de som steeds compleet is.
 */

export interface PartDayPoints {
  slot: string;
  /** Laagste gemeten prijs (centen) per dag (YYYY-MM-DD), over de retailers van dit onderdeel. */
  byDay: Map<string, number>;
}

export interface BuildIndexPoint {
  day: string;
  totalCents: number;
}

function addDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function computeBuildIndex(
  parts: PartDayPoints[],
  today: string
): { points: BuildIndexPoint[]; partsTracked: number } {
  const tracked = parts.filter((p) => p.byDay.size > 0);
  if (tracked.length === 0) return { points: [], partsTracked: 0 };

  const series = tracked.map((p) => {
    const days = [...p.byDay.keys()].sort();
    return { days, byDay: p.byDay, earliest: days[0] };
  });
  // De index begint pas als élk getrackt onderdeel data heeft (= laatste eerste-meting).
  const startDay = series.map((s) => s.earliest).sort().at(-1)!;
  if (startDay > today) return { points: [], partsTracked: tracked.length };

  const ptr = series.map(() => 0);
  const last = series.map(() => 0);
  const points: BuildIndexPoint[] = [];

  let day = startDay;
  for (let guard = 0; day <= today && guard < 400; guard++) {
    let total = 0;
    for (let i = 0; i < series.length; i++) {
      const s = series[i];
      while (ptr[i] < s.days.length && s.days[ptr[i]] <= day) {
        last[i] = s.byDay.get(s.days[ptr[i]])!;
        ptr[i]++;
      }
      total += last[i];
    }
    points.push({ day, totalCents: total });
    day = addDay(day);
  }

  return { points, partsTracked: tracked.length };
}

export type BuildIndexSignal = "low" | "near" | "falling" | "neutral";

export interface BuildIndexSummary {
  currentCents: number;
  minCents: number;
  maxCents: number;
  lowestDay: string;
  /** Hoeveel procent de huidige prijs boven het laagste punt ligt. */
  pctAboveLow: number;
  signal: BuildIndexSignal;
}

export function summarizeBuildIndex(points: BuildIndexPoint[]): BuildIndexSummary | null {
  if (points.length < 2) return null;

  const current = points[points.length - 1].totalCents;
  let minCents = points[0].totalCents;
  let maxCents = points[0].totalCents;
  let lowestDay = points[0].day;
  for (const p of points) {
    if (p.totalCents < minCents) {
      minCents = p.totalCents;
      lowestDay = p.day;
    }
    if (p.totalCents > maxCents) maxCents = p.totalCents;
  }

  const pctAboveLow = minCents > 0 ? ((current - minCents) / minCents) * 100 : 0;
  // Trend t.o.v. ~14 dagen terug (of het eerste punt als de reeks korter is).
  const ref = points[Math.max(0, points.length - 15)].totalCents;

  let signal: BuildIndexSignal;
  if (current <= minCents * 1.005) signal = "low";
  else if (pctAboveLow <= 3) signal = "near";
  else if (current < ref) signal = "falling";
  else signal = "neutral";

  return { currentCents: current, minCents, maxCents, lowestDay, pctAboveLow, signal };
}
