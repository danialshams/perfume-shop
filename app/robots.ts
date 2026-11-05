import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const publicSite = process.env.VERCEL_ENV !== "preview";
  return {
    rules: publicSite ? [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/checkout/", "/cart/", "/api/", "/payment/", "/sandbox/"] }] : [{ userAgent: "*", disallow: "/" }],
    sitemap: publicSite ? (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://perfume-shop-danialshams-projects.vercel.app") + "/sitemap.xml" : undefined,
  };
}
