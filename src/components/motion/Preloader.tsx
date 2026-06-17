"use client";

/**
 * Branded intro-preloader in Swiss-brutal huisstijl: donkere fullscreen-overlay
 * met blueprint-grid, een oranje gp-bar-header en een teller die 0→100 telt.
 * Terwijl de teller klimt "assembleert" de build: de 8 PC-onderdelen lichten
 * één voor één op (CPU → … → COOL). Daarna veegt het paneel omhoog weg en
 * onthult de homepage.
 *
 * - Alleen het EERSTE bezoek per sessie (sessionStorage), homepage-only.
 * - 0→100 loopt vloeiend (~1,8s); onthulling wacht tot window.load, met cap.
 * - prefers-reduced-motion: geen animatie, overlay direct weg.
 * - aria-hidden + decoratief (de echte content staat er al onder).
 *
 * Cleanup via useGSAP. Spiegelt het patroon van Reveal.tsx.
 */
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const SESSION_KEY = "cb_intro_shown";
/** Veiligheids-cap: nooit langer dan dit op de pagina-klaar-melding wachten (ms). */
const READY_CAP_MS = 3500;
/** Korte technische codes voor de 8 kernonderdelen (lichten progressief op). */
const COMPONENTS = ["CPU", "GPU", "MOBO", "RAM", "SSD", "PSU", "CASE", "COOL"];

const TRACK = "repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 16px, transparent 16px 20px)";
const FILL = "repeating-linear-gradient(90deg, #ff8800 0 16px, transparent 16px 20px)";

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const comps = useRef<(HTMLLIElement | null)[]>([]);
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seen = sessionStorage.getItem(SESSION_KEY) === "1";
      if (reduced || seen) {
        setGone(true); // niets animeren — overlay meteen weg
        return;
      }
      // Sessievlag pas ná afloop zetten (zie exit): zo speelt de intro ook in
      // dev af, waar React Strict Mode het effect twee keer aanroept.

      // Scroll vergrendelen tijdens de intro; netjes herstellen achteraf.
      const html = document.documentElement;
      const prevOverflow = html.style.overflow;
      html.style.overflow = "hidden";

      const count = { v: 0 };
      const render = () => {
        const v = count.v;
        if (num.current) num.current.textContent = String(Math.round(v)).padStart(2, "0");
        if (bar.current) bar.current.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
        const active = Math.floor((v / 100) * COMPONENTS.length + 1e-6);
        comps.current.forEach((el, i) => {
          if (el) el.dataset.state = i < active ? "on" : "off";
        });
      };
      render();

      let counted = false;
      let ready = false;
      let exited = false;

      const restore = () => {
        html.style.overflow = prevOverflow;
      };
      const exit = () => {
        if (exited || !counted || !ready) return;
        exited = true;
        gsap
          .timeline({
            onComplete: () => {
              restore();
              sessionStorage.setItem(SESSION_KEY, "1"); // pas nu: intro volledig getoond
              setGone(true); // unmount na de onthulling
            },
          })
          .to(center.current, { autoAlpha: 0, y: -24, duration: 0.45, ease: "power2.in" })
          .to(root.current, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, "-=0.15");
      };

      // De teller loopt altijd vloeiend 0→100 (~1,8s, snel klimmend en afremmend).
      gsap.to(count, {
        v: 100,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: render,
        onComplete: () => {
          counted = true;
          exit();
        },
      });

      // "Pagina klaar": window.load (afbeeldingen/fonts), met een cap als safety.
      const markReady = () => {
        ready = true;
        exit();
      };
      if (document.readyState === "complete") markReady();
      else window.addEventListener("load", markReady, { once: true });
      const safety = window.setTimeout(markReady, READY_CAP_MS);

      return () => {
        window.removeEventListener("load", markReady);
        window.clearTimeout(safety);
        restore();
      };
    },
    { scope: root }
  );

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-gp-ink text-gp-bg"
    >
      {/* Blueprint-raster (technische tekening), subtiel op het donker */}
      <div className="pointer-events-none absolute inset-0 gp-grid opacity-[0.08]" />

      <div ref={center} className="relative flex flex-col items-center gap-6">
        <div className="w-[min(92vw,540px)] border border-gp-bg/20">
          {/* Oranje titelbalk (gp-bar) — pixel-font, zoals de build.log-terminal */}
          <div className="gp-bar flex items-center justify-between px-4 py-2">
            <span className="font-pixel text-[15px] leading-none tracking-wide">cb_init.sys</span>
            <span className="font-plex text-[11px] tracking-wider opacity-90">{"// PC-ONDERDELEN"}</span>
          </div>

          <div className="p-5 sm:p-7">
            <p className="mb-5 font-plex text-[11px] uppercase tracking-[0.2em] text-gp-bg/60">
              <span className="text-gp-orange">_</span> systeem assembleren
            </p>

            {/* Teller (kleiner dan eerst) */}
            <div className="mb-5 flex items-start font-mont font-extrabold leading-none">
              <span ref={num} className="tabular-nums text-[15vw] sm:text-[96px]">
                00
              </span>
              <span className="ml-1 mt-[0.5em] text-[5vw] text-gp-orange sm:text-[32px]">%</span>
            </div>

            {/* Blokkige voortgangsbalk (echo van [████░░] uit de terminal) */}
            <div className="relative mb-6 h-3 w-full" style={{ backgroundImage: TRACK }}>
              <span
                ref={bar}
                className="absolute inset-0 origin-left"
                style={{ backgroundImage: FILL, clipPath: "inset(0 100% 0 0)" }}
              />
            </div>

            {/* Onderdelen-checklist — licht progressief op tijdens het laden */}
            <ul className="grid grid-cols-4 gap-x-3 gap-y-2 font-plex text-[11px] uppercase tracking-wider">
              {COMPONENTS.map((c, i) => (
                <li
                  key={c}
                  ref={(el) => {
                    comps.current[i] = el;
                  }}
                  data-state="off"
                  className="group flex items-center gap-1 text-gp-bg/35 transition-colors data-[state=on]:text-gp-orange"
                >
                  <span className="text-[8px] leading-none opacity-60 group-data-[state=on]:opacity-100">
                    ■
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="font-mont text-[13px] font-extrabold tracking-tight text-gp-bg">
          Core<span className="text-gp-orange">Build</span>
        </div>
      </div>
    </div>
  );
}
