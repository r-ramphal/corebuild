import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PriceResult, ComponentType } from "@/lib/types";

interface BuildStore {
  components: Partial<Record<ComponentType, PriceResult>>;
  setComponent: (type: ComponentType, item: PriceResult) => void;
  removeComponent: (type: ComponentType) => void;
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
      clearBuild: () => set({ components: {} }),
    }),
    { name: "corebuild-build" }
  )
);
