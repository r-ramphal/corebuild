import type { Metadata } from "next";
import { VolglijstClient } from "@/components/VolglijstClient";

export const metadata: Metadata = {
  title: "Volglijst",
  description:
    "De PC-onderdelen waarvan je de prijs volgt. Houd prijsdalingen in de gaten en spring op het juiste moment.",
  alternates: { canonical: "/volglijst" },
  robots: { index: false },
};

export default function VolglijstPage() {
  return <VolglijstClient />;
}
