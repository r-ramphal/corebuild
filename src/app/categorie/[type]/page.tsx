import type { Metadata } from "next";
import { CategorieClient } from "@/components/CategorieClient";
import { COMPONENT_META, COMPONENT_TYPES } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

interface Props {
  params: Promise<{ type: string }>;
}

export function generateStaticParams() {
  return COMPONENT_TYPES.map((type) => ({ type }));
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

export default function CategoriePage() {
  return <CategorieClient />;
}
