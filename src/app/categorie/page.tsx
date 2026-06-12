import Link from "next/link";
import {
  Cpu, Monitor, Layers, Database, HardDrive, Zap, Server, Wind,
} from "lucide-react";
import { COMPONENT_TYPES, COMPONENT_META } from "@/lib/categories";
import type { ComponentType } from "@/lib/types";

const CATEGORY_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  gpu: Monitor,
  motherboard: Layers,
  ram: Database,
  storage: HardDrive,
  psu: Zap,
  case: Server,
  cooling: Wind,
};

export const metadata = {
  title: "Categorieën — CoreBuild",
};

export default function CategorieIndexPage() {
  return (
    <main className="mt-16 max-w-[1280px] mx-auto px-8 py-16 min-h-screen w-full">
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Categorieën</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          Blader door de nieuwste hardware per categorie.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {COMPONENT_TYPES.map((type) => {
          const Icon = CATEGORY_ICONS[type];
          return (
            <Link
              key={type}
              href={`/categorie/${type}`}
              className="bg-surface-container-low border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-center group transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,73,219,0.08)]"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-primary border border-outline-variant group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon className="w-[30px] h-[30px]" />
              </div>
              <span className="font-title-md text-title-md text-on-surface">
                {COMPONENT_META[type].shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
