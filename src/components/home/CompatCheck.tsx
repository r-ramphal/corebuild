import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Activity, MonitorPlay, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Gamepad2,
    title: "FPS per game & resolutie",
    description: "Van competitief op 1080p tot zwaar AAA op 4K — zie wat je haalt.",
  },
  {
    icon: Activity,
    title: "Bottleneck-analyse",
    description: "Een balansmeter laat zien of CPU en videokaart elkaar afremmen.",
  },
  {
    icon: MonitorPlay,
    title: "Monitor- & voedingsadvies",
    description: "De juiste Hz en wattage bij jouw onderdelen, automatisch berekend.",
  },
];

export function CompatCheck() {
  return (
    <section className="bg-surface-container-low py-20 px-4 sm:px-8 overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <Image
            src="/images/feature-pc.png"
            alt="Binnenkant van een high-end gaming PC met CPU-koeler en RGB-verlichting"
            width={960}
            height={640}
            className="rounded-xl border border-outline-variant shadow-2xl relative z-10 w-full h-auto"
          />

          {/* Zwevend voorbeeld-kaartje: build-intelligentie in actie */}
          <div className="absolute z-20 -bottom-5 -right-3 sm:right-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 w-52 animate-float">
            <p className="font-label-technical text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
              RTX 4070 + Ryzen 7
            </p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-display-lg text-[28px] leading-none text-on-surface">132</span>
              <span className="font-label-technical text-[11px] text-on-surface-variant">fps · 1440p</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-success-emerald rounded-full" style={{ width: "82%" }} />
            </div>
            <p className="font-label-technical text-[10px] text-success-emerald uppercase tracking-wider">
              Mooi uitgebalanceerd
            </p>
          </div>
        </div>

        <div>
          <span className="font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded mb-6 inline-block">
            BUILD-INTELLIGENTIE
          </span>

          <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">
            Zie wat je build écht presteert.
          </h2>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            CoreBuild herkent je gekozen onderdelen en rekent live uit hoeveel frames per seconde
            je haalt, of er een bottleneck is en welke monitor en voeding erbij passen.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-title-md text-title-md block text-on-surface">{title}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/builder"
            className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-primary text-on-primary rounded-lg font-title-md text-title-md hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Start je build <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
