import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "past-het-in-je-behuizing",
  title: "Past je videokaart en koeler wel in je behuizing?",
  description:
    "Een krachtige build is waardeloos als de onderdelen niet fysiek passen. Waar je op moet letten: videokaartlengte, koelerhoogte, moederbordformaat en radiatorruimte.",
  date: "2026-06-10",
  readingMinutes: 5,
  tags: ["behuizing", "compatibiliteit"],
};

export function Body() {
  return (
    <>
      <Lead>
        Socket en geheugentype kloppen, de voeding is ruim genoeg, maar dan blijkt de videokaart twee
        centimeter te lang of de koeler net te hoog. Fysieke compatibiliteit wordt vaak vergeten, terwijl het
        zomaar de reden kan zijn dat een build niet dichtgaat. Dit zijn de maten die ertoe doen.
      </Lead>

      <H2>Videokaartlengte</H2>
      <P>
        Dezelfde chip (bijvoorbeeld een RTX 4070) bestaat in kaarten van zo&apos;n 24 tot wel 33 centimeter,
        afhankelijk van de fabrikant en het koelblok. Behuizingen geven een <strong>maximale
        videokaartlengte</strong> op. Vergelijk die met de lengte van jóuw specifieke kaart, niet met een
        gemiddelde, want juist de langste modellen lopen tegen de grens aan.
      </P>

      <H2>Koelerhoogte</H2>
      <P>
        Grote luchtkoelers zijn vaak 15 tot 17 centimeter hoog. Compacte en kleinere behuizingen hebben een
        <strong> maximale koelerhoogte</strong> die daar zo onder kan zitten. Bij een AIO-waterkoeling let je
        in plaats daarvan op de radiator: 240 mm, 280 mm of 360 mm, en of je behuizing daar een plek voor
        heeft (boven, voor of opzij).
      </P>

      <Callout title="Lucht of water?">
        Een goede luchtkoeler is simpel, betrouwbaar en onderhoudsvrij. Een AIO koelt zware processoren
        stiller, maar kost meer en vraagt radiatorruimte. Voor de meeste builds volstaat een degelijke
        luchtkoeler, mits hij qua hoogte past.
      </Callout>

      <H2>Moederbord- en behuizingformaat</H2>
      <P>
        Behuizingen en moederborden komen in formaten die op elkaar moeten aansluiten. Van groot naar klein:
        E-ATX, ATX, Micro-ATX en Mini-ITX. Een behuizing ondersteunt meestal meerdere formaten, maar een
        moederbord dat te groot is past simpelweg niet:
      </P>
      <UL>
        <li>Een ATX-bord past in een ATX- of grotere behuizing, niet in een Mini-ITX-kast.</li>
        <li>Een Mini-ITX-bord past juist in vrijwel alles, maar benut een grote kast minder.</li>
        <li>Let bij compacte builds extra op alle bovenstaande maten tegelijk, daar is de ruimte krap.</li>
      </UL>

      <Callout title="Kort samengevat">
        Check vier dingen: past de videokaart qua lengte, de koeler qua hoogte (of de radiator), en sluiten
        moederbord- en behuizingformaat op elkaar aan. Bij compacte kasten zijn die marges het kleinst.
      </Callout>

      <P>
        Het mooie: dit hoef je niet handmatig na te zoeken. In de <A href="/builder">PC Builder</A>{" "}
        controleren we automatisch of je videokaart en koeler in je gekozen behuizing passen, op basis van
        echte productafmetingen, naast de checks op socket, geheugen en voeding.
      </P>

      <CTA href="/categorie/case" label="Bekijk behuizingen">
        Op zoek naar een kast? Vergelijk behuizingen op prijs en formaat bij alle grote retailers.
      </CTA>
    </>
  );
}
