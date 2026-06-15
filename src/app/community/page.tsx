import type { Metadata } from "next";
import { ArrowUpRight, ArrowBigUp, MessageSquare } from "lucide-react";
import { getDb } from "@/lib/db";
import { getTopRedditPosts } from "@/lib/db/reddit";
import type { RedditPostRow } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Wat de pc-bouwcommunity bespreekt: trending builds, adviezen en deals uit r/buildapc en aanverwante subreddits. Bron: Reddit.",
  alternates: { canonical: "/community" },
};

// ISR: statisch met periodieke verversing (de cron leest dagelijks in).
export const revalidate = 600;

function timeAgo(d: Date | null): string {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min geleden`;
  if (s < 86400) return `${Math.floor(s / 3600)} uur geleden`;
  const days = Math.floor(s / 86400);
  return days === 1 ? "1 dag geleden" : `${days} dagen geleden`;
}

function compact(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}k` : String(n);
}

async function loadPosts(): Promise<RedditPostRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await getTopRedditPosts(db, 30);
  } catch {
    return []; // tabel ontbreekt of DB onbereikbaar → lege feed
  }
}

export default async function CommunityPage() {
  const posts = await loadPosts();

  return (
    <main className="pt-24 pb-16 px-4 sm:px-8 max-w-[1280px] mx-auto w-full min-h-screen">
      <div className="mb-2 flex items-end justify-between gap-4 flex-wrap">
        <div className="border-l-2 border-primary pl-4">
          <span className="font-plex text-[11px] uppercase tracking-[0.2em] text-gp-orange block mb-1">
            _community
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Wat de community bespreekt</h1>
        </div>
        <a
          href="https://www.reddit.com/r/buildapc/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label-technical text-label-technical text-on-surface-variant hover:text-primary inline-flex items-center gap-1"
        >
          r/buildapc op Reddit <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-8 max-w-2xl">
        Trending builds, adviezen en deals uit r/buildapc en aanverwante subreddits — zodat je ziet
        wat ervaren bouwers nú aanraden. Posts en discussies zijn van Reddit; klik door om mee te lezen.
      </p>

      {posts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-outline-variant rounded-xl">
          <MessageSquare className="w-8 h-8 text-outline mx-auto mb-3" />
          <p className="font-title-md text-title-md text-on-surface mb-2">Nog geen posts</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
            De feed vult zich zodra de Reddit-koppeling actief is en de dagelijkse import heeft gedraaid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((p) => (
            <a
              key={p.postId}
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 p-4 bg-surface-container-lowest border border-outline-variant border-l-[3px] border-l-primary rounded-xl hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex flex-col items-center gap-0.5 shrink-0 w-10 text-on-surface-variant">
                <ArrowBigUp className="w-5 h-5 text-primary" />
                <span className="font-label-price text-[13px] text-on-surface">{compact(p.score)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-label-technical text-[10px] uppercase tracking-wide text-on-surface-variant">
                    r/{p.subreddit}
                  </span>
                  {p.flair && (
                    <span className="font-label-technical text-[10px] px-1.5 py-0.5 rounded bg-primary-container/15 text-primary">
                      {p.flair}
                    </span>
                  )}
                  <span className="font-label-technical text-[10px] text-outline">{timeAgo(p.createdUtc)}</span>
                </div>
                <p className="font-title-md text-[15px] leading-snug text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                  {p.title}
                </p>
                <div className="flex items-center gap-3 mt-2 font-label-technical text-[11px] text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {compact(p.numComments)} reacties
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:text-primary">
                    Lees op Reddit <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="font-label-technical text-[11px] text-on-surface-variant mt-8">
        Bron: Reddit. CoreBuild toont publieke posts ter oriëntatie; de discussies en meningen zijn van
        de Reddit-community, niet van CoreBuild.
      </p>
    </main>
  );
}
