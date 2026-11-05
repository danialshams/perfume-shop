import type { MetadataRoute } from "next";
const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL ||
  "https://perfume-shop-danialshams-projects.vercel.app").replace(/\/$/, "");
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "/", priority: 1, frequency: "weekly" },
    { path: "/products", priority: .9, frequency: "daily" },
    { path: "/journal", priority: .7, frequency: "monthly" },
    { path: "/journal/how-to-choose-a-fragrance", priority: .7, frequency: "monthly" },
    { path: "/about", priority: .4, frequency: "yearly" },
    { path: "/contact", priority: .3, frequency: "yearly" },
    { path: "/shipping", priority: .3, frequency: "yearly" },
    { path: "/privacy", priority: .2, frequency: "yearly" },
    { path: "/terms", priority: .2, frequency: "yearly" },
  ].map(item => ({
    url: base + item.path,
    changeFrequency: item.frequency as "weekly" | "daily" | "monthly" | "yearly",
    priority: item.priority,
  }));
}
