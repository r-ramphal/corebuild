"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Roterende fotoshowcase in de "Slim samenstellen"-sectie: echte foto's van
 * pc-onderdelen die elkaar afwisselen, voor de duidelijkheid bij het bouwen.
 * Wisselt vanzelf, tenzij de bezoeker reduced-motion heeft ingesteld.
 */
const IMAGES = Array.from({ length: 9 }, (_, i) => `/images/build/build-${i + 1}.jpg`);
const ALT = "Voorbeeld van een samengestelde pc: moederbord, koeler en videokaart";

export function RotatingShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((p) => (p + 1) % IMAGES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 aspect-[4/3] rounded-xl border border-outline-variant shadow-2xl overflow-hidden bg-surface-container">
      {IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === active ? ALT : ""}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          priority={i === 0}
          className={`object-cover transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      {/* Indicator van de huidige foto */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {IMAGES.map((src, i) => (
          <span
            key={src}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
