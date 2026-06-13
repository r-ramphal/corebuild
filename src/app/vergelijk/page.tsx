import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "@/components/CompareClient";

export const metadata: Metadata = {
  title: "Builds vergelijken",
  description: "Vergelijk twee PC-builds uit de galerij onderdeel voor onderdeel, met prijzen en totalen.",
  alternates: { canonical: "/vergelijk" },
  robots: { index: false }, // querystring-pagina, niet indexeren
};

export default function VergelijkPage() {
  return (
    <Suspense
      fallback={
        <main className="pt-16 min-h-screen">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16">
            <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
          </div>
        </main>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
