import type { Metadata } from "next";
import { SharedBuildClient } from "@/components/SharedBuildClient";

export const metadata: Metadata = {
  title: "Gedeelde build",
  description: "Bekijk deze gedeelde PC-build op CoreBuild en laad hem in de builder.",
};

export default function SharedBuildPage() {
  return <SharedBuildClient />;
}
