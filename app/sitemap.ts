import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await getProducts();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/troca`, changeFrequency: "monthly", priority: 0.4 },
    ...products.map((p) => ({ url: `${base}/produto/${p.slug}`, lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
