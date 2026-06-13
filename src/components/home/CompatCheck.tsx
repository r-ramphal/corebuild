import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Boxes, Tag, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Automatische compatibiliteitscheck",
    description: "Socket, geheugentype, voeding en behuizing: we controleren of alles bij elkaar past.",
  },
  {
    icon: Boxes,
    title: "Visuele build",
    description: "Je onderdelen komen samen in een overzichtelijke weergave van je pc.",
  },
  {
    icon: Tag,
    title: "Live prijsvergelijking",
    description: "Per onderdeel de laagste prijs van de grote Nederlandse retailers.",
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

          {/* Zwevend voorbeeld-kaartje: compatibiliteit in actie */}
          <div className="absolute z-20 -bottom-5 -right-3 sm:right-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 w-56 animate-float">
            <div className="flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-success-emerald" />
              <span className="font-label-technical text-[11px] text-success-emerald uppercase tracking-wider">
                Compatibel
              </span>
            </div>
            <div className="space-y-1.5 font-label-technical text-[11px] text-on-surface-variant">
              <div className="flex justify-between"><span>Socket</span><span className="text-on-surface">AM5 ✓</span></div>
              <div className="flex justify-between"><span>Geheugen</span><span className="text-on-surface">DDR5 ✓</span></div>
              <div className="flex justify-between"><span>Voeding</span><span className="text-on-surface">~650W</span></div>
            </div>
          </div>
        </div>

        <div>
          <span className="font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded mb-6 inline-block">
            SLIM SAMENSTELLEN
          </span>

          <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">
            Stel zorgeloos je pc samen.
          </h2>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            CoreBuild herkent je gekozen onderdelen en controleert automatisch of ze bij elkaar
            passen, terwijl je build voor je ogen vorm krijgt en de prijzen live worden vergeleken.
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
