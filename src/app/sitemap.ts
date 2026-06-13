import type { MetadataRoute } from "next";
import { CATALOG_TYPES } from "@/lib/categories";
import { POSTS } from "@/lib/blog";

const BASE_URL = "https://corebuildnl.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/zoeken`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/builder`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/galerij`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/categorie`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/over`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATALOG_TYPES.map((type) => ({
    url: `${BASE_URL}/categorie/${type}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${BASE_URL}/blog/${p.meta.slug}`,
    lastModified: p.meta.date,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...categoryPages, ...blogPages];
}
