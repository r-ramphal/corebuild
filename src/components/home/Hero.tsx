import { HeroSearch } from "@/components/HeroSearch";

const RETAILERS = [
  { name: "Amazon", className: "text-retailer-amazon" },
  { name: "Bol.com", className: "text-retailer-bol" },
  { name: "Megekko", className: "text-retailer-megekko" },
  { name: "Azerty", className: "text-retailer-azerty" },
  { name: "Alternate", className: "text-retailer-alternate" },
];

export function Hero() {
  return (
    <section
      className="pt-24 pb-16 px-8 flex flex-col items-center text-center"
      style={{
        background: "radial-gradient(circle at 50% -20%, #eaedff 0%, #faf8ff 70%)",
      }}
    >
      <div className="max-w-3xl w-full">
        <h1 className="font-display-lg text-display-lg mb-6 tracking-tight text-on-surface">
          Optimaliseer je build, verfijn je budget.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
          Vergelijk real-time prijzen van de grootste tech-retailers en bouw de
          ultieme setup met volledige compatibiliteitscontrole.
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
  );
}
