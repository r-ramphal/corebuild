import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";

export function Snelkoppelingen() {
  return (
    <section className="max-w-[1280px] mx-auto px-8 py-16 w-full">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Snelkoppelingen
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            Blader door de nieuwste hardware per categorie.
          </p>
        </div>
        <Link
          href="/categorie"
          className="font-label-technical text-label-technical text-primary hover:underline"
        >
          Bekijk alles
        </Link>
      </div>

      <CategoryGrid />
    </section>
  );
}
