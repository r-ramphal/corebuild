import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "resolutie-en-videokaart",
  title: "1080p, 1440p of 4K: welke videokaart past daarbij?",
  description:
    "Je monitorresolutie bepaalt grotendeels hoe zwaar je videokaart moet zijn. Een praktische gids om GPU en scherm op elkaar af te stemmen, inclusief refreshrate en VRAM.",
  date: "2026-06-12",
  readingMinutes: 6,
  tags: ["videokaart", "gaming"],
};

export function Body() {
  return (
    <>
      <Lead>
        De videokaart is voor gaming het belangrijkste onderdeel, maar &ldquo;de duurste die ik kan
        betalen&rdquo; is zelden het juiste antwoord. Wat je echt nodig hebt, hangt vooral af van je scherm:
        de resolutie en de refreshrate bepalen hoeveel werk de kaart elke seconde moet doen.
      </Lead>

      <H2>Resolutie bepaalt de zwaarte</H2>
      <P>
        Elke stap omhoog in resolutie betekent fors meer pixels om te berekenen. 1440p heeft ongeveer 1,8×
        zoveel pixels als 1080p, en 4K ruim 2× zoveel als 1440p. Daardoor schaalt de benodigde
        videokaart-kracht mee:
      </P>
      <UL>
        <li>
          <strong>1080p</strong> — de meeste games draaien soepel op een instap- tot middenklasse kaart.
          Ideaal als je hoge framerates wilt voor snelle shooters.
        </li>
        <li>
          <strong>1440p</strong> — de huidige zoete plek voor gaming. Reken op een stevige middenklasse- tot
          hogere middenklasse kaart voor hoge instellingen.
        </li>
        <li>
          <strong>4K</strong> — scherp en ruim, maar veeleisend. Hiervoor wil je een high-end kaart, zeker
          als je ook hoge framerates wilt halen.
        </li>
      </UL>

      <H2>Vergeet de refreshrate niet</H2>
      <P>
        Een monitor van 144 Hz of 240 Hz oogt veel vloeiender dan 60 Hz, maar alleen als je videokaart de
        bijbehorende frames ook echt levert. Een 1440p 144 Hz-scherm vraagt dus een snellere kaart dan een
        1440p 60 Hz-scherm. Stem die twee op elkaar af: een topkaart achter een 60 Hz-monitor is zonde, en
        andersom haalt een te zwakke kaart die 144 Hz nooit.
      </P>

      <Callout title="Balans met je processor">
        Op 1080p leunt de prestatie relatief zwaar op de processor; op 4K vooral op de videokaart. Een
        high-end kaart met een instap-CPU kan op 1080p tegen een &ldquo;bottleneck&rdquo; aanlopen. Bekijk
        het als een team: beide moeten ongeveer in dezelfde klasse zitten.
      </Callout>

      <H2>Hoeveel VRAM?</H2>
      <P>
        Videogeheugen (VRAM) wordt belangrijker bij hogere resoluties en met scherpe textures. Voor 1080p is
        8 GB doorgaans voldoende; voor 1440p zit je geruster op 12 GB of meer; voor 4K is ruim VRAM
        aan te raden. Te weinig VRAM merk je aan haperingen en lagere texture-kwaliteit, ook al is de kaart
        verder snel genoeg.
      </P>

      <Callout title="Kort samengevat">
        Kies je videokaart op basis van je scherm: resolutie én refreshrate. Houd CPU en GPU in dezelfde
        klasse, en let bij 1440p/4K extra op voldoende VRAM.
      </Callout>

      <P>
        Niet zeker welke kaart bij jouw scherm en budget past? In de <A href="/builder">PC Builder</A> stelt
        de functie <strong>Smart generate</strong> een compatibele build voor op basis van je gebruik,
        resolutie en budget, met echte prijzen.
      </P>

      <CTA href="/categorie/gpu" label="Bekijk videokaarten">
        Vergelijk videokaarten op prijs, VRAM en voorraad bij alle grote retailers.
      </CTA>
    </>
  );
}
