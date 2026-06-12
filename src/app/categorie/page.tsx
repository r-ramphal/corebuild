import { CategoryGrid } from "@/components/CategoryGrid";

export const metadata = {
  title: "Categorieën — CoreBuild",
};

export default function CategorieIndexPage() {
  return (
    <main className="mt-16 max-w-[1280px] mx-auto px-8 py-16 min-h-screen w-full">
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Categorieën</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          Blader door de nieuwste hardware per categorie.
        </p>
      </div>

      <CategoryGrid />
    </main>
  );
}
