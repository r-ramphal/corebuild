import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { COMPONENT_TYPES, COMPONENT_META } from "@/lib/categories";
import { CATEGORY_IMAGES } from "@/lib/category-images";

/** Categorie-bento met echte foto's: grayscale → kleur op hover, witte label-footer. */
export function GiastCategories() {
  return (
    <section className="bg-gp-bg-soft text-gp-ink border-y border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-12 sm:py-20">
        <div className="flex items-baseline justify-between mb-7 sm:mb-10">
          <h2 className="font-mont font-extrabold text-[28px] sm:text-[36px]">Onderdelen</h2>
          <Link
            href="/categorie"
            className="font-plex text-[12px] uppercase tracking-wider text-gp-ink-soft hover:text-gp-orange transition-colors"
          >
            _alle categorieën →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {COMPONENT_TYPES.map((type, idx) => {
            const img = CATEGORY_IMAGES[type];
            return (
              <Link
                key={type}
                href={`/categorie/${type}`}
                className="group border border-gp-line bg-gp-bg overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gp-ink">
                  {img && (
                    <Image
                      src={img}
                      alt={COMPONENT_META[type].label}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  )}
                  <span className="absolute top-2.5 left-2.5 font-plex text-[11px] bg-gp-bg/90 px-1.5 py-0.5 text-gp-orange font-bold">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t-2 border-gp-orange group-hover:bg-gp-orange transition-colors duration-200">
                  <span className="font-mont font-bold text-[16px] group-hover:text-white transition-colors">
                    {COMPONENT_META[type].shortLabel}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-gp-orange group-hover:text-white transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
