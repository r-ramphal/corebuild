import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Featured build in het giastpc product-kaart-patroon: oranje pixel-kop + foto. */
export function GiastShowcase() {
  return (
    <section className="bg-gp-bg border-b border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-20">
        <div className="border border-gp-line">
          {/* Oranje pixel-kopbalk */}
          <div className="gp-bar flex items-center justify-between px-4 py-2">
            <span className="font-pixel text-[16px] tracking-wide leading-none">Featured build</span>
            <span className="font-plex text-[11px] uppercase tracking-wider opacity-90">_showcase</span>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[280px] md:min-h-[360px] bg-gp-ink">
              <Image
                src="/images/hero/showcase-a.webp"
                alt="Complete CoreBuild-samenstelling met videokaart en waterkoeling"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gp-orange" />
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gp-orange" />
            </div>

            <div className="p-8 sm:p-10 flex flex-col justify-center bg-gp-bg-soft">
              <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-4">
                <span className="text-gp-orange">_</span>compatibel &amp; geprijsd
              </p>
              <h3 className="font-mont font-extrabold text-[24px] sm:text-[30px] leading-tight mb-4">
                Samengesteld, niet zomaar gekozen.
              </h3>
              <p className="font-plex text-[14px] leading-relaxed text-gp-ink-soft mb-7">
                Elke build wordt automatisch op compatibiliteit gecheckt en op prijs vergeleken bij
                5 retailers. Jij kiest de onderdelen, wij doen de controle.
              </p>
              <Link
                href="/builder"
                className="self-start bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[13px] uppercase tracking-wider px-7 py-4 inline-flex items-center gap-2 transition-colors"
              >
                Start je build <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
