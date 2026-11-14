import type { MetadataRoute } from "next";
import { productService } from "@/server/services/product.service";
import {currentSeo} from "@/server/seo-metadata";
import {seoOrigin,seoPageConfig} from "@/lib/fertini-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo=await currentSeo();
  if(!seo.sitemapEnabled || !seo.indexSite || process.env.VERCEL_ENV==="preview")return [];
  const base=seoOrigin(seo);
  const paths = [
    { path: "/", priority: 1, frequency: "weekly" },
    { path: "/products", priority: .9, frequency: "daily" },
    { path: "/journal", priority: .7, frequency: "monthly" },
    { path: "/journal/how-to-choose-a-fragrance", priority: .7, frequency: "monthly" },
    { path: "/about", priority: .4, frequency: "yearly" },
    { path: "/contact", priority: .3, frequency: "yearly" },
    { path: "/shipping", priority: .3, frequency: "yearly" },
    { path: "/privacy", priority: .2, frequency: "yearly" },
    { path: "/terms", priority: .2, frequency: "yearly" },
  ];
  const entries: MetadataRoute.Sitemap = paths.filter(item=>!seoPageConfig(seo,item.path).noindex).map(item => ({
    url: base + item.path,
    changeFrequency: item.frequency as "weekly" | "daily" | "monthly" | "yearly",
    priority: item.priority,
  }));
  try {
    const filters = { status: "ACTIVE" as const, is_active: 1, withDeleted: false, onlyDeleted: false };
    const first = await productService.getAll(filters, { page: 1, limit: 100 });
    const pages = Math.min(100, Math.max(1, Number(first.meta.totalPages || 1)));
    const items = [...first.items];
    for (let page = 2; page <= pages; page++) {
      const result = await productService.getAll(filters, { page, limit: 100 });
      items.push(...result.items);
    }
    const seen = new Set<number>();
    for (const item of items) {
      const id = Number(item.id);
      if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      const path="/products/"+id;
      if(!seoPageConfig(seo,path).noindex) entries.push({ url: base + path, changeFrequency: "weekly", priority: .65 });
    }
  } catch {
    // Installation / disconnected database: static indexed pages remain available.
  }
  return entries;
}
