import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PriceResult, ComponentType } from "@/lib/types";

export type BuildComponents = Partial<Record<ComponentType, PriceResult>>;

interface BuildStore {
  components: BuildComponents;
  setComponent: (type: ComponentType, item: PriceResult) => void;
  removeComponent: (type: ComponentType) => void;
  /** Vervang de hele build (laden van een opgeslagen build) */
  loadComponents: (components: BuildComponents) => void;
  clearBuild: () => void;
}

export const useBuildStore = create<BuildStore>()(
  persist(
    (set) => ({
      components: {},
      setComponent: (type, item) =>
        set((state) => ({ components: { ...state.components, [type]: item } })),
      removeComponent: (type) =>
        set((state) => {
          const next = { ...state.components };
          delete next[type];
          return { components: next };
        }),
      loadComponents: (components) => set({ components }),
      clearBuild: () => set({ components: {} }),
    }),
    { name: "corebuild-build" }
  )
);
