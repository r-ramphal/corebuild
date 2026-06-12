import Link from "next/link";
import Image from "next/image";
import {
  Cpu,
  Monitor,
  Layers,
  Database,
  HardDrive,
  Zap,
  Server,
  Wind,
  CircleCheck,
} from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { COMPONENT_TYPES, COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

const CATEGORY_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Layers,
  ram: Database,
  storage: HardDrive,
  psu: Zap,
  case: Server,
  cooling: Wind,
};

const RETAILERS = [
  { name: "Amazon", className: "text-retailer-amazon" },
  { name: "Bol.com", className: "text-retailer-bol" },
  { name: "Megekko", className: "text-retailer-megekko" },
  { name: "Azerty", className: "text-retailer-azerty" },
  { name: "Alternate", className: "text-retailer-alternate" },
];

export default function Home() {
  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section
        className="pt-24 pb-16 px-8 flex flex-col items-center text-center"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, #eaedff 0%, #faf8ff 70%)",
        }}
      >
        <div className="max-w-3xl w-full">
          <h1 className="font-display-lg text-display-lg mb-6 tracking-tight text-on-surface">
            Optimaliseer je build, verfijn je budget.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
            Vergelijk real-time prijzen van de grootste tech-retailers en bouw
            de ultieme setup met volledige compatibiliteitscontrole.
          </p>

          <HeroSearch />

          <div className="mt-8 flex flex-wrap justify-center gap-6 items-center">
            <span className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider">
              Vergelijk prijzen van:
            </span>
            <div className="flex gap-4 opacity-70">
              {RETAILERS.map((r) => (
                <span key={r.name} className={`font-bold ${r.className}`}>
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Snelkoppelingen
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Blader door de nieuwste hardware per categorie.
            </p>
          </div>
          <Link
            href="/categorie"
            className="font-label-technical text-label-technical text-primary hover:underline"
          >
            Bekijk alles
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COMPONENT_TYPES.map((type) => {
            const Icon = CATEGORY_ICONS[type];
            return (
              <Link
                key={type}
                href={`/categorie/${type}`}
                className="bg-surface-container-low border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-center group transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,73,219,0.08)]"
              >
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-primary border border-outline-variant group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="w-[30px] h-[30px]" />
                </div>
                <span className="font-title-md text-title-md text-on-surface">
                  {COMPONENT_META[type].shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured / Value Prop Visual */}
      <section className="bg-surface-container-low py-20 px-8 overflow-hidden">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <Image
              src="/images/feature-pc.png"
              alt="Binnenkant van een high-end gaming PC met CPU-koeler en RGB-verlichting"
              width={960}
              height={640}
              className="rounded-xl border border-outline-variant shadow-2xl relative z-10 w-full h-auto"
              priority={false}
            />
          </div>

          <div>
            <span className="font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded mb-6 inline-block">
              COMPATIBILITEITS CHECK
            </span>

            <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">
              Bouw zonder verrassingen.
            </h2>

            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              Onze engine controleert automatisch of je gekozen moederbord past
              bij je processor, of je voeding genoeg wattage levert en of je
              videokaart in je behuizing past.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CircleCheck className="w-6 h-6 fill-success-emerald text-white flex-shrink-0" />
                <div>
                  <span className="font-title-md text-title-md block text-on-surface">
                    Real-time prijzen
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Altijd de laagste prijs van alle grote Nederlandse webshops.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CircleCheck className="w-6 h-6 fill-success-emerald text-white flex-shrink-0" />
                <div>
                  <span className="font-title-md text-title-md block text-on-surface">
                    Voltage analyse
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Nauwkeurige schatting van het energieverbruik van je
                    volledige build.
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/builder"
              className="inline-block mt-10 px-8 py-4 bg-primary text-on-primary rounded-lg font-title-md text-title-md hover:shadow-lg transition-shadow"
            >
              Start je Build
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
