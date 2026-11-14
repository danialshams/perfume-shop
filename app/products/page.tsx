import type { Metadata } from "next";
import {currentSeo,seoMetadata} from "@/server/seo-metadata";
import { Suspense } from "react";
import LuxuryProductsView from "@/components/HomeProductsPage/LuxuryProductsView";

export async function generateMetadata():Promise<Metadata>{
 const config=await currentSeo();
 return seoMetadata(config,"/products",{
   title:"کالکشن عطرها",description:"گالری عطرهای FERTINI؛ کشف رایحه‌ها، تصاویر و مشخصات محصولات."
 });
}

export default function ProductsPage() {
  const demoMode = !(process.env.DATABASE_URL);
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10" role="status">در حال آماده‌سازی کالکشن…</main>}>
    <LuxuryProductsView demoMode={demoMode} />
  </Suspense>;
}
