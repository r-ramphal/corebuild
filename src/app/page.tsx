import { GiastHero } from "@/components/home/GiastHero";
import { GiastMarquee } from "@/components/home/GiastMarquee";
import { GiastTerminal } from "@/components/home/GiastTerminal";
import { GiastCategories } from "@/components/home/GiastCategories";
import { GiastShowcase } from "@/components/home/GiastShowcase";
import { GiastManifest } from "@/components/home/GiastManifest";
import { Reveal } from "@/components/motion/Reveal";

export default function Home() {
  return (
    <main className="pt-16 bg-gp-bg">
      <GiastHero />
      <GiastMarquee />
      <Reveal>
        <GiastTerminal />
      </Reveal>
      <Reveal>
        <GiastCategories />
      </Reveal>
      <Reveal>
        <GiastShowcase />
      </Reveal>
      <Reveal>
        <GiastManifest />
      </Reveal>
    </main>
  );
}
