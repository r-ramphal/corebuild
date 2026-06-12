import { Hero } from "@/components/home/Hero";
import { Snelkoppelingen } from "@/components/home/Snelkoppelingen";
import { CompatCheck } from "@/components/home/CompatCheck";

export default function Home() {
  return (
    <main className="pt-16">
      <Hero />
      <Snelkoppelingen />
      <CompatCheck />
    </main>
  );
}
