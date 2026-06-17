"use client";

/**
 * Echte 3D-weergave van de build met react-three-fiber/three.js. Wordt lui
 * geladen (next/dynamic, ssr:false) vanuit BuildPreview, zodat three.js niet in
 * de initiële builder-bundle zit. Alle geometrie komt uit buildModel() in mm;
 * een group schaalt mm → scene-units. Onderdelen zijn herkenbare solids
 * (moederbord-PCB, koelertoren/AIO-radiator met ventilatoren, videokaart met
 * fans + backplate, RAM-reepjes, voeding) en zijn klikbaar om te kiezen.
 */
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import type { Group } from "three";
import type { BuildModel, PartModel, Vec3 } from "@/lib/specs/build-model";
import type { ComponentType } from "@/lib/types";

const SCALE = 0.01;
const ORANGE = "#FF8800";

// — Materialen-paletten: donkere hardware, maar net licht genoeg om binnen de
//   kast leesbaar te blijven onder de scene-belichting. —
const C = {
  steel: "#2f343d",
  glass: "#2a3a49",
  pcb: "#14181f",
  alu: "#ccd1d9",
  fan: "#181c22",
  gpuShroud: "#2c313b",
  gpuBack: "#3a4150",
  ram: "#353b46",
  psu: "#22262d",
  ssd: "#3f4856",
  cpu: "#c2c6cf",
  heatsink: "#454d5c",
  ghost: "#9aa3b2",
};

/** Emissive-highlight als het onderdeel "hot" is (hover/legenda). */
function hl(on: boolean) {
  return { emissive: on ? ORANGE : "#000000", emissiveIntensity: on ? 0.5 : 0 };
}

interface SelectHandlers {
  onPointerOver: (e: { stopPropagation: () => void }) => void;
  onPointerOut: (e: { stopPropagation: () => void }) => void;
  onPointerDown: (e: { nativeEvent: PointerEvent }) => void;
  onClick: (e: { stopPropagation: () => void; nativeEvent: PointerEvent }) => void;
}

/** Hover/klik op een slot; klik telt alleen bij weinig beweging (geen sleep-misser). */
function useSelect(
  type: ComponentType,
  setHot: (t: ComponentType | null) => void,
  onSelectSlot?: (t: ComponentType) => void
): SelectHandlers {
  const down = useRef<[number, number] | null>(null);
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      setHot(type);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      setHot(null);
      document.body.style.cursor = "auto";
    },
    onPointerDown: (e) => {
      down.current = [e.nativeEvent.clientX, e.nativeEvent.clientY];
    },
    onClick: (e) => {
      e.stopPropagation();
      const d = down.current;
      if (d) {
        const dx = e.nativeEvent.clientX - d[0];
        const dy = e.nativeEvent.clientY - d[1];
        if (dx * dx + dy * dy > 49) return; // > 7px = sleep, geen klik
      }
      onSelectSlot?.(type);
    },
  };
}

/** Ronddraaiende ventilator: rim + naaf + bladen. Vlak in het XY-vlak (normaal +z). */
function Fan({ dia, spin }: { dia: number; spin: boolean }) {
  const blades = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin && blades.current) blades.current.rotation.z += dt * 2.4;
  });
  const r = dia / 2;
  return (
    <group>
      {/* achterplaat zodat de fan niet doorzichtig is */}
      <mesh position={[0, 0, -1]}>
        <cylinderGeometry args={[r * 0.95, r * 0.95, 1.5, 24]} />
        <meshStandardMaterial color={C.fan} metalness={0.2} roughness={0.85} />
      </mesh>
      {/* rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.95, r * 0.07, 8, 28]} />
        <meshStandardMaterial color="#05070a" metalness={0.4} roughness={0.6} />
      </mesh>
      <group ref={blades} position={[0, 0, 0.5]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} rotation={[0.32, 0, (i / 7) * Math.PI * 2]}>
            <boxGeometry args={[r * 0.85, r * 0.30, 1]} />
            <meshStandardMaterial color="#1b1f26" metalness={0.2} roughness={0.7} />
          </mesh>
        ))}
        {/* naaf */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.17, r * 0.17, 3, 16]} />
          <meshStandardMaterial color="#2a2f37" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

const mm = (v: Vec3): Vec3 => v; // posities zijn al in mm binnen de geschaalde group

/** Doorzichtige draadweergave voor een nog leeg slot. */
function Ghost({ part, hot, handlers }: { part: PartModel; hot: boolean; handlers: SelectHandlers }) {
  return (
    <mesh position={mm(part.pos)} {...handlers}>
      <boxGeometry args={part.size} />
      <meshBasicMaterial color={hot ? ORANGE : C.ghost} wireframe transparent opacity={hot ? 0.4 : 0.16} />
    </mesh>
  );
}

function Motherboard({ part, hot, handlers }: { part: BuildModel["mobo"]; hot: boolean; handlers: SelectHandlers }) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  const [w, h, d] = part.size;
  const x = w / 2 + 1; // op het oppervlak richting glas
  return (
    <group position={mm(part.pos)} {...handlers}>
      <mesh>
        <boxGeometry args={part.size} />
        <meshStandardMaterial color={C.pcb} metalness={0.3} roughness={0.6} {...hl(hot)} />
      </mesh>
      {/* VRM-heatsink boven (bij de socket) */}
      <mesh position={[x + 4, h * 0.32, -d * 0.28]}>
        <boxGeometry args={[10, h * 0.18, d * 0.3]} />
        <meshStandardMaterial color={C.heatsink} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* chipset/M.2-heatsink onder */}
      <mesh position={[x + 3, -h * 0.18, d * 0.05]}>
        <boxGeometry args={[8, h * 0.22, d * 0.4]} />
        <meshStandardMaterial color={C.heatsink} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* PCIe-slot-accent */}
      <mesh position={[x + 1, -h * 0.1, d * 0.02]}>
        <boxGeometry args={[2, 4, d * 0.55]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.35} />
      </mesh>
      {/* rear-I/O-shield (achter, boven) */}
      <mesh position={[x, h * 0.34, -d / 2 + 3]}>
        <boxGeometry args={[12, h * 0.22, 6]} />
        <meshStandardMaterial color="#41484f" metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Cpu({ part, hot, handlers }: { part: PartModel; hot: boolean; handlers: SelectHandlers }) {
  if (!part.present) return null; // CPU zit onder de koeler; leeg slot tonen we niet als ghost
  return (
    <mesh position={mm(part.pos)} {...handlers}>
      <boxGeometry args={part.size} />
      <meshStandardMaterial color={C.cpu} metalness={0.85} roughness={0.25} {...hl(hot)} />
    </mesh>
  );
}

function Cooler({
  part,
  cpuPos,
  hot,
  spin,
  handlers,
}: {
  part: BuildModel["cooler"];
  cpuPos: Vec3;
  hot: boolean;
  spin: boolean;
  handlers: SelectHandlers;
}) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  const [w, h, d] = part.size;

  if (part.kind === "air") {
    // Toren: x = hoogte (uit het bord). Fan op de voorkant (+z).
    return (
      <group {...handlers}>
        <mesh position={mm(part.pos)}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={C.alu} metalness={0.8} roughness={0.35} {...hl(hot)} />
        </mesh>
        {/* fan op de +z-zijde van de toren */}
        <group position={[part.pos[0], part.pos[1], part.pos[2] + d / 2 + 14]}>
          <Fan dia={part.fanDia} spin={spin} />
        </group>
      </group>
    );
  }

  // AIO: pompblok op de CPU + radiator met ventilatoren.
  const pump: Vec3 = [cpuPos[0] + 22, cpuPos[1], cpuPos[2]];
  const fanCount = part.fanCount;
  return (
    <group {...handlers}>
      {/* pompblok */}
      <mesh position={pump}>
        <boxGeometry args={[44, 60, 60]} />
        <meshStandardMaterial color="#1a1d23" metalness={0.6} roughness={0.4} {...hl(hot)} />
      </mesh>
      <mesh position={[pump[0] + 23, pump[1], pump[2]]}>
        <cylinderGeometry args={[18, 18, 4, 24]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.3} />
      </mesh>
      {/* radiator */}
      <mesh position={mm(part.pos)}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#1c2026" metalness={0.5} roughness={0.6} {...hl(hot)} />
      </mesh>
      {/* fans: top-mount → normaal -y; front-mount → normaal -z */}
      {Array.from({ length: fanCount }).map((_, i) => {
        const t = fanCount > 1 ? i / (fanCount - 1) - 0.5 : 0;
        if (part.mount === "top") {
          const span = d - part.fanDia * 0.4;
          return (
            <group
              key={i}
              position={[part.pos[0], part.pos[1] - h / 2 - 14, part.pos[2] + t * span]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <Fan dia={part.fanDia} spin={spin} />
            </group>
          );
        }
        const span = h - part.fanDia * 0.4;
        return (
          <group
            key={i}
            position={[part.pos[0], part.pos[1] + t * span, part.pos[2] - d / 2 - 14]}
            rotation={[0, Math.PI, 0]}
          >
            <Fan dia={part.fanDia} spin={spin} />
          </group>
        );
      })}
    </group>
  );
}

function Ram({ part, hot, handlers }: { part: BuildModel["ram"]; hot: boolean; handlers: SelectHandlers }) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  const [w, h, dz] = part.size;
  const pitch = dz + 4;
  const n = part.sticks;
  return (
    <group position={mm(part.pos)} {...handlers}>
      {Array.from({ length: n }).map((_, i) => {
        const z = (i - (n - 1) / 2) * pitch;
        return (
          <group key={i} position={[0, 0, z]}>
            {/* PCB + heatspreader */}
            <mesh>
              <boxGeometry args={[w, h, dz]} />
              <meshStandardMaterial color={C.ram} metalness={0.5} roughness={0.5} {...hl(hot)} />
            </mesh>
            {/* RGB-diffuser bovenop */}
            <mesh position={[0, h / 2 + 1.5, 0]}>
              <boxGeometry args={[w * 0.7, 3, dz * 0.85]} />
              <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.45} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Gpu({ part, hot, spin, handlers }: { part: BuildModel["gpu"]; hot: boolean; spin: boolean; handlers: SelectHandlers }) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  const [w, h, d] = part.size; // w = dikte (x, richting glas), h = hoogte, d = lengte
  const fans = part.fans;
  return (
    <group position={mm(part.pos)} {...handlers}>
      {/* PCB-kant tegen het bord */}
      <mesh position={[-w / 2 + 2, 0, 0]}>
        <boxGeometry args={[3, h * 0.78, d]} />
        <meshStandardMaterial color={C.pcb} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* shroud (koelblok) */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={C.gpuShroud} metalness={0.6} roughness={0.45} {...hl(hot)} />
      </mesh>
      {/* backplate */}
      <mesh position={[-w / 2 - 1, 0, 0]}>
        <boxGeometry args={[2, h, d]} />
        <meshStandardMaterial color={C.gpuBack} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* RGB-streep langs de rand */}
      <mesh position={[w / 2 + 0.6, h / 2 - 3, 0]}>
        <boxGeometry args={[1.5, 4, d * 0.92]} />
        <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.5} />
      </mesh>
      {/* ventilatoren op de kijkkant (+x) */}
      {Array.from({ length: fans }).map((_, i) => {
        const t = fans > 1 ? i / (fans - 1) - 0.5 : 0;
        const span = d - part.fanDia * 1.3;
        return (
          <group key={i} position={[w / 2 + 1.5, 0, t * span]} rotation={[0, Math.PI / 2, 0]}>
            <Fan dia={part.fanDia} spin={spin} />
          </group>
        );
      })}
    </group>
  );
}

function Storage({ part, hot, handlers }: { part: PartModel; hot: boolean; handlers: SelectHandlers }) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  return (
    <mesh position={mm(part.pos)} {...handlers}>
      <boxGeometry args={part.size} />
      <meshStandardMaterial color={C.ssd} metalness={0.75} roughness={0.35} {...hl(hot)} />
    </mesh>
  );
}

function Psu({ part, hot, spin, handlers }: { part: PartModel; hot: boolean; spin: boolean; handlers: SelectHandlers }) {
  if (!part.present) return <Ghost part={part} hot={hot} handlers={handlers} />;
  const [w, h, d] = part.size;
  return (
    <group position={mm(part.pos)} {...handlers}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={C.psu} metalness={0.5} roughness={0.55} {...hl(hot)} />
      </mesh>
      {/* fan-grille bovenop */}
      <group position={[0, h / 2 + 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Fan dia={Math.min(w, d) * 0.82} spin={spin} />
      </group>
    </group>
  );
}

/** Kast: stalen tray/achter/bodem/top + getint glas op de kijkkant (+x). */
function CaseShell({ model, hot, handlers }: { model: BuildModel; hot: boolean; handlers: SelectHandlers }) {
  const { width: w, height: h, depth: d, present } = model.case;
  const t = 6; // paneeldikte
  const steel = (
    <meshStandardMaterial color={hot && present ? "#3a4150" : C.steel} metalness={0.7} roughness={0.45} {...hl(hot && present)} />
  );
  return (
    <group {...handlers}>
      {/* bodem */}
      <mesh position={[0, -h / 2, 0]}>
        <boxGeometry args={[w, t, d]} />
        {steel}
      </mesh>
      {/* top */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, t, d]} />
        {steel}
      </mesh>
      {/* achterwand (-z) */}
      <mesh position={[0, 0, -d / 2]}>
        <boxGeometry args={[w, h, t]} />
        {steel}
      </mesh>
      {/* moederbord-tray (-x) */}
      <mesh position={[-w / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        {steel}
      </mesh>
      {/* open voorkant: alleen slanke frame-struts, zodat de internals zichtbaar zijn */}
      {([
        [0, h / 2 - 2, d / 2, w, 4, 4],
        [0, -h / 2 + 2, d / 2, w, 4, 4],
        [-w / 2 + 2, 0, d / 2, 4, h, 4],
        [w / 2 - 2, 0, d / 2, 4, h, 4],
      ] as const).map((s, i) => (
        <mesh key={i} position={[s[0], s[1], s[2]]}>
          <boxGeometry args={[s[3], s[4], s[5]]} />
          {steel}
        </mesh>
      ))}
      {/* getint glazen zijpaneel (+x) */}
      <mesh position={[w / 2, 0, 0]}>
        <boxGeometry args={[2, h - t, d - t]} />
        <meshStandardMaterial color={C.glass} metalness={0.1} roughness={0.05} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

interface Props {
  model: BuildModel;
  hot: ComponentType | null;
  setHot: (t: ComponentType | null) => void;
  onSelectSlot?: (t: ComponentType) => void;
  reducedMotion: boolean;
  resetSignal: number;
}

function Scene({ model, hot, setHot, onSelectSlot, reducedMotion, resetSignal }: Props) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  useEffect(() => {
    controls.current?.reset();
  }, [resetSignal]);

  const spin = !reducedMotion;
  const floorY = (-model.case.height / 2) * SCALE - 0.02;

  // handlers per slot (hooks op topniveau, niet in een loop)
  const H = {
    case: useSelect("case", setHot, onSelectSlot),
    motherboard: useSelect("motherboard", setHot, onSelectSlot),
    cpu: useSelect("cpu", setHot, onSelectSlot),
    cooling: useSelect("cooling", setHot, onSelectSlot),
    ram: useSelect("ram", setHot, onSelectSlot),
    gpu: useSelect("gpu", setHot, onSelectSlot),
    storage: useSelect("storage", setHot, onSelectSlot),
    psu: useSelect("psu", setHot, onSelectSlot),
  };

  return (
    <>
      <ambientLight intensity={0.95} />
      <hemisphereLight intensity={0.6} groundColor="#11141a" color="#eaf0fb" />
      {/* keylight vanaf de kijk-/glaskant zodat de internals oplichten */}
      <directionalLight position={[7, 8, 7]} intensity={2.1} castShadow={false} />
      <directionalLight position={[-5, 4, -4]} intensity={0.7} color="#cfe0ff" />
      <pointLight position={[3, 1, 5]} intensity={22} color="#ffffff" distance={11} />
      <pointLight position={[1, -1, 4]} intensity={12} color={ORANGE} distance={8} />

      <group scale={[SCALE, SCALE, SCALE]}>
        <CaseShell model={model} hot={hot === "case"} handlers={H.case} />
        <Motherboard part={model.mobo} hot={hot === "motherboard"} handlers={H.motherboard} />
        <Cpu part={model.cpu} hot={hot === "cpu"} handlers={H.cpu} />
        <Cooler part={model.cooler} cpuPos={model.cpu.pos} hot={hot === "cooling"} spin={spin} handlers={H.cooling} />
        <Ram part={model.ram} hot={hot === "ram"} handlers={H.ram} />
        <Gpu part={model.gpu} hot={hot === "gpu"} spin={spin} handlers={H.gpu} />
        <Storage part={model.storage} hot={hot === "storage"} handlers={H.storage} />
        <Psu part={model.psu} hot={hot === "psu"} spin={spin} handlers={H.psu} />
      </group>

      <ContactShadows position={[0, floorY, 0]} opacity={0.4} scale={9} blur={2.6} far={5} resolution={512} color="#000000" />

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.5}
        maxDistance={13}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function BuildScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={props.reducedMotion ? "demand" : "always"}
      camera={{ position: [6.6, 2.1, 5.0], fov: 31 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
