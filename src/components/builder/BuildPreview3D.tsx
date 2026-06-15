"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { RotateCcw } from "lucide-react";
import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType } from "@/lib/types";

/**
 * 3D-aanzicht van de build, dependency-vrij met CSS-3D-transforms (geen three.js).
 * Onderdelen zijn belichte solids (per vlak een lichtfactor → realistischer dan
 * een platte wireframe) in een open behuizing zodat je naar binnen kijkt. Sleep om
 * te draaien; idle draait hij zachtjes vanzelf (tenzij reduced-motion). Klik een
 * onderdeel in de legenda om het te kiezen/wijzigen.
 */

type Face = "front" | "back" | "left" | "right" | "top" | "bottom";
const ALL_FACES: Face[] = ["front", "back", "left", "right", "top", "bottom"];

// Lichtfactor per vlak (bovenkant het felst, onderkant het donkerst) → fake shading.
const LIGHT: Record<Face, number> = {
  top: 1,
  front: 0.84,
  right: 0.6,
  left: 0.48,
  back: 0.4,
  bottom: 0.3,
};

const SHADOW_BASE = "#0c0e12"; // donkere basis waarmee we de kleur per vlak mengen
const DEFAULT_ROT = { x: -18, y: -32 };

interface BoxProps {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  color: string;
  on: boolean;
  hot?: boolean;
  faces?: Face[];
  /** 0–100: hoeveel het materiaal de eigen kleur houdt (rest = donker) */
  tint?: number;
  children?: React.ReactNode;
}

function Box({ x, y, z, w, h, d, color, on, hot = false, faces = ALL_FACES, tint = 80, children }: BoxProps) {
  const faceStyle = (fw: number, fh: number, transform: string, light: number): CSSProperties => {
    const pct = Math.round(light * tint);
    const bg = on ? `color-mix(in srgb, ${color} ${pct}%, ${SHADOW_BASE})` : "transparent";
    const border = on
      ? hot
        ? `color-mix(in srgb, ${color} 85%, #fff)`
        : `color-mix(in srgb, ${color} 55%, #000)`
      : "var(--cb-outline-variant)";
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: fw,
      height: fh,
      marginLeft: -fw / 2,
      marginTop: -fh / 2,
      background: bg,
      border: `1px ${on ? "solid" : "dashed"} ${border}`,
      transform,
      opacity: on ? 1 : 0.4,
      boxShadow: on && hot ? `0 0 14px color-mix(in srgb, ${color} 65%, transparent)` : "none",
    };
  };
  const F: Record<Face, CSSProperties> = {
    front: faceStyle(w, h, `translateZ(${d / 2}px)`, LIGHT.front),
    back: faceStyle(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, LIGHT.back),
    right: faceStyle(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, LIGHT.right),
    left: faceStyle(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, LIGHT.left),
    top: faceStyle(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, LIGHT.top),
    bottom: faceStyle(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, LIGHT.bottom),
  };
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    >
      {faces.map((f) => (
        <div key={f} style={F[f]} />
      ))}
      {children}
    </div>
  );
}

/** Platte schijf = ventilator-hint (ring + naaf). Ligt in een vlak via `rot`. */
function Fan({ x, y, z, dia, color, rot, on }: { x: number; y: number; z: number; dia: number; color: string; rot: string; on: boolean }) {
  if (!on) return null;
  const ring = `color-mix(in srgb, ${color} 65%, #000)`;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: dia,
        height: dia,
        marginLeft: -dia / 2,
        marginTop: -dia / 2,
        borderRadius: "50%",
        border: `2px solid ${ring}`,
        background: `radial-gradient(circle, ${ring} 0 ${dia * 0.1}px, transparent ${dia * 0.14}px), conic-gradient(from 0deg, color-mix(in srgb, ${color} 35%, transparent), transparent 90deg, color-mix(in srgb, ${color} 35%, transparent) 180deg, transparent 270deg)`,
        transform: `translate3d(${x}px, ${y}px, ${z}px) ${rot}`,
      }}
    />
  );
}

// Kleuren per onderdeel: hardware is overwegend donker, dus de tint-mix oogt realistisch.
const COLOR = {
  case: "#4a515e",
  motherboard: "var(--cb-secondary)",
  cpu: "#9aa3b2",
  cooling: "#6b7280",
  ram: "var(--cb-success-emerald)",
  gpu: "var(--cb-primary)",
  storage: "var(--cb-secondary)",
  psu: "var(--cb-warning-amber)",
} as const;

const LEGEND: { type: ComponentType; label: string; color: string }[] = [
  { type: "motherboard", label: "Moederbord", color: COLOR.motherboard },
  { type: "cpu", label: "CPU", color: COLOR.cpu },
  { type: "cooling", label: "Koeler", color: COLOR.cooling },
  { type: "ram", label: "RAM", color: COLOR.ram },
  { type: "gpu", label: "Videokaart", color: COLOR.gpu },
  { type: "storage", label: "Opslag", color: COLOR.storage },
  { type: "psu", label: "Voeding", color: COLOR.psu },
];

export function BuildPreview3D({
  components,
  onSelectSlot,
}: {
  components: BuildComponents;
  onSelectSlot?: (type: ComponentType) => void;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ ...DEFAULT_ROT });
  const drag = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 });
  const [hot, setHot] = useState<ComponentType | null>(null);

  const has = (t: ComponentType) => Boolean(components[t]);
  const isHot = (t: ComponentType) => hot === t;

  const apply = () => {
    if (sceneRef.current)
      sceneRef.current.style.transform = `rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
  };

  useEffect(() => {
    apply();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      if (!drag.current.active && !reduced) {
        rot.current.y += 0.1;
        apply();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      rot.current.y += (e.clientX - drag.current.lastX) * 0.4;
      rot.current.x = Math.max(-85, Math.min(85, rot.current.x - (e.clientY - drag.current.lastY) * 0.4));
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      apply();
    };
    const onUp = () => {
      drag.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  }
  function resetView() {
    rot.current = { ...DEFAULT_ROT };
    apply();
  }

  return (
    <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-4 overflow-hidden">
      <div className="absolute top-3 left-4 z-10 font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
        Jouw build
      </div>
      <div className="absolute top-2.5 right-3 z-10 flex items-center gap-2">
        <span className="font-label-technical text-[10px] text-outline hidden sm:inline">sleep om te draaien</span>
        <button
          onClick={resetView}
          title="Aanzicht herstellen"
          aria-label="Aanzicht herstellen"
          className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors bg-surface-container-lowest"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onPointerDown={onPointerDown}
        role="img"
        aria-label="Draaibaar 3D-aanzicht van je build"
        className="h-[320px] mt-4 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ perspective: "920px" }}
      >
        <div ref={sceneRef} style={{ position: "relative", transformStyle: "preserve-3d", width: 0, height: 0 }}>
          {/* Grondschaduw onder de behuizing voor verankering */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 230,
              height: 230,
              marginLeft: -115,
              marginTop: -115,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0,0,0,0.22), transparent 62%)",
              transform: "translate3d(6px, 142px, 0) rotateX(90deg)",
            }}
          />

          {/* Behuizing: open voor- en rechterkant (kijkraam) → je ziet de internals */}
          <Box x={0} y={0} z={0} w={204} h={264} d={204} color={COLOR.case} on={has("case")}
            faces={["back", "left", "bottom", "top"]} tint={42} hot={isHot("case")} />

          {/* Moederbord tegen de achterwand */}
          <Box x={22} y={-22} z={-92} w={150} h={196} d={6} color={COLOR.motherboard} on={has("motherboard")} tint={70} hot={isHot("motherboard")} />

          {/* CPU op het bord */}
          <Box x={38} y={-66} z={-80} w={22} h={22} d={9} color={COLOR.cpu} on={has("cpu")} tint={90} hot={isHot("cpu")} />

          {/* CPU-koeler (toren) met een ventilator op de voorkant */}
          <Box x={38} y={-42} z={-60} w={48} h={68} d={48} color={COLOR.cooling} on={has("cooling")} tint={72} hot={isHot("cooling")}>
            <Fan x={0} y={0} z={25} dia={42} color={COLOR.cooling} rot="" on={has("cooling")} />
          </Box>

          {/* RAM-reepjes (4) naast de socket */}
          {[0, 1, 2, 3].map((n) => (
            <Box key={n} x={74 + n * 12} y={-52} z={-84} w={7} h={80} d={9} color={COLOR.ram} on={has("ram")} tint={80} hot={isHot("ram")} />
          ))}

          {/* Videokaart in het PCIe-slot, met twee ventilatoren aan de onderzijde */}
          <Box x={-2} y={34} z={-56} w={188} h={24} d={50} color={COLOR.gpu} on={has("gpu")} tint={78} hot={isHot("gpu")}>
            <Fan x={-46} y={12} z={0} dia={40} color={COLOR.gpu} rot="rotateX(90deg)" on={has("gpu")} />
            <Fan x={44} y={12} z={0} dia={40} color={COLOR.gpu} rot="rotateX(90deg)" on={has("gpu")} />
          </Box>

          {/* Opslag op de voedingsshroud */}
          <Box x={-48} y={70} z={-42} w={58} h={14} d={46} color={COLOR.storage} on={has("storage")} tint={70} hot={isHot("storage")} />

          {/* Voeding onderin */}
          <Box x={-44} y={104} z={-50} w={106} h={44} d={68} color={COLOR.psu} on={has("psu")} tint={64} hot={isHot("psu")} />
        </div>
      </div>

      {/* Legenda — klik om te kiezen/wijzigen, hover om te markeren */}
      <div className="relative z-10 flex flex-wrap gap-x-2 gap-y-1.5 mt-2 justify-center">
        {LEGEND.map(({ type, label, color }) => {
          const on = has(type);
          return (
            <button
              key={type}
              onClick={() => onSelectSlot?.(type)}
              onMouseEnter={() => setHot(type)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(type)}
              onBlur={() => setHot(null)}
              title={on ? `${label} wijzigen` : `${label} kiezen`}
              className={`inline-flex items-center gap-1.5 font-label-technical text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-surface-container ${
                on ? "text-on-surface-variant" : "text-outline-variant"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-[2px] inline-block"
                style={{
                  background: on ? `color-mix(in srgb, ${color} 60%, transparent)` : "transparent",
                  border: `1px ${on ? "solid" : "dashed"} ${on ? color : "var(--cb-outline-variant)"}`,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
