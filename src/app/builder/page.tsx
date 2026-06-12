import type { Metadata } from "next";
import { BuilderClient } from "@/components/BuilderClient";

export const metadata: Metadata = {
  title: "PC Builder",
  description:
    "Stel je eigen PC samen met de CoreBuild PC Builder. Kies componenten, vergelijk prijzen en check het stroomverbruik van je build.",
  alternates: {
    canonical: "/builder",
  },
};

export default function BuilderPage() {
  return <BuilderClient />;
}
