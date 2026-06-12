import Link from "next/link";
import {
  Cpu,
  Monitor,
  Layers,
  Database,
  HardDrive,
  Zap,
  Server,
  Wind,
  CheckCircle2,
} from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";

const CATEGORIES = [
  { label: "Processor", type: "cpu", Icon: Cpu },
  { label: "Videokaart", type: "gpu", Icon: Monitor },
  { label: "Moederbord", type: "motherboard", Icon: Layers },
  { label: "RAM", type: "ram", Icon: Database },
  { label: "Opslag", type: "storage", Icon: HardDrive },
  { label: "Voeding", type: "psu", Icon: Zap },
  { label: "Behuizing", type: "case", Icon: Server },
  { label: "Koeling", type: "cooling", Icon: Wind },
];

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
        className="pt-24 pb-16 flex flex-col items-center text-center px-4"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, #eaedff 0%, #faf8ff 70%)",
        }}
      >
        <h1 className="font-display-lg text-display-lg text-on-surface max-w-3xl">
          Optimaliseer je build, verfijn je budget.
        </h1>
        <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant max-w-xl">
          Vergelijk real-time prijzen van de grootste tech-retailers en bouw de
          ultieme setup met volledige compatibiliteitscontrole.
        </p>

        <div className="mt-8 w-full max-w-2xl">
          <HeroSearch />
        </div>

        <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
          <span className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider">
            Vergelijk prijzen van:
          </span>
          {RETAILERS.map((r) => (
            <span key={r.name} className={`font-bold text-sm ${r.className}`}>
              {r.name}
            </span>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="mb-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Snelkoppelingen
          </h2>
          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
            Blader door de nieuwste hardware per categorie.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(({ label, type, Icon }) => (
            <Link
              key={type}
              href={`/categorie/${type}`}
              className="bg-surface-container-low border border-outline-variant p-6 rounded-xl flex flex-col items-center gap-4 text-center group hover:-translate-y-0.5 hover:shadow-md hover:border-primary transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-outline-variant group-hover:bg-primary group-hover:text-white transition-colors text-on-surface-variant">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-container-low">
        <div className="max-w-[1280px] mx-auto px-8 py-20 grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-xl bg-surface-container h-80 flex items-center justify-center text-on-surface-variant border border-outline-variant">
            <span className="font-body-sm text-body-sm">Afbeelding binnenkort</span>
          </div>

          <div className="flex flex-col gap-6">
            <span className="inline-flex self-start items-center font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded uppercase">
              Compatibiliteits check
            </span>

            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Bouw zonder verrassingen.
            </h2>

            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Ons systeem controleert automatisch of alle componenten van jouw
              build compatibel zijn — van socket-type tot stroomverbruik. Zo
              weet je zeker dat alles samenwerkt voordat je koopt.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-emerald flex-shrink-0" />
                <span className="font-title-md text-title-md text-on-surface">
                  Automatische socket- en chipset-compatibiliteit
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-emerald flex-shrink-0" />
                <span className="font-title-md text-title-md text-on-surface">
                  Stroomverbruik en PSU-advies inbegrepen
                </span>
              </div>
            </div>

            <Link
              href="/builder"
              className="self-start mt-10 px-8 py-4 bg-primary text-on-primary rounded-lg font-title-md hover:shadow-lg transition-all hover:opacity-90"
            >
              Start je Build
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
