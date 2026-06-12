import type { MetadataRoute } from "next";
import { COMPONENT_TYPES } from "@/lib/categories";

const BASE_URL = "https://corebuildnl.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/zoeken`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/builder`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/categorie`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const categoryPages: MetadataRoute.Sitemap = COMPONENT_TYPES.map((type) => ({
    url: `${BASE_URL}/categorie/${type}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages];
}
