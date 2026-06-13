import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
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
  return (
    <main className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">Blog</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">
          Begrijpelijke uitleg en koopgidsen over pc-onderdelen. Geen reclame, gewoon wat handig is om te
          weten voordat je kiest.
        </p>

        <div className="divide-y divide-outline-variant">
          {POSTS.map(({ meta }) => (
            <article key={meta.slug} className="py-7 first:pt-0 group">
              <Link href={`/blog/${meta.slug}`} className="block">
                <div className="flex items-center gap-3 mb-2 font-label-technical text-label-technical text-on-surface-variant">
                  <time dateTime={meta.date}>{formatBlogDate(meta.date)}</time>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {meta.readingMinutes} min
                  </span>
                </div>
                <h2 className="font-title-md text-[20px] text-on-surface group-hover:text-primary transition-colors mb-2">
                  {meta.title}
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-3">
                  {meta.description}
                </p>
                <span className="inline-flex items-center gap-1.5 font-label-technical text-label-technical text-primary">
                  Lees verder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
