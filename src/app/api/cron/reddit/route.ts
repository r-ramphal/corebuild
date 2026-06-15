import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchSubredditPosts, hasRedditCreds } from "@/lib/reddit";
import { saveRedditPosts } from "@/lib/db/reddit";

/**
 * Periodieke Reddit-ingestie (Vercel Cron, zie vercel.json). Leest relevante
 * subreddits in en slaat de posts op in Neon, zodat de community-feed uit de
 * database leest i.p.v. live de Reddit-API te bevragen. Beveiligd met CRON_SECRET.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCES: { sub: string; sort: "hot" | "top" | "new"; limit: number }[] = [
  { sub: "buildapc", sort: "top", limit: 25 },
  { sub: "buildapcsales", sort: "hot", limit: 15 },
  { sub: "pcmasterrace", sort: "top", limit: 15 },
];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET niet geconfigureerd" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }
  if (!hasRedditCreds()) {
    return NextResponse.json({ fetched: 0, saved: 0, reason: "geen Reddit-credentials" });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 503 });

  let fetched = 0;
  let saved = 0;
  for (const s of SOURCES) {
    const posts = await fetchSubredditPosts(s.sub, s.sort, s.limit, "week");
    fetched += posts.length;
    try {
      saved += await saveRedditPosts(db, posts);
    } catch (err) {
      console.error(`Reddit-opslag mislukt (${s.sub}):`, err);
    }
  }

  return NextResponse.json({ fetched, saved });
}
