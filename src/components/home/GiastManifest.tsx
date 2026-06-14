import Link from "next/link";

/** Manifest-blok in giastpc-stijl: grote mono/Montserrat-statement met oranje highlights. */
export function GiastManifest() {
  return (
    <section className="bg-gp-bg text-gp-ink">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-24">
        <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-10">
          <span className="text-gp-orange">_</span>manifest
        </p>

        <p className="font-plex font-medium text-[22px] sm:text-[32px] leading-[1.4] max-w-4xl text-gp-ink">
          Wij geloven niet in{" "}
          <span className="text-gp-orange font-semibold underline decoration-2 underline-offset-[6px]">
            standaardoplossingen
          </span>
          . Elke build wordt samengesteld als{" "}
          <span className="text-gp-orange font-semibold underline decoration-2 underline-offset-[6px]">
            één geheel
          </span>{" "}
          — getest op compatibiliteit, vergeleken op prijs, en altijd met de bouwer in het{" "}
          <span className="text-gp-orange font-semibold underline decoration-2 underline-offset-[6px]">
            middelpunt
          </span>
          .
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
