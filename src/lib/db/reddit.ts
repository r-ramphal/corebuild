import { desc, sql } from "drizzle-orm";
import type { Db } from "./index";
import { redditPosts, type RedditPostRow } from "./schema";
import type { RedditPost } from "@/lib/reddit";

/** Upsert ingelezen Reddit-posts (ververst score/reacties bij bestaande post_id). */
export async function saveRedditPosts(db: Db, posts: RedditPost[]): Promise<number> {
  if (posts.length === 0) return 0;
  const rows = posts.map((p) => ({
    postId: p.id,
    subreddit: p.subreddit,
    title: p.title,
    permalink: p.permalink,
    url: p.url,
    author: p.author,
    score: p.score,
    numComments: p.numComments,
    flair: p.flair,
    createdUtc: p.createdUtc ? new Date(p.createdUtc * 1000) : null,
  }));
  await db
    .insert(redditPosts)
    .values(rows)
    .onConflictDoUpdate({
      target: redditPosts.postId,
      set: {
        title: sql`excluded.title`,
        score: sql`excluded.score`,
        numComments: sql`excluded.num_comments`,
        flair: sql`excluded.flair`,
        fetchedAt: new Date(),
      },
    });
  return rows.length;
}

/** Top-posts voor de community-feed: hoogste score eerst, recent ingelezen. */
export async function getTopRedditPosts(db: Db, limit = 24): Promise<RedditPostRow[]> {
  return db
    .select()
    .from(redditPosts)
    .orderBy(desc(redditPosts.score))
    .limit(limit);
}
