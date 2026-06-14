import Link from "next/link";
import { Boxes, Compass, CircleCheck, Cpu, CircuitBoard, MonitorPlay, Plus } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-28 px-4 sm:px-8">
      {/* Achtergrond-glow + fade naar de pagina-achtergrond */}
      <div className="cb-mesh absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-background" />

      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Links: pitch + zoeken + CTA's */}
        <div className="space-y-8 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 bg-surface-container-high border border-outline-variant/50 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              Live prijzen &amp; compatibiliteit
            </span>
          </span>

          <h1 className="font-headline-hero-mobile md:font-headline-hero text-headline-hero-mobile md:text-headline-hero text-text-primary">
            Bouw slimmer.
            <br />
            <span className="text-gradient">Betaal minder.</span>
          </h1>

          <p className="font-body-lg text-body-lg text-text-secondary max-w-lg">
            Stel je pc samen met een automatische compatibiliteitscheck en een visuele build,
            en vergelijk live de prijzen van de grootste Nederlandse retailers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/builder"
              className="bg-primary-container hover:bg-primary text-on-primary font-title-md text-[15px] px-8 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(75,142,255,0.3)] hover:shadow-[0_0_30px_rgba(75,142,255,0.5)]"
            >
              <Boxes className="w-5 h-5" /> Open de PC Builder
            </Link>
            <Link
              href="/galerij"
              className="border border-outline-variant hover:border-primary/50 text-on-surface bg-surface-container/50 hover:bg-surface-container font-title-md text-[15px] px-8 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Compass className="w-5 h-5" /> Bekijk voorbeelden
            </Link>
          </div>

          <div className="pt-2 max-w-lg">
            <HeroSearch />
          </div>
        </div>

        {/* Rechts: zwevende glas-buildkaart (decoratief, vaste mockdata) */}
        <div
          className="relative hidden lg:block animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
          aria-hidden="true"
        >
          <div className="glass-panel rounded-2xl p-6 relative z-10 rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Jouw build</h3>
              <span className="font-label-mono text-success-green flex items-center gap-1 text-sm">
                <CircleCheck className="w-4 h-4" /> Compatibel
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-surface-container p-3 rounded-xl border border-outline-variant/30">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs text-on-surface-variant">CPU</div>
                  <div className="font-body-md text-on-surface truncate">Intel Core i7-14700K</div>
                </div>
                <div className="font-label-mono text-primary">€419,00</div>
              </div>

              <div className="flex items-center gap-4 bg-surface-container p-3 rounded-xl border border-outline-variant/30">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary">
                  <CircuitBoard className="w-6 h-6" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs text-on-surface-variant">Moederbord</div>
                  <div className="font-body-md text-on-surface truncate">Gigabyte Z790 AERO G</div>
                </div>
                <div className="font-label-mono text-primary">€289,00</div>
              </div>

              <div className="flex items-center gap-4 bg-surface-container/30 border border-dashed border-outline-variant/50 p-3 rounded-xl">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-on-surface-variant/50">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <div className="font-body-md text-on-surface-variant/70">Kies een videokaart (GPU)</div>
                </div>
                <span className="text-primary bg-primary/10 p-2 rounded-lg">
                  <Plus className="w-5 h-5" />
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-between items-end">
              <div>
                <div className="text-sm text-on-surface-variant">Geschat verbruik</div>
                <div className="font-label-mono text-on-surface">320W</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-on-surface-variant">Totaal (live)</div>
                <div className="font-headline-md text-primary">€708,00</div>
              </div>
            </div>
          </div>

          {/* Decoratieve glows */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}
