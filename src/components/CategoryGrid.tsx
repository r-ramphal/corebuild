import Link from "next/link";
import {
  ACCESSORY_TYPES,
  COMPONENT_META,
  COMPONENT_TYPES,
  PERIPHERAL_TYPES,
} from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ComponentType } from "@/lib/types";

/** Categorieën gegroepeerd zodat de lange lijst overzichtelijk blijft. */
const GROUPS: { label: string; hint: string; types: ComponentType[] }[] = [
  {
    label: "Onderdelen",
    hint: "Alles voor in de build",
    types: COMPONENT_TYPES,
  },
  {
    label: "Randapparatuur",
    hint: "Scherm, invoer en geluid",
    types: PERIPHERAL_TYPES,
  },
  {
    label: "Accessoires & extra's",
    hint: "Interne extra's en software",
    types: ACCESSORY_TYPES,
  },
];

function CategoryCard({ type, index }: { type: ComponentType; index: number }) {
  const Icon = CATEGORY_ICONS[type];
  return (
    <Link
      href={`/categorie/${type}`}
      style={{ animationDelay: `${index * 40}ms` }}
      className="relative bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-center group transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_24px_rgba(0,73,219,0.10)] overflow-hidden animate-fade-in-up"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant group-hover:bg-primary group-hover:text-white group-hover:scale-105 transition-all">
        <Icon className="w-7 h-7" />
      </div>
      <span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">
        {COMPONENT_META[type].shortLabel}
      </span>
    </Link>
  );
}

export function CategoryGrid() {
  return (
    <div className="flex flex-col gap-12">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <div className="flex items-baseline gap-3 mb-5">
            <h3 className="font-title-md text-title-md text-on-surface">
              {group.label}
            </h3>
            <span className="font-label-technical text-label-technical text-on-surface-variant">
              {group.hint}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {group.types.map((type, i) => (
              <CategoryCard key={type} type={type} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
