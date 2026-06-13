"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { BuildComponents } from "@/lib/store/build";
import type { ComponentType } from "@/lib/types";

/**
 * Echt 3D-aanzicht van de build, dependency-vrij met CSS-3D-transforms (geen
 * three.js). De onderdelen zijn doorzichtige cuboids die oplichten zodra je ze
 * kiest; sleep om de behuizing te draaien. Idle draait hij zachtjes vanzelf,
 * tenzij de bezoeker reduced-motion heeft ingesteld.
 */

type Face = "front" | "back" | "left" | "right" | "top" | "bottom";
const ALL_FACES: Face[] = ["front", "back", "left", "right", "top", "bottom"];

interface BoxProps {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  color: string; // CSS-kleur (designtoken)
  on: boolean;
  faces?: Face[];
  fillPct?: number;
}

function Box({ x, y, z, w, h, d, color, on, faces = ALL_FACES, fillPct = 15 }: BoxProps) {
  const border = on ? color : "var(--cb-outline-variant)";
  const fill = on ? `color-mix(in srgb, ${color} ${fillPct}%, transparent)` : "transparent";
  const faceStyle = (fw: number, fh: number, transform: string): CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: fw,
    height: fh,
    marginLeft: -fw / 2,
    marginTop: -fh / 2,
    background: fill,
    border: `1px ${on ? "solid" : "dashed"} ${border}`,
    transform,
    opacity: on ? 1 : 0.45,
  });
  const F: Record<Face, CSSProperties> = {
    front: faceStyle(w, h, `translateZ(${d / 2}px)`),
    back: faceStyle(w, h, `rotateY(180deg) translateZ(${d / 2}px)`),
    right: faceStyle(d, h, `rotateY(90deg) translateZ(${w / 2}px)`),
    left: faceStyle(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`),
    top: faceStyle(w, d, `rotateX(90deg) translateZ(${h / 2}px)`),
    bottom: faceStyle(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`),
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
    </div>
  );
}

// Kleur per onderdeel (designtokens), spiegelt de 2.5D-weergave.
const COLOR = {
  case: "var(--cb-primary)",
  motherboard: "var(--cb-secondary)",
  cpu: "var(--cb-primary)",
  cooling: "var(--cb-primary)",
  ram: "var(--cb-success-emerald)",
  gpu: "var(--cb-primary)",
  storage: "var(--cb-secondary)",
  psu: "var(--cb-warning-amber)",
} as const;

const LEGEND: { type: keyof typeof COLOR; label: string }[] = [
  { type: "motherboard", label: "Moederbord" },
  { type: "cpu", label: "CPU" },
  { type: "cooling", label: "Koeler" },
  { type: "ram", label: "RAM" },
  { type: "gpu", label: "Videokaart" },
  { type: "storage", label: "Opslag" },
  { type: "psu", label: "Voeding" },
];

export function BuildPreview3D({ components }: { components: BuildComponents }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -19, y: -33 });
  const drag = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 });

  const has = (t: ComponentType) => Boolean(components[t]);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const apply = () => {
      el.style.transform = `rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg)`;
    };
    apply();

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      if (!drag.current.active && !reduced) {
        rot.current.y += 0.12;
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

  return (
    <div className="relative bg-surface-container-low border border-outline-variant rounded-xl p-4 overflow-hidden">
      <div className="absolute top-3 left-4 z-10 font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
        Jouw build
      </div>
      <div className="absolute top-3 right-4 z-10 font-label-technical text-[10px] text-outline">
        sleep om te draaien
      </div>

      <div
        onPointerDown={onPointerDown}
        role="img"
        aria-label="Draaibaar 3D-aanzicht van je build"
        className="h-[300px] mt-4 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ perspective: "900px" }}
      >
        <div ref={sceneRef} style={{ position: "relative", transformStyle: "preserve-3d", width: 0, height: 0 }}>
          {/* Behuizing-frame als wireframe (open voorzijde zodat je naar binnen kijkt) */}
          <Box x={0} y={0} z={0} w={202} h={262} d={202} color={COLOR.case} on={has("case")}
            faces={["back", "left", "right", "top", "bottom"]} fillPct={0} />
          {/* Moederbord tegen de achterwand */}
          <Box x={22} y={-22} z={-92} w={150} h={196} d={7} color={COLOR.motherboard} on={has("motherboard")} fillPct={22} />
          {/* CPU op het bord */}
          <Box x={38} y={-64} z={-82} w={20} h={20} d={10} color={COLOR.cpu} on={has("cpu")} fillPct={30} />
          {/* CPU-koeler eroverheen (toren op de socket) */}
          <Box x={38} y={-42} z={-62} w={46} h={66} d={46} color={COLOR.cooling} on={has("cooling")} fillPct={15} />
          {/* RAM-reepjes naast de socket */}
          <Box x={78} y={-52} z={-84} w={8} h={78} d={9} color={COLOR.ram} on={has("ram")} fillPct={26} />
          <Box x={92} y={-52} z={-84} w={8} h={78} d={9} color={COLOR.ram} on={has("ram")} fillPct={26} />
          {/* Videokaart horizontaal in het PCIe-slot */}
          <Box x={-2} y={34} z={-58} w={186} h={22} d={48} color={COLOR.gpu} on={has("gpu")} fillPct={22} />
          {/* Opslag op de voedingsshroud (niet zwevend) */}
          <Box x={-46} y={72} z={-44} w={56} h={14} d={46} color={COLOR.storage} on={has("storage")} fillPct={24} />
          {/* Voeding onderin (shroud) */}
          <Box x={-44} y={104} z={-52} w={104} h={42} d={66} color={COLOR.psu} on={has("psu")} fillPct={20} />
        </div>
      </div>

      {/* Legenda met de gevulde onderdelen */}
      <div className="relative z-10 flex flex-wrap gap-x-3 gap-y-1.5 mt-2 justify-center">
        {LEGEND.map(({ type, label }) => {
          const on = has(type);
          return (
            <span
              key={type}
              className={`inline-flex items-center gap-1.5 font-label-technical text-[10px] ${on ? "text-on-surface-variant" : "text-outline-variant"}`}
            >
              <span
                className="w-2 h-2 rounded-[2px] inline-block"
                style={{
                  background: on ? `color-mix(in srgb, ${COLOR[type]} 60%, transparent)` : "transparent",
                  border: `1px ${on ? "solid" : "dashed"} ${on ? COLOR[type] : "var(--cb-outline-variant)"}`,
                }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
