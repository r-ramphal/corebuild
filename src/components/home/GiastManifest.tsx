import Link from "next/link";

/** Manifest-blok in giastpc-stijl: grote mono/Montserrat-statement met oranje highlights. */
export function GiastManifest() {
  return (
    <section className="bg-gp-bg text-gp-ink">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-24">
        <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-10">
          <span className="text-gp-orange">_</span>manifest
        </p>

        <p className="font-mont font-bold text-[26px] sm:text-[38px] leading-[1.25] max-w-4xl">
          Wij geloven niet in <span className="gp-highlight">standaardoplossingen</span>. Elke build wordt
          samengesteld als <span className="gp-highlight">één geheel</span> — getest op compatibiliteit,
          vergeleken op prijs, en altijd met de bouwer in het <span className="gp-highlight">middelpunt</span>.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mt-14">
          <p className="font-mont font-extrabold text-[30px] sm:text-[44px] leading-none">
            Kies geen pc. <span className="text-gp-orange">Bouw &apos;m.</span>
            <span className="gp-caret" />
          </p>
          <Link
            href="/builder"
            className="self-start font-plex text-[13px] uppercase tracking-wider border-b-2 border-gp-orange pb-1 hover:text-gp-orange transition-colors whitespace-nowrap"
          >
            Start je configuratie →
          </Link>
        </div>
      </div>
    </section>
  );
}
