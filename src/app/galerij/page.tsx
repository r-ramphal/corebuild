import type { Metadata } from "next";
import { GalleryClient } from "@/components/GalleryClient";

export const metadata: Metadata = {
  title: "Buildgalerij",
  description:
    "Door de community gedeelde PC-builds. Bekijk complete builds met prijzen en vergelijk er twee naast elkaar.",
  alternates: { canonical: "/galerij" },
  openGraph: {
    title: "Buildgalerij | CoreBuild",
    description: "Door de community gedeelde PC-builds — bekijken en vergelijken.",
    url: "https://corebuildnl.com/galerij",
  },
};

export default function GalerijPage() {
  return <GalleryClient />;
}
