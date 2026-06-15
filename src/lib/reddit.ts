/**
 * Reddit Data API-client (alleen-lezen, app-only OAuth = client_credentials).
 * Werkt zodra `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` gezet zijn; zonder die
 * sleutels geeft elke functie een lege lijst terug (graceful, net als email.ts).
 *
 * Reddit eist een beschrijvende User-Agent — generieke UA's worden geblokkeerd.
 * Niet live per bezoeker gebruiken (rate limit ~100/min): de cron leest periodiek
 * in en slaat op in Neon; de site leest uit de database.
 */

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";
const DEFAULT_UA = "web:com.corebuildnl:v1.0 (prijsvergelijker, contact corebuildnl@proton.me)";

interface RedditCreds {
  id: string;
  secret: string;
  ua: string;
}

function readCreds(): RedditCreds | null {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret, ua: process.env.REDDIT_USER_AGENT || DEFAULT_UA };
}

/** Of de Reddit-integratie geconfigureerd is (creds aanwezig). */
export function hasRedditCreds(): boolean {
  return readCreds() !== null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(c: RedditCreds): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${c.id}:${c.secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": c.ua,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return cachedToken.token;
  } catch {
    return null;
  }
}

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  permalink: string; // volledige reddit.com-link
  url: string | null; // externe link (bij link-posts)
  author: string;
  score: number;
  numComments: number;
  flair: string | null;
  createdUtc: number; // seconden sinds epoch
}

interface RawChild {
  data?: {
    id?: string;
    subreddit?: string;
    title?: string;
    permalink?: string;
    url?: string;
    author?: string;
    score?: number;
    num_comments?: number;
    link_flair_text?: string | null;
    created_utc?: number;
    stickied?: boolean;
    over_18?: boolean;
  };
}

/**
 * Pure parser van een Reddit-listing-response → genormaliseerde posts. Filtert
 * vastgepinde en NSFW-posts. Apart testbaar (geen netwerk).
 */
export function normalizePosts(json: unknown, subreddit: string): RedditPost[] {
  const children = (json as { data?: { children?: RawChild[] } })?.data?.children;
  if (!Array.isArray(children)) return [];
  const out: RedditPost[] = [];
  for (const ch of children) {
    const d = ch?.data;
    if (!d?.id || !d.title || !d.permalink) continue;
    if (d.stickied || d.over_18) continue;
    out.push({
      id: d.id,
      subreddit: d.subreddit || subreddit,
      title: d.title,
      permalink: `https://www.reddit.com${d.permalink}`,
      url: d.url && !d.url.includes("reddit.com") ? d.url : null,
      author: d.author || "",
      score: typeof d.score === "number" ? d.score : 0,
      numComments: typeof d.num_comments === "number" ? d.num_comments : 0,
      flair: d.link_flair_text || null,
      createdUtc: typeof d.created_utc === "number" ? d.created_utc : 0,
    });
  }
  return out;
}

/**
 * Haal posts uit een subreddit (sort: hot|top|new). Lege lijst zonder creds of
 * bij een fout, zodat de aanroeper altijd veilig kan doorgaan.
 */
export async function fetchSubredditPosts(
  subreddit: string,
  sort: "hot" | "top" | "new" = "hot",
  limit = 25,
  timeframe: "day" | "week" | "month" = "week"
): Promise<RedditPost[]> {
  const c = readCreds();
  if (!c) return [];
  const token = await getToken(c);
  if (!token) return [];
  try {
    const tParam = sort === "top" ? `&t=${timeframe}` : "";
    const res = await fetch(`${API_BASE}/r/${subreddit}/${sort}?limit=${limit}&raw_json=1${tParam}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": c.ua },
    });
    if (!res.ok) return [];
    return normalizePosts(await res.json(), subreddit);
  } catch {
    return [];
  }
}
