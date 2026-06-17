import { GiastHero } from "@/components/home/GiastHero";
import { GiastMarquee } from "@/components/home/GiastMarquee";
import { GiastTerminal } from "@/components/home/GiastTerminal";
import { GiastCategories } from "@/components/home/GiastCategories";
import { GiastManifest } from "@/components/home/GiastManifest";
import { Reveal } from "@/components/motion/Reveal";
import { Preloader } from "@/components/motion/Preloader";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = "https://corebuildnl.com";

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

export default function Home() {
  return (
    <>
      <Preloader />
      <main className="pt-16 bg-gp-bg">
        <JsonLd data={siteLd} />
        <GiastHero />
        <GiastMarquee />
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
