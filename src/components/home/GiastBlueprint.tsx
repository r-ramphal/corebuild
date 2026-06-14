"use client";

import { useEffect, useState } from "react";

const SLOTS = ["CPU", "GPU", "RAM", "SSD", "PSU", "MOBO", "CASE", "COOL"];
const STATUS = ["SCANNING…", "COMPAT: OK", "5 RETAILERS", "BESTE PRIJS", "BUILD READY"];

const CX = 160;
const CY = 160;
const R = 120;

/**
 * Modern technisch "system blueprint"-element voor de hero: de 8 build-slots
 * rond een core, met radar-sweep + cyclende status. Vervangt de hero-foto.
 * Animaties zijn reduced-motion-veilig (globale media-query zet ze uit).
 */
export function GiastBlueprint() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((p) => (p + 1) % STATUS.length), 1700);
    return () => clearInterval(id);
  }, []);

  const nodes = SLOTS.map((label, i) => {
    const a = (i / SLOTS.length) * Math.PI * 2 - Math.PI / 2;
    return { label, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), i };
  });

  return (
    <div className="relative w-full max-w-[380px] mx-auto" aria-hidden="true">
      <div className="relative border border-gp-line bg-gp-bg p-5">
        <div className="gp-grid absolute inset-0 opacity-50 pointer-events-none" />

        {/* Hoekmarkeringen */}
        <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gp-orange" />
        <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gp-orange" />

        <svg viewBox="0 0 320 320" className="relative w-full h-auto">
          {/* Ringen + crosshair */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--gp-line-strong)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={R - 44} fill="none" stroke="var(--gp-line)" strokeWidth="1" />
          <line x1={CX} y1="14" x2={CX} y2="306" stroke="var(--gp-line)" strokeWidth="1" />
          <line x1="14" y1={CY} x2="306" y2={CY} stroke="var(--gp-line)" strokeWidth="1" />

          {/* Verbindingen + nodes */}
          {nodes.map((n) => (
            <g key={n.label}>
              <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke="var(--gp-line)" strokeWidth="1" />
              <circle
                cx={n.x}
                cy={n.y}
                r="5"
                fill="var(--gp-bg)"
                stroke="var(--gp-ink)"
                strokeWidth="1.5"
                className="gp-node"
                style={{ animationDelay: `${n.i * 0.18}s` }}
              />
              <text
                x={n.x}
                y={n.y - 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--gp-ink-soft)"
                style={{ fontFamily: "var(--font-plex-mono), monospace" }}
              >
                {n.label}
              </text>
            </g>
          ))}

          {/* Roterende sweep */}
          <g className="gp-sweep">
            <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke="var(--gp-orange)" strokeWidth="1.5" opacity="0.7" />
          </g>

          {/* Core */}
          <circle cx={CX} cy={CY} r="11" fill="var(--gp-orange)" />
          <circle cx={CX} cy={CY} r="4" fill="var(--gp-bg)" />
        </svg>
      </div>

      {/* Status-regel */}
      <div className="flex justify-between mt-2 font-plex text-[11px] uppercase tracking-widest text-gp-ink-soft">
        <span>_system</span>
        <span className="text-gp-orange">{STATUS[s]}</span>
      </div>
    </div>
  );
}
