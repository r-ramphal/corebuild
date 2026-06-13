import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getPost, POSTS, formatBlogDate } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artikel niet gevonden" };
  const { meta } = post;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/blog/${meta.slug}` },
    openGraph: {
      title: `${meta.title} | CoreBuild`,
      description: meta.description,
      url: `https://corebuildnl.com/blog/${meta.slug}`,
      type: "article",
      publishedTime: meta.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { meta, Body } = post;

  return (
    <main className="pt-16 min-h-screen">
      <article className="max-w-2xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-label-technical text-label-technical text-on-surface-variant hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Blog
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3 font-label-technical text-label-technical text-on-surface-variant">
            <time dateTime={meta.date}>{formatBlogDate(meta.date)}</time>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {meta.readingMinutes} min lezen
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight">{meta.title}</h1>
        </header>

        <Body />

        <footer className="mt-12 pt-6 border-t border-outline-variant">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-label-technical text-label-technical text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Terug naar alle artikelen
          </Link>
        </footer>
      </article>
    </main>
  );
}
