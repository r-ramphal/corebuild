/**
 * Unit-test voor de pure Reddit-listing-parser (geen netwerk/DB).
 * Run: npx tsx scripts/test-reddit.ts
 */
import { normalizePosts } from "../src/lib/reddit";

let failed = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}`);
  if (!cond) failed++;
}

const fixture = {
  data: {
    children: [
      {
        data: {
          id: "abc1",
          subreddit: "buildapc",
          title: "First time build, $1500 1440p gaming",
          permalink: "/r/buildapc/comments/abc1/first_time_build/",
          url: "https://www.reddit.com/r/buildapc/comments/abc1/",
          author: "buildernoob",
          score: 342,
          num_comments: 88,
          link_flair_text: "Build Help",
          created_utc: 1718000000,
        },
      },
      {
        // link-post naar externe URL
        data: {
          id: "abc2",
          subreddit: "buildapcsales",
          title: "[PSU] Corsair RM850e 850W Gold ($99)",
          permalink: "/r/buildapcsales/comments/abc2/psu_corsair/",
          url: "https://example-shop.com/rm850e",
          author: "dealbot",
          score: 120,
          num_comments: 12,
          link_flair_text: "PSU",
          created_utc: 1718100000,
        },
      },
      { data: { id: "sticky", title: "Pinned rules", permalink: "/r/buildapc/x/", stickied: true } },
      { data: { id: "nsfw", title: "nope", permalink: "/r/x/y/", over_18: true } },
      { data: { title: "geen id → overslaan", permalink: "/r/x/z/" } },
    ],
  },
};

const posts = normalizePosts(fixture, "buildapc");

check("twee geldige posts (sticky/nsfw/zonder-id geweerd)", posts.length === 2);
check("permalink wordt absolute reddit-url", posts[0].permalink === "https://www.reddit.com/r/buildapc/comments/abc1/first_time_build/");
check("reddit-url als 'url' → genegeerd (geen externe link)", posts[0].url === null);
check("externe link-post behoudt url", posts[1].url === "https://example-shop.com/rm850e");
check("flair + score + reacties overgenomen", posts[0].flair === "Build Help" && posts[0].score === 342 && posts[0].numComments === 88);
check("lege/ongeldige input → lege lijst", normalizePosts(null, "x").length === 0 && normalizePosts({}, "x").length === 0);

console.log(failed === 0 ? "\nALLE cases — OK" : `\n${failed} FAILS`);
process.exit(failed === 0 ? 0 : 1);
