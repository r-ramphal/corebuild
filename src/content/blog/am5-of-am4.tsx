import type { BlogMeta } from "@/lib/blog-types";
import { Lead, H2, P, UL, Callout, A, CTA } from "@/components/blog/prose";

export const meta: BlogMeta = {
  slug: "am5-of-am4",
  title: "AM5 of AM4: welk AMD-platform kies je?",
  description:
    "AMD heeft twee actieve sockets. Je keuze bepaalt meteen je processor, moederbord én geheugen. Zo weet je snel welk platform bij jouw build past.",
  date: "2026-06-17",
  readingMinutes: 5,
  tags: ["cpu", "moederbord", "amd"],
};

export function Body() {
  return (
    <>
      <Lead>
        Kies je een AMD-processor, dan kies je eigenlijk eerst een platform: AM5 of AM4. Die socket bepaalt
        welk moederbord past en welk type geheugen je nodig hebt. Het klinkt technisch, maar de keuze is in
        de praktijk vrij simpel.
      </Lead>

      <H2>Het verschil in het kort</H2>
      <UL>
        <li>
          <strong>AM4</strong> is het oudere, goedkopere platform: DDR4-geheugen, Ryzen 5000-processors, en het
          einde van de upgrade-lijn (er komen geen nieuwe chips meer voor).
        </li>
        <li>
          <strong>AM5</strong> is het huidige platform: DDR5-geheugen, PCIe 5.0, de nieuwste Ryzen 7000- en
          9000-chips, en een upgradepad dat AMD nog jaren ondersteunt.
        </li>
      </UL>

      <H2>Wanneer AM4 nog logisch is</H2>
      <P>
        AM4 blijft interessant als je budget strak is of als je nog bruikbaar DDR4-geheugen hebt liggen. Een
        Ryzen 5 5600 met een goedkoop B550-bord levert nog steeds prima 1080p-gaming voor weinig geld. Je
        koopt dan bewust een afgerond, goedkoop platform — niet iets om later op door te bouwen.
      </P>

      <H2>Wanneer AM5 de betere keuze is</H2>
      <P>
        Bouw je een nieuwe pc die een paar jaar mee moet, dan is AM5 vrijwel altijd de slimmere keuze. Je
        krijgt DDR5, modernere connectiviteit en de mogelijkheid om over een paar jaar alleen je processor te
        upgraden. Ben je vooral gamer, dan zijn de X3D-chips (zoals de 7800X3D en 9800X3D) op AM5 de
        snelste gaming-processors die er zijn.
      </P>

      <Callout title="Vuistregel">
        Nieuwe build die mee moet naar de toekomst, of puur de beste gaming-prestaties? Kies AM5. Alleen een
        zo goedkoop mogelijke 1080p-machine, eventueel met bestaand DDR4-geheugen? Dan mag AM4.
      </Callout>

      <H2>Let op de socket bij je moederbord</H2>
      <P>
        Processor en moederbord moeten dezelfde socket hebben — een AM5-CPU past niet in een AM4-bord en
        andersom. Op de categoriepagina&apos;s van CoreBuild kun je daarom op <strong>socket</strong> filteren,
        zodat je meteen alleen de passende moederborden ziet.
      </P>
      <P>
        Twijfel je of alles samen werkt? In de <A href="/builder">PC Builder</A> controleren we automatisch of
        je CPU, moederbord en geheugen bij elkaar passen, inclusief de socket en het DDR-type.
      </P>

      <CTA href="/categorie/cpu" label="Bekijk processors">
        Weet je welk platform je wilt? Vergelijk AMD-processors op prijs bij alle grote retailers.
      </CTA>
    </>
  );
}
