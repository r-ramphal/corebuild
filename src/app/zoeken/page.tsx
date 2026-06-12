import { Suspense } from "react";
import type { Metadata } from "next";
import { ZoekenClient } from "@/components/ZoekenClient";

export const metadata: Metadata = {
  title: "Zoeken",
  description:
    "Zoek PC-componenten en vergelijk real-time prijzen van Amazon, Bol.com, Megekko, Azerty en Alternate.",
  alternates: {
    canonical: "/zoeken",
  },
};

export default function ZoekenPage() {
  return (
    <main className="pt-20 pb-16 min-h-screen">
      <Suspense
        fallback={
          <div className="max-w-[1280px] mx-auto px-8 py-8 text-on-surface-variant">
            Laden...
          </div>
        }
      >
        <ZoekenClient />
      </Suspense>
    </main>
  );
}
