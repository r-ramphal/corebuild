"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True zodra de client gehydrateerd is, false tijdens SSR en de eerste
 * client-render. Hydration-veilig (geen setState-in-effect) — dezelfde
 * useSyncExternalStore-filosofie als de voorkeuren elders in het project.
 * Gebruik dit om localStorage-/persist-state pas na hydratie te tonen.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
