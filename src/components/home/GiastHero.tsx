"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

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
        <div className="grid lg:grid-cols-12 gap-8 pt-28 pb-20">
          {/* Tekstkolom */}
          <div className="lg:col-span-8">
            <p className="font-plex text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-gp-ink-soft mb-7">
              <span className="text-gp-orange">_</span>CONFIGURATOR // CoreBuild — PC op maat
            </p>

            <h1 className="font-mont font-extrabold leading-[0.98] tracking-tight text-[44px] sm:text-[64px] lg:text-[80px]">
              <span className="block">Een pc op maat,</span>
              <span className="block">
                gebouwd om te{" "}
                <span
                  key={i}
                  className="gp-highlight gp-word-in inline-block uppercase"
                >
                  {WORDS[i]}
                </span>
              </span>
            </h1>

            <p className="font-plex text-[14px] sm:text-[15px] leading-relaxed text-gp-ink-soft max-w-xl mt-8">
              <span className="text-gp-orange">_</span>Compatibiliteit automatisch gecheckt. Live prijzen
              van 5 retailers, per onderdeel. Geen standaardoplossingen — jouw build, jouw regels.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                href="/builder"
                className="group inline-flex items-center justify-center gap-2 bg-gp-orange hover:bg-gp-orange-dark text-white font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
              >
                Open de PC Builder
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/categorie"
                className="group inline-flex items-center justify-center gap-2 border border-gp-ink hover:bg-gp-ink hover:text-gp-bg text-gp-ink font-plex text-[13px] uppercase tracking-wider px-7 py-4 transition-colors"
              >
                <Plus className="w-4 h-4" /> Bekijk onderdelen
              </Link>
            </div>
          </div>

          {/* Decoratieve technische kolom */}
          <div className="hidden lg:flex lg:col-span-4 items-center justify-center relative" aria-hidden="true">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border border-gp-line-strong" />
              <div className="absolute inset-6 rounded-full border border-gp-line" />
              {/* crosshair */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gp-line -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gp-line -translate-y-1/2" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gp-orange rounded-full" />
              <span className="absolute -bottom-6 right-0 font-plex text-[11px] uppercase tracking-widest text-gp-ink-soft">
                _build/ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Onderrand */}
      <div className="border-t border-gp-line" />
    </section>
  );
}
