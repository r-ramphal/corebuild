import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductClient } from "@/components/ProductClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

function deslug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { q } = await searchParams;
  const name = q ?? deslug(slug);

  return {
    title: `${name} — prijzen vergelijken`,
    description: `Vergelijk actuele prijzen voor ${name} bij Amazon, Bol.com, Megekko, Azerty en Alternate. Vind de laagste prijs en voeg toe aan je PC-build.`,
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <main className="pt-16 min-h-screen">
          <div className="max-w-[1280px] mx-auto px-8 py-8 text-on-surface-variant">Laden...</div>
        </main>
      }
    >
      <ProductClient />
    </Suspense>
  );
}
