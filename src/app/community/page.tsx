import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ArrowRight, Sparkles, MessagesSquare } from "lucide-react";
import { GalleryClient } from "@/components/GalleryClient";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Door de community gedeelde PC-builds (bekijken en vergelijken), handige subreddits voor bouwadvies en deals, en hoe CoreBuild de community-consensus in zijn aanbevelingen verwerkt.",
  alternates: { canonical: "/community" },
};

/**
 * Community-hub: curated links naar relevante subreddits + uitleg hoe CoreBuild
 * de community-consensus gebruikt. Bewust géén Reddit-content opslaan/tonen via
 * de Data API — Reddit's voorwaarden beperken dat voor commercieel gebruik; we
 * linken door (altijd toegestaan) en leunen op onze eigen aanbevelingslaag.
 */
const SUBREDDITS: { name: string; url: string; desc: string }[] = [
  { name: "r/buildapc", url: "https://www.reddit.com/r/buildapc/", desc: "Hét subreddit voor pc-bouwadvies, troubleshooting en reviews." },
  { name: "r/buildapcforme", url: "https://www.reddit.com/r/buildapcforme/", desc: "Vraag een complete build op maat voor jouw budget en gebruik." },
  { name: "r/buildapcsales", url: "https://www.reddit.com/r/buildapcsales/", desc: "Dagelijkse hardware-deals, per onderdeel getagd." },
  { name: "r/pcmasterrace", url: "https://www.reddit.com/r/pcmasterrace/", desc: "Builds, nieuws en inspiratie van de bredere pc-community." },
];

export default function CommunityPage() {
  return (
    <main className="pt-24 pb-16 px-4 sm:px-8 max-w-[1280px] mx-auto w-full min-h-screen">
      <div className="border-l-2 border-primary pl-4 mb-2">
        <span className="font-plex text-[11px] uppercase tracking-[0.2em] text-gp-orange block mb-1">
          _community
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Bouw mee met de community</h1>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-10 max-w-2xl">
        CoreBuild spreekt dezelfde taal als de bouwcommunity. Bekijk hieronder builds die de community
        heeft gedeeld, de subreddits waar ervaren bouwers samenkomen, en hoe we hun consensus in onze
        aanbevelingen verwerken.
      </p>

      {/* Gedeelde builds (voorheen de losse /galerij-pagina) */}
      <div className="mb-12">
        <GalleryClient />
      </div>

      {/* Subreddits */}
      <h2 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2">
        <MessagesSquare className="w-5 h-5 text-primary" /> Volg de community
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {SUBREDDITS.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between gap-3 p-5 bg-surface-container-lowest border border-outline-variant border-l-[3px] border-l-primary rounded-xl hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="min-w-0">
              <p className="font-title-md text-[16px] text-on-surface group-hover:text-primary transition-colors">
                {s.name}
              </p>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-1">{s.desc}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors shrink-0 mt-1" />
          </a>
        ))}
      </div>

      {/* Onze aanpak */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
        <h2 className="font-title-md text-title-md text-on-surface mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Zo verwerkt CoreBuild de community-consensus
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl mb-4">
          Onze <span className="font-medium text-on-surface">smart generate</span> kiest niet zomaar het
          goedkoopste onderdeel, maar geeft binnen je budget voorrang aan merken en modellen die in
          r/buildapc, PSU-tierlists en reviews van Gamers Nexus en Hardware Unboxed structureel worden
          aangeraden — koeler, voeding, behuizing, moederbord, geheugen en SSD. Zo krijg je een build die
          ervaren bouwers zouden goedkeuren.
        </p>
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-technical text-label-technical px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Stel een build samen <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="font-label-technical text-[11px] text-on-surface-variant mt-8">
        CoreBuild linkt naar publieke subreddits ter oriëntatie en slaat geen Reddit-content op. De
        discussies en meningen daar zijn van de Reddit-community, niet van CoreBuild.
      </p>
    </main>
  );
}
