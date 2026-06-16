import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EXAMPLE_BUILDS } from "@/lib/example-builds";
import { COMPONENT_META } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Voorbeeldbuilds — complete pc's per budget",
  description:
    "Kant-en-klare voorbeeld-pc's voor elk budget en gebruik: van budget-gamer tot 4K-powerhouse en creator-workstation. Vergelijk de onderdelen of stel je eigen pc samen.",
  alternates: { canonical: "/voorbeeldbuilds" },
  openGraph: {
    title: "Voorbeeldbuilds | CoreBuild",
    description:
      "Complete voorbeeld-pc's per budget en gebruik. Bekijk de onderdelen of stel zelf samen.",
    url: "https://corebuildnl.com/voorbeeldbuilds",
  },
};

const eur = (n: number) => `€${n.toLocaleString("nl-NL")}`;

export default function VoorbeeldbuildsPage() {
  return (
    <main className="pt-16 min-h-screen bg-gp-bg text-gp-ink">
      {/* Header */}
      <section className="border-b border-gp-line">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-12 sm:py-16">
          <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-4">
            <span className="text-gp-orange">_</span>voorbeeldbuilds
          </p>
          <h1 className="font-mont font-extrabold text-[30px] sm:text-[42px] leading-tight mb-4">
            Complete pc&apos;s per budget
          </h1>
          <p className="font-plex text-[14px] text-gp-ink-soft max-w-2xl leading-relaxed">
            Met de hand samengestelde voorbeeld-pc&apos;s voor elk budget en gebruik. Neem een build als
            startpunt en pas hem aan in de builder. De bedragen zijn een <strong className="text-gp-ink">indicatie</strong> en
            schommelen met de dagprijzen (vooral geheugen en videokaart). De actuele prijs per
            onderdeel staat op elke regel.
          </p>
        </div>
      </section>

      {/* Build-kaarten */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {EXAMPLE_BUILDS.map((build) => (
            <article key={build.slug} className="border border-gp-line bg-gp-bg-soft flex flex-col">
              {/* Oranje pixel-kopbalk */}
              <div className="gp-bar flex items-center justify-between px-4 py-2">
                <span className="font-pixel text-[16px] tracking-wide leading-none">{build.name}</span>
                <span className="font-plex text-[11px] uppercase tracking-wider opacity-90">
                  {build.useCase}
                </span>
              </div>

              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <p className="font-plex text-[13px] text-gp-ink-soft leading-relaxed mb-5">
                  {build.tagline}
                </p>

                {/* Onderdelenlijst — klik om te bekijken/vergelijken */}
                <ul className="border-t border-gp-line mb-6">
                  {build.parts.map((part) => (
                    <li key={part.type} className="border-b border-gp-line">
                      <Link
                        href={`/zoeken?q=${encodeURIComponent(part.name)}`}
                        className="flex items-center gap-3 py-2.5 group"
                      >
                        <span className="font-plex text-[10px] uppercase tracking-wider text-gp-ink-soft w-20 shrink-0">
                          {COMPONENT_META[part.type].shortLabel}
                        </span>
                        <span className="font-mont font-bold text-[13px] flex-1 leading-tight group-hover:text-gp-orange transition-colors">
                          {part.name}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gp-ink-soft group-hover:text-gp-orange transition-colors shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <span className="font-plex text-[11px] uppercase tracking-wider text-gp-ink-soft block mb-1">
                      Indicatie
                    </span>
                    <span className="font-mont font-extrabold text-[24px] leading-none">
                      ~{eur(build.budgetEur)}
                    </span>
                    <span className="font-plex text-[10px] text-gp-ink-soft block mt-1">
                      schommelt met dagprijzen
                    </span>
                  </div>
                  <Link
                    href="/builder"
                    className="bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[12px] uppercase tracking-wider px-5 py-3 inline-flex items-center gap-2 transition-colors shrink-0"
                  >
                    Stel samen <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA naar smart generate */}
        <div className="border border-gp-line bg-gp-bg-soft mt-6 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-mont font-extrabold text-[18px] sm:text-[20px] mb-1">Liever op maat?</h2>
            <p className="font-plex text-[13px] text-gp-ink-soft max-w-xl leading-relaxed">
              De builder stelt met &quot;smart generate&quot; automatisch een compatibele pc samen op basis van
              je budget en gebruik, uit échte producten met actuele prijzen.
            </p>
          </div>
          <Link
            href="/builder"
            className="shrink-0 border border-gp-ink hover:bg-gp-ink hover:text-white font-plex text-[12px] uppercase tracking-wider px-6 py-3 inline-flex items-center gap-2 transition-colors"
          >
            Naar de builder <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
