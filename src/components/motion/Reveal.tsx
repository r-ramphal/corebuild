"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Verticale verschuiving bij binnenkomst (px) */
  y?: number;
  /** Vertraging (s) */
  delay?: number;
  /** Stagger de directe kinderen i.p.v. het hele blok */
  stagger?: boolean;
}

/**
 * Scroll-reveal-wrapper (GSAP + ScrollTrigger). Bij prefers-reduced-motion
 * wordt er niets geanimeerd (inhoud is meteen zichtbaar). Cleanup via useGSAP.
 */
export function Reveal({ children, className, y = 28, delay = 0, stagger = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger ? ref.current!.children : ref.current!;
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.7,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
