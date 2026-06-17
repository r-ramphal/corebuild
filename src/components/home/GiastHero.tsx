"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { GiastBlueprint } from "@/components/home/GiastBlueprint";

const WORDS = ["GAMEN", "WERKEN", "CREËREN", "STREAMEN"];

export function GiastHero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % WORDS.length), 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative bg-gp-bg text-gp-ink overflow-hidden">
      {/* Blueprint-raster */}
      <div className="gp-grid gp-grid-fade absolute inset-0 pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-24 sm:pt-28 pb-16 sm:pb-20">
          {/* Tekstkolom */}
          <div className="lg:col-span-8 min-w-0">
            <p className="font-plex text-[11px] sm:text-[13px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-gp-ink-soft mb-6 sm:mb-7 break-words">
              <span className="text-gp-orange">_</span>CONFIGURATOR // CoreBuild — PC op maat
            </p>

            <h1 className="font-mont font-extrabold leading-[1.02] sm:leading-[0.98] tracking-tight break-words text-[28px] sm:text-[52px] lg:text-[80px]">
              <span className="block">Een pc op maat,</span>
              <span className="block">gebouwd om te</span>
              <span
                key={i}
                className="gp-highlight gp-word-in inline-block uppercase mt-1"
              >
                {WORDS[i]}
              </span>
            </h1>

            <p className="font-plex text-[14px] sm:text-[15px] leading-relaxed text-gp-ink-soft max-w-xl mt-8">
              <span className="text-gp-orange">_</span>Compatibiliteit automatisch gecheckt. Live prijzen
              van 5 retailers per onderdeel. En je build slim verdeeld over winkels — zodat je het láágste
              totaal betaalt.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                href="/builder"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
              >
                Open de PC Builder
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/categorie"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gp-ink hover:bg-gp-ink hover:text-gp-bg text-gp-ink font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
              >
                <Plus className="w-4 h-4" /> Bekijk onderdelen
              </Link>
            </div>
          </div>

          {/* Modern technisch system-schema (vervangt de hero-foto) */}
          <div className="hidden lg:flex lg:col-span-4 items-center justify-center">
            <GiastBlueprint />
          </div>
        </div>
      </div>

      {/* Onderrand */}
      <div className="border-t border-gp-line" />
    </section>
  );
}
