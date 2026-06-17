import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "ddr4-vs-ddr5",
  title: "DDR4 of DDR5: maakt het verschil voor gaming?",
  description:
    "Moet je je druk maken om DDR5? Wat het type geheugen echt doet voor je prestaties, en waarom je het meestal niet eens vrij kunt kiezen.",
  date: "2026-06-16",
  readingMinutes: 4,
  tags: ["ram", "geheugen"],
};

export function Body() {
  return (
    <>
      <Lead>
        DDR4 of DDR5 is een populaire discussie, maar voor de meeste mensen is het antwoord al gegeven door
        hun platform. En het verschil in spelprestaties is kleiner dan je misschien denkt.
      </Lead>

      <H2>Je kiest het type meestal niet vrij</H2>
      <P>
        Welk geheugen past, hangt af van je processor en moederbord, niet van je voorkeur:
      </P>
      <UL>
        <li>
          <strong>AMD AM5</strong> werkt uitsluitend met DDR5.
        </li>
        <li>
          <strong>AMD AM4</strong> werkt uitsluitend met DDR4.
        </li>
        <li>
          <strong>Intel (LGA1700/1851)</strong> kan beide — maar een specifiek moederbord ondersteunt óf DDR4
          óf DDR5, niet allebei tegelijk.
        </li>
      </UL>
      <P>
        Kies je dus een platform, dan ligt het geheugentype vaak al vast. Daarom kun je op de RAM-categorie
        van CoreBuild op <strong>DDR4/DDR5</strong> filteren, zodat je alleen ziet wat in jouw bord past.
      </P>

      <H2>Merk je het verschil in games?</H2>
      <P>
        In de meeste games is je videokaart de bottleneck, niet je geheugen. Het verschil tussen goed DDR4 en
        DDR5 is dan klein — vaak een paar procent. Bij hoge framerates op 1080p, of in CPU-zware games en
        simulaties, wordt het verschil iets groter, maar zelden iets waar je het budget voor omgooit.
      </P>

      <H2>Wat wél telt</H2>
      <UL>
        <li>
          <strong>Capaciteit:</strong> 16 GB is het minimum, 32 GB is de comfortabele standaard voor gaming én
          multitasking.
        </li>
        <li>
          <strong>Snelheid:</strong> voor AM5 is DDR5-6000 de zoete plek; sneller levert nauwelijks meer op.
        </li>
        <li>
          <strong>Dual channel:</strong> koop altijd een kit van twee reepjes in plaats van één los reepje.
        </li>
      </UL>

      <Callout title="Waarom twee reepjes?">
        Met twee reepjes draait je geheugen in dual channel, wat de bandbreedte verdubbelt. Eén los reepje van
        32 GB is in games merkbaar trager dan 2× 16 GB. Let daar dus op bij het vergelijken.
      </Callout>

      <P>
        Niet zeker of een kit bij je bord past? De <A href="/builder">PC Builder</A> waarschuwt als het
        DDR-type van je geheugen niet matcht met je moederbord.
      </P>

      <CTA href="/categorie/ram" label="Bekijk geheugen">
        Vergelijk RAM-kits op type, capaciteit en prijs bij alle grote retailers.
      </CTA>
    </>
  );
}
