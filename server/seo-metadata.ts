import "server-only";
import type {Metadata} from "next";
import {
  type FertiniSeoConfig,seoAbsolute,seoOrigin,seoPageConfig,seoTitle,
  cleanSeoText,safeJsonLd,
} from "@/lib/fertini-seo";
import {readSiteContent} from "@/server/site-content";

export async function currentSeo():Promise<FertiniSeoConfig>{
  try{return (await readSiteContent()).seo}
  catch{
    const {DEFAULT_SEO_CONFIG}=await import("@/lib/fertini-seo");
    return DEFAULT_SEO_CONFIG;
  }
}
export function seoMetadata(
  config:FertiniSeoConfig,path:string,
  fallback:{title:string;description?:string;image?:string;imageAlt?:string},
):Metadata{
  const page=seoPageConfig(config,path);
  const title=seoTitle(config,path,fallback.title);
  const description=cleanSeoText(page.description|| (path==="/"?config.homepageDescription:fallback.description||"")).slice(0,550);
  const canonical=seoAbsolute(page.canonical||path,config);
  const image=page.imageUrl||fallback.image||config.defaultImage;
  const imageAlt=page.imageAlt||fallback.imageAlt||config.defaultImageAlt||title;
  const allowIndex=config.indexSite&&!page.noindex&&process.env.VERCEL_ENV!=="preview";
  const imageData=image?[{url:seoAbsolute(image,config),alt:imageAlt}]:undefined;
  const language=config.language.replace("-","_");
  return {
    metadataBase:new URL(seoOrigin(config)),
    title:{absolute:title},
    description,
    applicationName:config.siteName,
    alternates:{canonical},
    robots:{index:allowIndex,follow:allowIndex,noarchive:page.noarchive,
      googleBot:{index:allowIndex,follow:allowIndex,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
    openGraph:{type:"website",url:canonical,title,description,siteName:config.siteName,locale:language,images:imageData},
    twitter:{card:image?"summary_large_image":"summary",title,description,images:image?[seoAbsolute(image,config)]:undefined,
      creator:config.twitterHandle||undefined},
    verification:{google:config.googleVerification||undefined,
      other:config.bingVerification?{"msvalidate.01":config.bingVerification}:undefined},
  };
}
export function homepageSeoJsonLd(config:FertiniSeoConfig){
  const origin=seoOrigin(config);
  return safeJsonLd({"@context":"https://schema.org","@graph":[
    {"@type":"WebSite","@id":origin+"/#website",url:origin+"/",name:config.siteName,
      description:config.homepageDescription,inLanguage:config.language},
    {"@type":"Organization","@id":origin+"/#organization",name:config.companyName||config.siteName,url:origin+"/",
      ...(config.companyLogo?{logo:seoAbsolute(config.companyLogo,config)}:{}),
      ...(config.socialProfiles.length?{sameAs:config.socialProfiles}:{})},
  ]});
}
export function productSeoJsonLd(config:FertiniSeoConfig,product:{
  id:number;name:string;description?:string|null;
  images?:Array<{image_url:string}>;variants?:Array<{price?:number;discount_price?:number|null;stock_qty?:number;is_active?:boolean}>;
}){
  const path="/products/"+product.id,origin=seoOrigin(config);
  const variants=product.variants||[];
  const active=variants.filter(v=>v.is_active!==false);
  const prices=active.map(v=>v.discount_price??v.price??0).filter(p=>p>0);
  const price=prices.length?Math.min(...prices):null;
  const stock=active.some(v=>(v.stock_qty??0)>0);
  return safeJsonLd({
    "@context":"https://schema.org","@type":"Product",
    name:product.name,description:cleanSeoText(product.description||"").slice(0,500),
    image:(product.images||[]).filter(i=>i.image_url).map(i=>seoAbsolute(i.image_url,config)),
    url:origin+path,
    ...(price!==null?{offers:{"@type":"Offer",url:origin+path,
      priceCurrency:"IRR",price:price*10,
      availability:stock?"https://schema.org/InStock":"https://schema.org/OutOfStock",
      itemCondition:"https://schema.org/NewCondition"}}:{}),
  });
}
