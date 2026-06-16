import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

/**
 * Featured build: een concrete voorbeeld-samenstelling met zichtbare onderdelen.
 * Elke regel linkt door naar de zoek-/vergelijkpagina voor dat onderdeel, zodat
 * bezoekers meteen zien waaruit een build bestaat en kunnen doorklikken.
 */
const FEATURED: { type: ComponentType; name: string }[] = [
  { type: "cpu", name: "AMD Ryzen 7 9800X3D" },
  { type: "gpu", name: "GeForce RTX 5070 Ti" },
  { type: "motherboard", name: "B650 ATX moederbord" },
  { type: "ram", name: "32GB DDR5-6000" },
  { type: "storage", name: "2TB NVMe SSD" },
  { type: "psu", name: "850W 80+ Gold" },
  { type: "case", name: "Fractal Design North" },
  { type: "cooling", name: "Arctic Liquid Freezer III 360" },
];

export function GiastShowcase() {
  return (
    <section className="bg-gp-bg border-b border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-20">
        <div className="border border-gp-line">
          {/* Oranje pixel-kopbalk */}
          <div className="gp-bar flex items-center justify-between px-4 py-2">
            <span className="font-pixel text-[16px] tracking-wide leading-none">Featured build</span>
            <span className="font-plex text-[11px] uppercase tracking-wider opacity-90">1440p gaming</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative min-h-[280px] md:min-h-full bg-gp-ink">
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
              <h3 className="font-mont font-extrabold text-[22px] sm:text-[26px] leading-tight mb-5">
                Dit zit erin.
              </h3>

              {/* Onderdelenlijst — klik om te bekijken/vergelijken */}
              <ul className="border-t border-gp-line mb-7">
                {FEATURED.map(({ type, name }) => (
                  <li key={type} className="border-b border-gp-line">
                    <Link
                      href={`/zoeken?q=${encodeURIComponent(name)}`}
                      className="flex items-center gap-3 py-2.5 group"
                    >
                      <span className="font-plex text-[10px] uppercase tracking-wider text-gp-ink-soft w-16 shrink-0">
                        {COMPONENT_META[type].shortLabel}
                      </span>
                      <span className="font-mont font-bold text-[13px] sm:text-[14px] flex-1 leading-tight group-hover:text-gp-orange transition-colors">
                        {name}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gp-ink-soft group-hover:text-gp-orange transition-colors shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/builder"
                  className="bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[13px] uppercase tracking-wider px-7 py-4 inline-flex items-center gap-2 transition-colors"
                >
                  Stel zelf samen <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/voorbeeldbuilds"
                  className="font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft hover:text-gp-orange transition-colors inline-flex items-center gap-1.5"
                >
                  Meer voorbeeldbuilds <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
