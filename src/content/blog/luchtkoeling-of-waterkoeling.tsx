import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "luchtkoeling-of-waterkoeling",
  title: "Luchtkoeling of waterkoeling (AIO) voor je CPU?",
  description:
    "Heb je een AIO-waterkoeler nodig, of volstaat een goede luchtkoeler? Wanneer welke keuze logisch is — en waarom luchtkoeling vaker wint dan je denkt.",
  date: "2026-06-15",
  readingMinutes: 5,
  tags: ["koeling", "cpu"],
};

export function Body() {
  return (
    <>
      <Lead>
        Waterkoeling ziet er indrukwekkend uit, maar dat betekent niet dat je het nodig hebt. Voor de meeste
        builds is een goede luchtkoeler net zo koel, betrouwbaarder én goedkoper. Zo maak je de juiste keuze.
      </Lead>

      <H2>Hoe ze werken</H2>
      <UL>
        <li>
          <strong>Luchtkoeling:</strong> een blok met koelvinnen en heatpipes op je processor, met een
          ventilator die de warmte wegblaast. Geen pomp, geen vloeistof — weinig dat stuk kan.
        </li>
        <li>
          <strong>Waterkoeling (AIO):</strong> een kant-en-klare gesloten loop die warmte via vloeistof naar
          een radiator met ventilatoren brengt. Compact rond de socket, maar mét een pomp.
        </li>
      </UL>

      <H2>Wanneer luchtkoeling de slimste keuze is</H2>
      <P>
        Voor verreweg de meeste processors volstaat een degelijke luchtkoeler ruimschoots. Een goede
        dual-tower luchtkoeler presteert vergelijkbaar met een AIO van 240 mm, kost minder en heeft geen pomp
        die ooit kan uitvallen. Voor een normale gaming-build is dit bijna altijd het verstandigste.
      </P>

      <H2>Wanneer een AIO logisch is</H2>
      <UL>
        <li>
          <strong>Warme processors:</strong> high-end chips met een hoge TDP (de X- en K-series) profiteren van
          de extra koelcapaciteit van een 280- of 360 mm-AIO.
        </li>
        <li>
          <strong>Kleine behuizingen:</strong> in een compacte of ITX-kast past een grote luchtkoeler soms
          niet, en biedt een AIO meer ruimte rond de socket.
        </li>
        <li>
          <strong>Uiterlijk:</strong> wil je een strak ogende build met een schoon zicht op je moederbord, dan
          oogt een AIO rustiger dan een grote koeltoren.
        </li>
      </UL>

      <Callout title="Vuistregel">
        Een goede luchtkoeler van zo&apos;n 40 tot 60 euro koelt de meeste processors prima. Kies vooral een
        AIO voor warme high-end chips, een kleine kast, of de looks — niet omdat het &ldquo;beter&rdquo; zou
        zijn.
      </Callout>

      <H2>Let op de ruimte in je kast</H2>
      <P>
        Luchtkoelers hebben een maximale hoogte die in je behuizing moet passen, en een AIO-radiator heeft een
        plek nodig (boven of voor). Controleer dit altijd even — meer hierover lees je in{" "}
        <A href="/blog/past-het-in-je-behuizing">past het in je behuizing?</A> De{" "}
        <A href="/builder">PC Builder</A> houdt bij het samenstellen rekening met dit soort beperkingen.
      </P>

      <CTA href="/categorie/cooling" label="Bekijk koeling">
        Vergelijk lucht- en waterkoelers op type en prijs bij alle grote retailers.
      </CTA>
    </>
  );
}
