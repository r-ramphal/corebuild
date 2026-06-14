import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { POSTS, formatBlogDate } from "@/lib/blog";
import type { BlogMeta } from "@/lib/blog-types";

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

function Meta({ meta }: { meta: BlogMeta }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-mono text-[11px] border border-primary/30">
        {formatBlogDate(meta.date)}
      </span>
      <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full font-label-mono text-[11px] border border-outline-variant inline-flex items-center gap-1">
        <Clock className="w-3 h-3" /> {meta.readingMinutes} min
      </span>
    </div>
  );
}

function Card({ meta }: { meta: BlogMeta }) {
  return (
    <Link
      href={`/blog/${meta.slug}`}
      className="glass-card glow-hover rounded-2xl p-6 flex flex-col group h-full"
    >
      <Meta meta={meta} />
      <h3 className="font-headline-md text-[19px] text-text-primary mb-2 group-hover:text-primary transition-colors">
        {meta.title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-4 line-clamp-3">
        {meta.description}
      </p>
      <span className="mt-auto inline-flex items-center gap-1.5 font-label-technical text-label-technical text-primary">
        Lees verder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );
}

export default function BlogIndexPage() {
  const featured = POSTS[0]?.meta;
  const side = POSTS.slice(1, 3).map((p) => p.meta);
  const more = POSTS.slice(3).map((p) => p.meta);

  return (
    <main className="pt-24 pb-16 min-h-screen px-4 sm:px-8">
      <div className="max-w-[1280px] mx-auto">
        <header className="mb-12 max-w-2xl">
          <h1 className="font-headline-hero-mobile md:font-headline-hero text-headline-hero-mobile md:text-headline-hero text-text-primary mb-4">
            Tech-uitleg &amp; koopgidsen
          </h1>
          <p className="font-body-lg text-body-lg text-text-secondary">
            Begrijpelijke uitleg over pc-onderdelen, compatibiliteit en prijs-prestatie. Geen reclame,
            gewoon wat handig is om te weten voordat je kiest.
          </p>
        </header>

        {featured && (
          <section className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Featured */}
            <Link
              href={`/blog/${featured.slug}`}
              className="md:col-span-2 glass-card glow-hover rounded-2xl overflow-hidden group relative min-h-[320px] flex flex-col justify-end p-8"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-surface-card to-surface-card" />
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
              <Meta meta={featured} />
              <h2 className="font-headline-lg text-headline-lg text-text-primary mb-3 max-w-xl group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-4 line-clamp-2">
                {featured.description}
              </p>
              <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical text-primary">
                Lees verder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Zijkaarten */}
            <div className="flex flex-col gap-6">
              {side.map((meta) => (
                <Card key={meta.slug} meta={meta} />
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {more.map((meta) => (
              <Card key={meta.slug} meta={meta} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
