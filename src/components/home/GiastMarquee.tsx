const ITEMS = [
  "PRIJZEN VERGELIJKEN",
  "COMPATIBILITEIT GECHECKT",
  "5 RETAILERS",
  "BUILD OP MAAT",
  "GEEN COMPROMISSEN",
  "LIVE PRIJZEN",
];

/** Oneindig schuivende technische strip (CSS-marquee, pauzeert bij hover). */
export function GiastMarquee() {
  return (
    <div className="gp-marquee bg-gp-ink text-gp-bg overflow-hidden">
      <div className="gp-marquee-track py-3">
        {[0, 1].map((rep) => (
          <div key={rep} className="flex shrink-0" aria-hidden={rep === 1}>
            {ITEMS.map((t) => (
              <span
                key={t}
                className="flex items-center font-plex text-[12px] uppercase tracking-[0.18em] px-6"
              >
                {t}
                <span className="text-gp-orange ml-6">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
