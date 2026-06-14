import Link from "next/link";
import { COMPONENT_TYPES, COMPONENT_META } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";

/** Brutalistische categorie-index: bordered cellen, mono-indexnummers, hover → oranje. */
export function GiastCategories() {
  return (
    <section className="bg-gp-bg-soft text-gp-ink border-y border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-mont font-extrabold text-[28px] sm:text-[36px]">Onderdelen</h2>
          <Link
            href="/categorie"
            className="font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft hover:text-gp-orange transition-colors"
          >
            _alle categorieën →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-gp-line">
          {COMPONENT_TYPES.map((type, idx) => {
            const Icon = CATEGORY_ICONS[type];
            return (
              <Link
                key={type}
                href={`/categorie/${type}`}
                className="group relative border-r border-b border-gp-line p-5 sm:p-6 aspect-[4/3] flex flex-col justify-between hover:bg-gp-orange transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <span className="font-plex text-[12px] text-gp-ink-soft group-hover:text-white/80">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Icon className="w-5 h-5 text-gp-ink-soft group-hover:text-white transition-colors" />
                </div>
                <span className="font-mont font-bold text-[17px] sm:text-[19px] group-hover:text-white transition-colors">
                  {COMPONENT_META[type].shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
