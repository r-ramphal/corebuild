import { Suspense } from "react";
import { ZoekenClient } from "@/components/ZoekenClient";

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
