import { GiastHero } from "@/components/home/GiastHero";
import { GiastMarquee } from "@/components/home/GiastMarquee";
import { GiastCategories } from "@/components/home/GiastCategories";
import { GiastManifest } from "@/components/home/GiastManifest";

export default function Home() {
  return (
    <main className="pt-16 bg-gp-bg">
      <GiastHero />
      <GiastMarquee />
      <GiastCategories />
      <GiastManifest />
    </main>
  );
}
