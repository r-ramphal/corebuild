"use client";

import { useEffect } from "react";

/**
 * Smooth scroll (Lenis) gekoppeld aan GSAP ScrollTrigger. Uitgeschakeld bij
 * prefers-reduced-motion. Rendert niets — alleen het scroll-gedrag.
 *
 * Lenis + GSAP worden **dynamisch** geïmporteerd binnen het effect, dus ze
 * zitten niet in de initiële bundle: ze laden pas ná hydratie (en helemaal niet
 * bij reduced-motion). Scheelt zwaar JS op het kritieke pad, zeker op pagina's
 * zonder scroll-animaties.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
