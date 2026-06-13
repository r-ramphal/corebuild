import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Over CoreBuild",
  description:
    "Wat CoreBuild is, hoe wij geld verdienen (affiliate-links) en hoe wij met je gegevens omgaan.",
  alternates: {
    canonical: "/over",
  },
};

export default function OverPage() {
  return (
    <main className="mt-16 max-w-3xl mx-auto px-4 sm:px-8 py-16 min-h-screen">
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6">
        Over CoreBuild
      </h1>

      <div className="space-y-10 font-body-lg text-body-lg text-on-surface-variant">
        <section>
          <p>
            CoreBuild is een Nederlandse prijsvergelijker voor PC-componenten.
            We verzamelen prijzen van Amazon, Bol.com, Megekko, Azerty en
            Alternate, zodat je per onderdeel direct ziet waar het het
            voordeligst is. Met de builder stel je een volledige PC samen, met
            een schatting van het stroomverbruik en compatibiliteitschecks
            (socket, geheugen, voeding, en of de videokaart en koeler in je
            behuizing passen).
          </p>
          <p className="mt-4">
            Prijzen en voorraad zijn indicatief: we verversen ze regelmatig,
            maar de webshop heeft altijd de actuele prijs. Controleer het
            eindbedrag dus altijd bij de winkel zelf.
          </p>
        </section>

        <section id="affiliate">
          <h2 className="font-title-md text-title-md text-on-surface mb-3">
            Affiliate disclaimer
          </h2>
          <p>
            Sommige links naar webshops zijn affiliate-links. Koop je iets via
            zo&apos;n link, dan ontvangt CoreBuild mogelijk een kleine commissie
            van de webshop. Jij betaalt daardoor nooit meer; het beïnvloedt ook
            niet welke aanbieding wij als beste prijs tonen, dat is altijd
            simpelweg de laagste prijs die we vonden.
          </p>
        </section>

        <section id="privacy">
          <h2 className="font-title-md text-title-md text-on-surface mb-3">
            Privacy
          </h2>
          <p>
            CoreBuild gebruikt geen tracking- of advertentiecookies. Maak je
            een account aan om builds op te slaan, dan bewaren we alleen je
            e-mailadres, je naam en je opgeslagen builds. Je wachtwoord wordt
            versleuteld opgeslagen en is voor niemand leesbaar. We verkopen of
            delen geen gegevens met derden.
          </p>
          <p className="mt-4">
            Wil je je account en gegevens laten verwijderen? Stuur een bericht
            en we verwijderen alles definitief.
          </p>
        </section>

        <section id="databronnen">
          <h2 className="font-title-md text-title-md text-on-surface mb-3">
            Databronnen
          </h2>
          <p>
            De afmetingen die we gebruiken voor de compatibiliteitschecks
            (videokaartlengte, koelerhoogte, ruimte in de behuizing) komen uit de{" "}
            <a
              href="https://github.com/buildcores/buildcores-open-db"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              BuildCores OpenDB
            </a>
            , beschikbaar onder de{" "}
            <a
              href="https://opendatacommons.org/licenses/by/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open Data Commons Attribution License (ODC-By 1.0)
            </a>
            . Maten zijn een indicatie; controleer bij twijfel altijd de
            specificaties van de fabrikant.
          </p>
        </section>
      </div>
    </main>
  );
}
