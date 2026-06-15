"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  "╔══════════════════════════════╗",
  "║   COREBUILD // BUILD SYSTEM   ║",
  "╚══════════════════════════════╝",
  "const order = new BuildOrder();",
  "order.start();",
  "→ voorraad controleren...",
  "status: CPU[OK] GPU[OK] RAM[OK]",
  "build initialiseren...",
  "koppel('Moederbord')  → ok",
  "koppel('Processor')   → ok",
  "koppel('Koeler')      → ok",
  "koppel('Geheugen')    → ok",
  "koppel('Videokaart')  → ok",
  "koppel('Opslag')      → ok",
  "koppel('Voeding')     → ok",
  "koppel('Behuizing')   → ok",
  "[████░░░░░░] 40% assemblage",
  "[████████░░] 80% assemblage",
  "kabels gerouteerd · thermisch stabiel",
  "POST-test: geslaagd",
  "compatibiliteit(): COMPATIBEL ✓",
  "prijzen vergelijken... 5 retailers",
  "beste prijs gevonden ✓",
  "build gereed.",
];

function Line({ text }: { text: string }) {
  return (
    <div className="whitespace-pre text-gp-orange">
      <span className="opacity-50">{">"} </span>
      {text}
    </div>
  );
}

export function GiastTerminal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Geen typanimatie: toon alles ineens (gedeferd zodat het niet
      // synchroon in de effect-body gebeurt en hydration veilig blijft).
      timer = setTimeout(() => {
        if (cancelled) return;
        setShown(LINES);
        setDone(true);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const type = () => {
      let li = 0;
      let ci = 0;
      const step = () => {
        if (cancelled) return;
        if (li >= LINES.length) {
          setDone(true);
          return;
        }
        const line = LINES[li];
        if (ci <= line.length) {
          setCurrent(line.slice(0, ci));
          ci += 1;
          timer = setTimeout(step, 13);
        } else {
          setShown((p) => [...p, line]);
          setCurrent("");
          li += 1;
          ci = 0;
          timer = setTimeout(step, 95);
        }
      };
      step();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          io.disconnect();
          type();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  return (
    <section className="bg-gp-bg text-gp-ink border-b border-gp-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 gp-rule-x py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Linkertekst */}
        <div className="lg:col-span-4 min-w-0">
          <p className="font-plex text-[12px] uppercase tracking-[0.2em] text-gp-ink-soft mb-6">
            <span className="text-gp-orange">_</span>live build
          </p>
          <h2 className="font-mont font-extrabold text-[30px] sm:text-[40px] leading-[1.05] mb-5">
            Elke build, stap voor stap geassembleerd.
          </h2>
          <p className="font-plex text-[14px] leading-relaxed text-gp-ink-soft">
            Van voorraadcheck tot compatibiliteit en de beste prijs — automatisch, transparant,
            zonder ruis.
          </p>
        </div>

        {/* Terminal-paneel */}
        <div className="lg:col-span-8 min-w-0">
          <div className="border border-gp-line bg-gp-bg-soft overflow-hidden">
            {/* Titelbalk */}
            <div className="gp-bar flex items-center justify-between px-4 py-2">
              <span className="font-pixel text-[15px] leading-none tracking-wide">build.log</span>
              <span className="font-plex text-[11px] opacity-90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/90" />
                <span className="w-2 h-2 rounded-full bg-white/60" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </span>
            </div>
            {/* Body */}
            <div
              ref={rootRef}
              className="font-plex text-[10px] sm:text-[13px] leading-[1.55] p-3 sm:p-6 h-[320px] sm:h-[360px] overflow-hidden flex flex-col justify-end"
              aria-label="Gesimuleerde build-log"
            >
              {shown.map((l, i) => (
                <Line key={i} text={l} />
              ))}
              {!done && (
                <div className="whitespace-pre text-gp-orange">
                  <span className="opacity-50">{">"} </span>
                  {current}
                  <span className="gp-caret-block" />
                </div>
              )}
              {done && (
                <div className="whitespace-pre text-gp-orange">
                  <span className="opacity-50">{">"} </span>
                  <span className="gp-caret-block" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
