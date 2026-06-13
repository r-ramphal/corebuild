import type { ComponentType } from "react";
import type { BlogMeta } from "./blog-types";
import * as voeding from "@/content/blog/hoeveel-watt-voeding";
import * as resolutie from "@/content/blog/resolutie-en-videokaart";
import * as behuizing from "@/content/blog/past-het-in-je-behuizing";

export type { BlogMeta } from "./blog-types";

export interface BlogPost {
  meta: BlogMeta;
  Body: ComponentType;
}

/**
 * Centrale blog-registry. Nieuwe post toevoegen = module aanmaken in
 * src/content/blog/ en hier importeren. Gesorteerd op datum (nieuwste eerst).
 */
const MODULES = [voeding, resolutie, behuizing];

export const POSTS: BlogPost[] = MODULES.map((m) => ({ meta: m.meta, Body: m.Body })).sort((a, b) =>
  b.meta.date.localeCompare(a.meta.date)
);

export function getPost(slug: string): BlogPost | null {
  return POSTS.find((p) => p.meta.slug === slug) ?? null;
}

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** ISO-datum → Nederlandse weergave (deterministisch, server-safe). */
export function formatBlogDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_NL[(m ?? 1) - 1]} ${y}`;
}
