import type {Metadata} from "next";
import {seoMetadata,homepageSeoJsonLd} from "@/server/seo-metadata";
import {currentSeo} from "@/server/seo-metadata";
import HomePageShell from "@/components/HomeWrapper/home-page-shell";
import { readSiteContent } from "@/server/site-content";
import { listHomeProducts } from "@/server/home-catalog";
import { DEFAULT_SITE_CONTENT, resolveDatabaseSelections } from "@/lib/fertini-site-content";
import { DEMO_HOME_PRODUCTS, type HomeProduct } from "@/lib/fertini-home-products";
export const dynamic = "force-dynamic";

export async function generateMetadata():Promise<Metadata>{
 const config=await currentSeo();
 return seoMetadata(config,"/",{title:config.homepageTitle,description:config.homepageDescription});
}

export default async function Page() {
  let content = DEFAULT_SITE_CONTENT;
  let products: HomeProduct[] = DEMO_HOME_PRODUCTS;
  let catalogState: "demo" | "database" | "unavailable" = "demo";
  if (process.env.DATABASE_URL) {
    catalogState = "unavailable";
    products = [];
    try {
      const [saved, published] = await Promise.all([readSiteContent(), listHomeProducts()]);
      content = resolveDatabaseSelections(saved, published);
      products = published;
      catalogState = "database";
    } catch {
      // When a configured database fails, never pass demonstration products as real inventory.
      try { content = await readSiteContent(); } catch {}
    }
  }
  return <><HomePageShell content={content} products={products} catalogState={catalogState} />
    {content.seo.structuredDataEnabled&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:homepageSeoJsonLd(content.seo)}}/>}
  </>;
}
