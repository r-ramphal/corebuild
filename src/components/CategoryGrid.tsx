import Link from "next/link";
import { CATALOG_TYPES, COMPONENT_META } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CATALOG_TYPES.map((type, i) => {
        const Icon = CATEGORY_ICONS[type];
        return (
          <Link
            key={type}
            href={`/categorie/${type}`}
            style={{ animationDelay: `${i * 50}ms` }}
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
      })}
    </div>
  );
}
