import { GiastHero } from "@/components/home/GiastHero";
import { GiastMarquee } from "@/components/home/GiastMarquee";
import { GiastSlimKopen } from "@/components/home/GiastSlimKopen";
import { GiastTerminal } from "@/components/home/GiastTerminal";
import { GiastCategories } from "@/components/home/GiastCategories";
import { GiastManifest } from "@/components/home/GiastManifest";
import { Reveal } from "@/components/motion/Reveal";
import { Preloader } from "@/components/motion/Preloader";
import { JsonLd } from "@/components/JsonLd";
import { getDemoSlimKopen } from "@/lib/demo-slim-kopen";

const BASE_URL = "https://corebuildnl.com";

// ISR: de homepage blijft prerendered (snel), maar de live Slim-Kopen-cijfers
// worden elke 6 uur ververst — in lijn met de catalogus-refresh.
export const revalidate = 21600;

// Organization + WebSite structured data. De SearchAction levert Google de
// sitelinks-searchbox (zoekveld in de zoekresultaten) richting /zoeken.
const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "CoreBuild",
      url: BASE_URL,
      logo: `${BASE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "CoreBuild",
      inLanguage: "nl-NL",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/zoeken?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function Home() {
  const slimKopen = await getDemoSlimKopen();

  return (
    <>
      <Preloader />
      <main className="pt-16 bg-gp-bg">
        <JsonLd data={siteLd} />
        <GiastHero />
        <GiastMarquee />
        <Reveal>
          <GiastSlimKopen data={slimKopen} />
        </Reveal>
        <Reveal>
          <GiastTerminal />
        </Reveal>
        <Reveal>
          <GiastCategories />
        </Reveal>
        <Reveal>
          <GiastManifest />
        </Reveal>
      </main>
    </>
  );
}
