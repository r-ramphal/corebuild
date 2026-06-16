import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { POSTS, formatBlogDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — uitleg & koopgidsen",
  description:
    "Begrijpelijke uitleg en koopgidsen over pc-onderdelen: voeding, videokaart, compatibiliteit en meer. Zonder reclame.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | CoreBuild",
    description: "Uitleg en koopgidsen over pc-onderdelen, zonder reclame.",
    url: "https://corebuildnl.com/blog",
  },
};

export default function BlogIndexPage() {
  const [featured, ...rest] = POSTS;

  return (
    <main className="pt-16 min-h-screen bg-gp-bg text-gp-ink">
      {/* Header */}
      <section className="border-b border-gp-line">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-12 sm:py-16">
          <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-4">
            <span className="text-gp-orange">_</span>blog
          </p>
          <h1 className="font-mont font-extrabold text-[30px] sm:text-[42px] leading-tight mb-4">
            Uitleg &amp; koopgidsen
          </h1>
          <p className="font-plex text-[14px] text-gp-ink-soft max-w-2xl leading-relaxed">
            Begrijpelijke uitleg over pc-onderdelen. Geen reclame, gewoon wat handig is om te weten
            voordat je kiest.
          </p>
        </div>
      </section>

      {/* Bento-grid: eerste post uitgelicht (groot), de rest in de rechterkolom */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {featured && (
            <Link
              href={`/blog/${featured.meta.slug}`}
              className="group md:col-span-2 md:row-span-2 border border-gp-line bg-gp-bg-soft flex flex-col p-7 sm:p-9 hover:border-gp-orange transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-pixel text-[18px] text-gp-orange leading-none">01</span>
                <span className="gp-bar font-plex text-[10px] uppercase tracking-wider px-2 py-1">
                  Uitgelicht
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4 font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft">
                <time dateTime={featured.meta.date}>{formatBlogDate(featured.meta.date)}</time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {featured.meta.readingMinutes} min
                </span>
              </div>
              <h2 className="font-mont font-extrabold text-[24px] sm:text-[30px] leading-tight mb-4 group-hover:text-gp-orange transition-colors">
                {featured.meta.title}
              </h2>
              <p className="font-plex text-[14px] text-gp-ink-soft leading-relaxed mb-6 max-w-xl">
                {featured.meta.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 font-plex text-[12px] uppercase tracking-wider text-gp-orange">
                Lees verder
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </Link>
          )}

          {rest.map((post, i) => (
            <Link
              key={post.meta.slug}
              href={`/blog/${post.meta.slug}`}
              className="group border border-gp-line bg-gp-bg flex flex-col p-6 hover:border-gp-orange transition-colors"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-pixel text-[16px] text-gp-orange leading-none">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gp-ink-soft group-hover:text-gp-orange transition-colors" />
              </div>
              <div className="flex items-center gap-3 mb-3 font-plex text-[11px] uppercase tracking-wider text-gp-ink-soft">
                <time dateTime={post.meta.date}>{formatBlogDate(post.meta.date)}</time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.meta.readingMinutes} min
                </span>
              </div>
              <h2 className="font-mont font-bold text-[17px] leading-tight mb-2 group-hover:text-gp-orange transition-colors">
                {post.meta.title}
              </h2>
              <p className="font-plex text-[12px] text-gp-ink-soft leading-relaxed line-clamp-3">
                {post.meta.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
