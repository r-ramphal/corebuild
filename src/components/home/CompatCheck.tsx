import Link from "next/link";
import Image from "next/image";
import { CircleCheck } from "lucide-react";

const FEATURES = [
  {
    title: "Real-time prijzen",
    description: "Altijd de laagste prijs van alle grote Nederlandse webshops.",
  },
  {
    title: "Voltage analyse",
    description: "Nauwkeurige schatting van het energieverbruik van je volledige build.",
  },
];

export function CompatCheck() {
  return (
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
          />
        </div>

        <div>
          <span className="font-label-technical text-label-technical text-primary bg-primary/10 px-3 py-1 rounded mb-6 inline-block">
            WATTAGE CHECK
          </span>

          <h2 className="font-headline-lg text-headline-lg mb-6 text-on-surface">
            Bouw zonder verrassingen.
          </h2>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            De builder schat het stroomverbruik van je volledige build,
            waarschuwt wanneer je voeding te licht is en houdt het totaal van
            alle onderdelen overzichtelijk bij elkaar.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <CircleCheck className="w-6 h-6 fill-success-emerald text-white flex-shrink-0" />
                <div>
                  <span className="font-title-md text-title-md block text-on-surface">
                    {title}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {description}
                  </span>
                </div>
              </div>
            ))}
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
  );
}
