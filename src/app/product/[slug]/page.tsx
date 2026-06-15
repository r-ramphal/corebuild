import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductClient } from "@/components/ProductClient";
import { JsonLd } from "@/components/JsonLd";
import { COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

const BASE_URL = "https://corebuildnl.com";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; cat?: string }>;
}

function deslug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { q } = await searchParams;
  const name = q ?? deslug(slug);

  return {
    title: `${name} prijzen vergelijken`,
    description: `Vergelijk actuele prijzen voor ${name} bij Amazon, Bol.com, Megekko, Azerty en Alternate. Vind de laagste prijs en voeg toe aan je PC-build.`,
    alternates: {
      canonical: `/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q, cat } = await searchParams;
  const name = q ?? deslug(slug);
  const meta = cat && cat in COMPONENT_META ? COMPONENT_META[cat as ComponentType] : undefined;

  // BreadcrumbList: Home › [Categorie] › Product. Server-gerenderd (geen live
  // prijsdata nodig) zodat crawlers het ook zonder JS-executie zien.
  const crumbs: { name: string; url: string }[] = [{ name: "Home", url: BASE_URL }];
  if (meta && cat) {
    crumbs.push({ name: meta.label, url: `${BASE_URL}/categorie/${cat}` });
  }
  crumbs.push({ name, url: `${BASE_URL}/product/${slug}` });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <Suspense
        fallback={
          <main className="pt-16 min-h-screen">
            <div className="max-w-[1280px] mx-auto px-8 py-8 text-on-surface-variant">Laden...</div>
          </main>
        }
      >
        <ProductClient />
      </Suspense>
    </>
  );
}
