import Link from "next/link";
import { ShieldCheck, Boxes, Tag, ArrowRight } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";

const RETAILERS = [
  { name: "Amazon", className: "text-retailer-amazon" },
  { name: "Bol.com", className: "text-retailer-bol" },
  { name: "Megekko", className: "text-retailer-megekko" },
  { name: "Azerty", className: "text-retailer-azerty" },
  { name: "Alternate", className: "text-retailer-alternate" },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Compatibiliteitscheck",
    desc: "Direct zien of je onderdelen bij elkaar passen: socket, geheugen, voeding en behuizing.",
  },
  {
    icon: Boxes,
    title: "Visuele build",
    desc: "Zie je samenstelling groeien in een overzichtelijke weergave van je pc.",
  },
  {
    icon: Tag,
    title: "Beste prijs",
    desc: "Vergelijk live prijzen van de grootste retailers, per onderdeel.",
  },
];

export function Hero() {
  return (
    <section className="cb-mesh pt-24 pb-20 px-4 sm:px-8 flex flex-col items-center text-center overflow-hidden">
      <div className="max-w-3xl w-full animate-fade-in-up">
        <span className="inline-flex items-center gap-2 font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Prijzen + compatibiliteit in één builder
        </span>
        <h1 className="font-display-lg text-display-lg mb-6 tracking-tight text-on-surface">
          Bouw slimmer. Betaal minder.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
          Stel je pc samen met een automatische compatibiliteitscheck en een visuele build,
          en vergelijk live de prijzen van de grootste retailers.
        </p>

        <HeroSearch />

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 items-center">
          <span className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider">
            Prijzen van:
          </span>
          <div className="flex flex-wrap justify-center gap-4 opacity-70">
            {RETAILERS.map((r) => (
              <span key={r.name} className={`font-bold ${r.className}`}>
                {r.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Waardeproposities */}
      <div className="mt-14 grid sm:grid-cols-3 gap-4 max-w-4xl w-full">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.title}
              href="/builder"
              className="group bg-surface-container-lowest/80 backdrop-blur border border-outline-variant rounded-xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,73,219,0.10)] hover:border-primary animate-fade-in-up"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
              </div>
              <h2 className="font-title-md text-[15px] text-on-surface mb-1">{p.title}</h2>
              <p className="font-body-sm text-[13px] text-on-surface-variant">{p.desc}</p>
            </Link>
          );
        })}
      </div>

      <Link
        href="/builder"
        className="mt-8 inline-flex items-center gap-2 bg-primary text-on-primary px-7 py-3.5 rounded-lg font-title-md text-[15px] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all animate-fade-in-up"
        style={{ animationDelay: "420ms" }}
      >
        Open de PC Builder <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  );
}
