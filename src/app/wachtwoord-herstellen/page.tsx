import { Suspense } from "react";
import type { Metadata } from "next";
import { WachtwoordHerstellenClient } from "@/components/WachtwoordHerstellenClient";

export const metadata: Metadata = {
  title: "Nieuw wachtwoord",
  robots: { index: false },
};

export default function WachtwoordHerstellenPage() {
  return (
    <Suspense
      fallback={
        <main className="pt-16 min-h-screen">
          <div className="max-w-md mx-auto px-8 py-16 text-on-surface-variant">Laden...</div>
        </main>
      }
    >
      <WachtwoordHerstellenClient />
    </Suspense>
  );
}
