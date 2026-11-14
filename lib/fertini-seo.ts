import { z } from "zod";

export const FERTINI_ORIGIN = "https://fertiniperfume.com";
const absoluteHttps = z.string().trim().url().max(2000).refine(x => x.startsWith("https://"), "آدرس باید HTTPS باشد");
const imageUrl = z.union([z.literal(""), absoluteHttps, z.string().trim().startsWith("/").max(500).refine(x => !x.startsWith("//") && !x.includes("\\") && !x.includes(".."), "مسیر عکس نامعتبر است")]);
const canonicalUrl = z.union([z.literal(""), absoluteHttps, z.string().trim().startsWith("/").max(300).refine(x => !x.startsWith("//") && !x.includes("\\") && !x.includes(".."), "آدرس کانونیکال معتبر نیست")]);

export const seoPageSchema = z.object({
  title: z.string().trim().max(135).default(""),
  description: z.string().trim().max(550).default(""),
  canonical: canonicalUrl.default(""),
  imageUrl: imageUrl.default(""),
  imageAlt: z.string().trim().max(250).default(""),
  noindex: z.boolean().default(false),
  noarchive: z.boolean().default(false),
}).strict();
export type FertiniSeoPage = z.infer<typeof seoPageSchema>;

export const seoConfigSchema = z.object({
  siteUrl: absoluteHttps,
  siteName: z.string().trim().min(2).max(120),
  homepageTitle: z.string().trim().min(2).max(120),
  homepageDescription: z.string().trim().min(20).max(550),
  titleSeparator: z.string().trim().max(12),
  defaultImage: imageUrl,
  defaultImageAlt: z.string().trim().max(250),
  language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).max(12),
  indexSite: z.boolean(),
  sitemapEnabled: z.boolean(),
  structuredDataEnabled: z.boolean(),
  googleVerification: z.string().trim().max(300),
  bingVerification: z.string().trim().max(300),
  twitterHandle: z.string().trim().max(100),
  companyName: z.string().trim().max(150),
  companyLogo: imageUrl,
  socialProfiles: z.array(absoluteHttps).max(12),
  pages: z.record(z.string(), seoPageSchema).superRefine((pages, ctx) => {
    if (Object.keys(pages).length > 1200) ctx.addIssue({code:"custom", message:"حداکثر ۱۲۰۰ صفحه قابل تنظیم است."});
    for (const path of Object.keys(pages)) {
      if (!/^\/(?:[a-z0-9\-_/]*)$/i.test(path) || path.includes("//") || path.includes(".."))
        ctx.addIssue({code:"custom", message:"مسیر صفحه معتبر نیست: " + path});
    }
  }),
}).strict();
export type FertiniSeoConfig = z.infer<typeof seoConfigSchema>;

export const DEFAULT_SEO_CONFIG: FertiniSeoConfig = {
  siteUrl:FERTINI_ORIGIN,
  siteName:"FERTINI",
  homepageTitle:"FERTINI | گالری عطر و رایحه",
  homepageDescription:"FERTINI؛ تجربه‌ای آرام، سینمایی و شخصی برای کشف دنیای عطرها و آشنایی با رایحه‌های متفاوت.",
  titleSeparator:" | ",
  defaultImage:"/fertini/hero-01.svg",
  defaultImageAlt:"گالری عطر فرتینی",
  language:"fa-IR",
  indexSite:true,
  sitemapEnabled:true,
  structuredDataEnabled:true,
  googleVerification:"",
  bingVerification:"",
  twitterHandle:"",
  companyName:"FERTINI",
  companyLogo:"",
  socialProfiles:[],
  pages:{},
};

export function parseSeoConfig(value: unknown): FertiniSeoConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_SEO_CONFIG;
  const obj=value as Partial<FertiniSeoConfig>;
  const result=seoConfigSchema.safeParse({...DEFAULT_SEO_CONFIG, ...obj, pages:obj.pages??{}});
  return result.success?result.data:DEFAULT_SEO_CONFIG;
}
export function seoOrigin(config: FertiniSeoConfig): string {
  try {
    const url=new URL(config.siteUrl);
    return url.origin;
  } catch { return FERTINI_ORIGIN; }
}
export function seoAbsolute(url: string, config: FertiniSeoConfig): string {
  if (url.startsWith("/") && !url.startsWith("//")) return seoOrigin(config)+url;
  try { const parsed=new URL(url);if (parsed.protocol==="https:") return parsed.toString(); } catch {}
  return seoOrigin(config)+"/";
}
export function seoPageConfig(config:FertiniSeoConfig, path:string):FertiniSeoPage {
  return config.pages[path]??seoPageSchema.parse({});
}
export function seoTitle(config:FertiniSeoConfig,path:string,fallback:string):string {
  const base=seoPageConfig(config,path).title|| (path==="/"?config.homepageTitle:fallback);
  return path==="/"||base.includes(config.siteName)?base:base+config.titleSeparator+config.siteName;
}
export function cleanSeoText(value:string):string {
  return value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
}
export function safeJsonLd(value:unknown):string {
  return JSON.stringify(value).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");
}
