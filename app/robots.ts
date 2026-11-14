import type {MetadataRoute} from "next";
import {currentSeo} from "@/server/seo-metadata";
import {seoOrigin} from "@/lib/fertini-seo";
export const dynamic="force-dynamic";
export default async function robots():Promise<MetadataRoute.Robots>{
  const config=await currentSeo();
  const publicSite=process.env.VERCEL_ENV!=="preview"&&config.indexSite;
  const forbidden=["/admin","/account","/checkout","/cart","/api","/payment","/sandbox","/login","/demo"];
  return {
    rules:publicSite?[{userAgent:"*",allow:"/",disallow:forbidden}]:[{userAgent:"*",disallow:"/"}],
    sitemap:publicSite&&config.sitemapEnabled?seoOrigin(config)+"/sitemap.xml":undefined,
  };
}
