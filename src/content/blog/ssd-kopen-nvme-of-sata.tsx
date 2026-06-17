import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "ssd-kopen-nvme-of-sata",
  title: "SSD kopen: NVMe, SATA of M.2 — wat moet je weten?",
  description:
    "NVMe, SATA, M.2, Gen4 — de termen lopen door elkaar. Een heldere uitleg zodat je de juiste SSD kiest zonder te veel te betalen voor snelheid die je niet merkt.",
  date: "2026-06-15",
  readingMinutes: 5,
  tags: ["opslag", "ssd"],
};

export function Body() {
  return (
    <>
      <Lead>
        Een SSD is tegenwoordig de enige logische keuze als systeemschijf — een ouderwetse harde schijf voelt
        in vergelijking traag aan. Maar de termen NVMe, SATA en M.2 worden vaak door elkaar gebruikt. Hier is
        het verschil.
      </Lead>

      <H2>NVMe versus SATA</H2>
      <P>
        Dit is het belangrijkste onderscheid, want het bepaalt de snelheid:
      </P>
      <UL>
        <li>
          <strong>SATA-SSD&apos;s</strong> halen zo&apos;n 550 MB/s. Een flinke sprong ten opzichte van een
          harde schijf, maar de oudere standaard.
        </li>
        <li>
          <strong>NVMe-SSD&apos;s</strong> halen al snel 3.500 MB/s of meer — vele malen sneller, en
          tegenwoordig nauwelijks duurder.
        </li>
      </UL>
      <P>
        Voor je besturingssysteem en games kies je dus NVMe. SATA is vooral nog interessant als goedkope,
        ruime opslag ernaast.
      </P>

      <H2>M.2 is een vorm, geen snelheid</H2>
      <P>
        M.2 zegt alleen iets over de <em>vorm</em>: een klein stickje dat plat op je moederbord klikt, zonder
        kabels. Verwarrend genoeg bestaan er M.2-schijven die SATA-snelheid halen én M.2-schijven die NVMe
        zijn. Let dus niet alleen op &ldquo;M.2&rdquo;, maar check of er <strong>NVMe</strong> bij staat.
      </P>

      <Callout title="Kort">
        SATA = de tragere standaard. NVMe = snel. M.2 = de vorm (kan allebei zijn). Voor je systeemschijf wil
        je een M.2 NVMe-SSD.
      </Callout>

      <H2>Gen3, Gen4 of Gen5?</H2>
      <P>
        Binnen NVMe zijn er generaties. Gen5 is op papier het snelst, maar in games en dagelijks gebruik merk
        je het verschil met Gen4 nauwelijks — Gen5-schijven zijn duurder en worden warmer. <strong>Gen4</strong>
        is voor vrijwel iedereen de zoete plek: snel, betaalbaar en koel genoeg.
      </P>

      <H2>Hoeveel ruimte heb je nodig?</H2>
      <P>
        Met moderne games die zomaar 100 GB innemen, is <strong>1 TB</strong> een verstandig minimum en
        <strong> 2 TB</strong> de comfortabele keuze als je een grotere bibliotheek hebt. Liever één ruime
        schijf dan steeds spellen moeten verwijderen.
      </P>

      <P>
        Op de opslag-categorie van CoreBuild kun je filteren op <strong>type</strong> (NVMe, SATA of HDD) en
        op <strong>capaciteit</strong>, zodat je snel de juiste schijf vindt.
      </P>

      <CTA href="/categorie/storage" label="Bekijk opslag">
        Vergelijk SSD&apos;s op type, capaciteit en prijs bij alle grote retailers.
      </CTA>
    </>
  );
}
