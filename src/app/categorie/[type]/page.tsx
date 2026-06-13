import type { Metadata } from "next";
import { CategorieClient } from "@/components/CategorieClient";
import { COMPONENT_META, CATALOG_TYPES } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

interface Props {
  params: Promise<{ type: string }>;
}

export function generateStaticParams() {
  return CATALOG_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const meta = COMPONENT_META[type as ComponentType];

  if (!meta) {
    return { title: "Categorie niet gevonden" };
  }

  return {
    title: `${meta.pageTitle} vergelijken`,
    description: meta.description,
    alternates: {
      canonical: `/categorie/${type}`,
    },
    openGraph: {
      title: `${meta.pageTitle} vergelijken | CoreBuild`,
      description: meta.description,
      url: `https://corebuildnl.com/categorie/${type}`,
    },
  };
}

export default async function CategoriePage({ params }: Props) {
  const { type } = await params;
  // key={type} remount het component bij wisselen van categorie, zodat de
  // zoek-/filterstate vanzelf reset (geen reset-effect nodig).
  return <CategorieClient key={type} />;
}
