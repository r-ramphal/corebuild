import Link from "next/link";
import { ArrowRight, Split, Store, Truck, TrendingDown } from "lucide-react";

/**
 * Homepage-sectie die de "Slim Kopen"-USP naar voren haalt: een pc koop je zelden
 * bij één winkel, dus CoreBuild verdeelt de build slim over retailers (incl.
 * verzending) voor het laagste totaal, en toont het prijsverloop. De cijfers zijn
 * een illustratief voorbeeld (1440p-build) — de echte berekening staat in de
 * builder (BuildCheckout) en op /voorbeeldbuilds.
 */
export function GiastSlimKopen() {
  return (
    <section className="bg-gp-bg-soft text-gp-ink border-b border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Tekst */}
        <div className="lg:col-span-5 min-w-0">
          <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-6">
            <span className="text-gp-orange">_</span>slim kopen
          </p>
          <h2 className="font-mont font-extrabold text-[30px] sm:text-[40px] leading-[1.05] mb-5">
            Een pc koop je zelden bij <span className="gp-highlight">één winkel</span>.
          </h2>
          <p className="font-plex text-[14px] leading-relaxed text-gp-ink-soft mb-7">
            CoreBuild verdeelt je build slim over de retailers — verzendkosten meegerekend — zodat je het
            láágste totaal betaalt. En het prijsverloop laat zien of nú een goed moment is om te kopen.
          </p>

          <ul className="space-y-3 mb-8">
            {[
              { icon: Split, text: "De slimste verdeling over winkels — laagste totaal" },
              { icon: Truck, text: "Verzendkosten per winkel automatisch meegerekend" },
              { icon: TrendingDown, text: "Prijsverloop van je hele build: koop op het juiste moment" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-gp-orange mt-0.5 shrink-0" />
                <span className="font-plex text-[13px] leading-snug text-gp-ink">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/builder"
              className="group inline-flex items-center justify-center gap-2 bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
            >
              Probeer het in de builder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/voorbeeldbuilds"
              className="inline-flex items-center justify-center gap-2 border border-gp-ink hover:bg-gp-ink hover:text-gp-bg text-gp-ink font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
            >
              Bekijk voorbeeldbuilds
            </Link>
          </div>
        </div>

        {/* Visual: één winkel vs slim verdeeld */}
        <div className="lg:col-span-7 min-w-0">
          <div className="border border-gp-line bg-gp-bg overflow-hidden">
            {/* Titelbalk */}
            <div className="gp-bar flex items-center justify-between px-4 py-2">
              <span className="font-pixel text-[15px] leading-none tracking-wide">slim-kopen</span>
              <span className="font-plex text-[10px] uppercase tracking-wider opacity-90">
                voorbeeld · 1440p-build
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Eén winkel */}
                <div className="border border-gp-line p-3.5">
                  <p className="flex items-center gap-1.5 font-plex text-[10px] uppercase tracking-wider text-gp-ink-soft mb-2">
                    <Store className="w-3.5 h-3.5" /> Alles bij 1 winkel
                  </p>
                  <p className="font-mont font-extrabold text-[22px] sm:text-[27px] leading-none">
                    € 1.890
                  </p>
                  <p className="font-plex text-[11px] text-gp-ink-soft mt-2">bij Azerty · incl. verzending</p>
                </div>

                {/* Slim verdeeld (aanbevolen) */}
                <div className="border-2 border-gp-orange p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 font-plex text-[10px] uppercase tracking-wider text-gp-ink-soft">
                      <Split className="w-3.5 h-3.5" /> Slim verdeeld
                    </span>
                    <span className="font-plex text-[10px] uppercase tracking-wider bg-gp-orange text-white px-2 py-0.5">
                      bespaar €110
                    </span>
                  </div>
                  <p className="font-mont font-extrabold text-[22px] sm:text-[27px] leading-none text-gp-orange">
                    € 1.780
                  </p>
                  <p className="font-plex text-[11px] text-gp-ink-soft mt-2">over 3 winkels · incl. verzending</p>
                </div>
              </div>

              {/* Prijsverloop-strip */}
              <div className="border-t border-gp-line pt-3.5 flex items-center gap-3.5">
                <svg
                  viewBox="0 0 120 36"
                  className="w-[120px] h-9 shrink-0"
                  fill="none"
                  aria-hidden
                >
                  <polyline
                    points="0,8 20,14 40,10 60,20 80,18 100,28 120,30"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gp-ink-soft"
                  />
                  <circle cx="120" cy="30" r="3" className="fill-gp-orange" />
                </svg>
                <p className="font-plex text-[11px] leading-snug text-gp-ink-soft">
                  <span className="text-gp-orange">●</span> Nu op het laagste punt in 30 dagen — goed moment
                  om te kopen.
                </p>
              </div>
            </div>
          </div>
          <p className="font-plex text-[10px] text-gp-ink-soft mt-2.5">
            Voorbeeld ter illustratie. In de builder rekent CoreBuild dit live uit voor jóúw onderdelen.
          </p>
        </div>
      </div>
    </section>
  );
}
