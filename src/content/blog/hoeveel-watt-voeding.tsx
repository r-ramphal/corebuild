import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "hoeveel-watt-voeding",
  title: "Hoeveel watt voeding heb ik nodig?",
  description:
    "Een simpele manier om het juiste wattage voor je voeding te kiezen, zonder te veel te betalen of je systeem te krap te zetten. Plus wat 80 PLUS-certificering echt betekent.",
  date: "2026-06-14",
  readingMinutes: 5,
  tags: ["voeding", "beginners"],
};

export function Body() {
  return (
    <>
      <Lead>
        De voeding (PSU) is het onderdeel waar mensen het vaakst te veel óf te weinig aan uitgeven. Te krap
        en je systeem wordt instabiel onder load; veel te ruim en je betaalt voor wattage dat je nooit
        gebruikt. Gelukkig is het juiste getal makkelijk te bepalen.
      </Lead>

      <H2>Tel het verbruik van je CPU en videokaart op</H2>
      <P>
        In de praktijk bepalen twee onderdelen bijna je hele stroomverbruik: de processor en de videokaart.
        De rest (moederbord, geheugen, ssd, ventilatoren) telt samen op tot grofweg 60 à 80 watt. Een
        bruikbare vuistregel:
      </P>
      <UL>
        <li>Tel de TDP van je CPU en GPU op (staat in de specificaties).</li>
        <li>Tel daar ~80 watt bij op voor de rest van het systeem.</li>
        <li>Neem op dat totaal nog eens ~50% marge.</li>
      </UL>
      <P>
        Voorbeeld: een CPU van 120 W en een videokaart van 220 W is samen 340 W, plus 80 W is 420 W. Met 50%
        marge kom je op zo&apos;n 630 W. Een 650 W-voeding is dan een prima, rustige keuze.
      </P>

      <Callout title="Waarom die 50% marge?">
        Voedingen werken het efficiëntst en het stilst rond de helft van hun belasting, en pieken (vooral van
        moderne videokaarten) kunnen kort flink hoger liggen dan de gemiddelde TDP. Marge betekent dus niet
        &ldquo;verspilling&rdquo;, maar koeler, stiller en betrouwbaarder draaien.
      </Callout>

      <H2>Wat betekent 80 PLUS?</H2>
      <P>
        80 PLUS is een efficiëntiekeurmerk: hoeveel van het opgenomen vermogen daadwerkelijk bij je
        onderdelen aankomt in plaats van als warmte verdwijnt. De volgorde loopt van 80 PLUS (brons) naar
        Gold, Platinum en Titanium. Voor de meeste builds is <strong>80 PLUS Gold</strong> de zoete plek:
        merkbaar efficiënter dan brons, zonder de meerprijs van Platinum.
      </P>
      <P>
        Belangrijker dan een paar procent efficiëntie is de <strong>kwaliteit van het merk</strong>. Een
        goedkope 850 W-voeding van een onbekend merk is geen betere keuze dan een degelijke 650 W van een
        gevestigde fabrikant. De voeding levert stroom aan álles, dus hier bezuinig je niet als laatste.
      </P>

      <H2>Modulair of niet?</H2>
      <P>
        Bij een (semi-)modulaire voeding sluit je alleen de kabels aan die je nodig hebt, wat de luchtstroom
        en het opruimen in je behuizing makkelijker maakt. Puur functioneel maakt het niets uit, maar voor
        een nette build is het fijn.
      </P>

      <Callout title="Kort samengevat">
        CPU-TDP + GPU-TDP + 80 W, daar 50% marge op, en kies een degelijke 80 PLUS Gold-voeding. Liever iets
        ruimer dan te krap.
      </Callout>

      <P>
        Wil je niet zelf rekenen? In de <A href="/builder">PC Builder</A> zie je per build automatisch een
        schatting van het verbruik en het aanbevolen wattage, op basis van de onderdelen die je kiest.
      </P>

      <CTA href="/categorie/psu" label="Bekijk voedingen">
        Klaar om te kiezen? Vergelijk voedingen op prijs en wattage bij alle grote retailers.
      </CTA>
    </>
  );
}
