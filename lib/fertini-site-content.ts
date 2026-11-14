import { z } from "zod";
import {seoConfigSchema, DEFAULT_SEO_CONFIG, parseSeoConfig} from "@/lib/fertini-seo";
import { FERTINI_DEMOS, FERTINI_FAMILIES } from "@/lib/fertini-demo";
import type { HomeProduct } from "@/lib/fertini-home-products";

const safeImage = (url: string) =>
  (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") && !url.includes("..")) ||
  (() => { try { const u = new URL(url); return u.protocol === "https:" && Boolean(u.hostname); } catch { return false; } })();
const photo = z.string().trim().min(2).max(700).refine(safeImage, "آدرس تصویر معتبر نیست");
const demoId = z.enum(FERTINI_DEMOS.map(x => x.id) as [string, ...string[]]);
const productId = z.union([demoId, z.string().regex(/^db:[1-9]\d{0,14}$/, "شناسه محصول معتبر نیست")]);
const familyId = z.enum(["woody", "floral", "amber"]);
const campaignSchema=z.object({
 id:z.string().regex(/^[a-z0-9-]{8,60}$/),title:z.string().trim().min(2).max(100),
 description:z.string().trim().max(350),banner:photo,
 startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),
 discountPercent:z.number().int().min(1).max(80),
 productIds:z.array(productId).max(60),enabled:z.boolean(),
}).strict().refine(c=>Date.parse(c.endsAt)>Date.parse(c.startsAt),"زمان پایان باید بعد از شروع باشد");
const shippingMethodSchema=z.object({
 id:z.string().regex(/^[a-z0-9-]{4,60}$/),
 name:z.string().trim().min(2).max(100),
 description:z.string().trim().max(300),
 estimatedDays:z.string().trim().max(100),
 cost:z.number().finite().min(0).max(1e9),
 enabled:z.boolean(),
}).strict();
const musicSchema=z.object({
 enabled:z.boolean(),
 audioUrl:z.string().max(700).refine(x=>x.startsWith("/")&&!x.startsWith("//")&&!x.includes("..")&&!x.includes("\\")||/^https:\/\/[^\s]+$/.test(x),"آدرس فایل صوتی معتبر نیست"),
}).strict();
export type FertiniCampaign=z.infer<typeof campaignSchema>;
export type FertiniShippingMethod=z.infer<typeof shippingMethodSchema>;
export const campaignsSchema=z.array(campaignSchema).max(12).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"شناسه کمپین تکراری است");
export const shippingSchema=z.array(shippingMethodSchema).max(12).refine(items=>new Set(items.map(x=>x.id)).size===items.length,"شناسه روش ارسال تکراری است");
export {musicSchema};
export const homepageSection = z.enum(["campaign", "bestsellers", "latest", "families"]);
export type HomepageSection = z.infer<typeof homepageSection>;
const selection = z.array(productId).max(6).refine(ids => new Set(ids).size === ids.length, "محصول تکراری است");

export const contentSchema = z.object({
  heroSlides: z.array(z.object({ photo, alt: z.string().trim().min(5).max(180) }).strict()).min(2).max(5),
  bestsellerTitle: z.string().trim().min(2).max(70),
  bestsellerDescription: z.string().trim().max(260),
  latestTitle: z.string().trim().min(2).max(70),
  latestDescription: z.string().trim().max(260),
  latestCtaLabel: z.string().trim().min(2).max(45),
  bestsellerIds: selection,
  latestIds: selection,
  familyTitle: z.string().trim().min(2).max(70),
  familyDescription: z.string().trim().max(260),
  families: z.array(z.object({
    id: familyId, name: z.string().trim().min(2).max(60),
    subtitle: z.string().trim().min(2).max(80),
    photo, scentFamilyId: z.number().int().positive().nullable(),
    categoryId: z.number().int().positive().nullable(),
  }).strict()).length(3).refine(families => new Set(families.map(x => x.id)).size === 3, "خانواده رایحه تکراری است"),
  sectionOrder: z.array(homepageSection).length(4).refine(sections => new Set(sections).size === 4, "ترتیب بخش‌ها معتبر نیست"),
  sectionVisibility: z.object({ campaign:z.boolean(), bestsellers: z.boolean(), latest: z.boolean(), families: z.boolean() }).strict(),
  campaigns:campaignsSchema,
  shipping:shippingSchema,
  music:musicSchema,
  footerTagline: z.string().trim().min(2).max(130),
  footerCaption: z.string().trim().min(2).max(130),
  seo: seoConfigSchema.default(DEFAULT_SEO_CONFIG),
}).strict();
export type FertiniSiteContent = z.infer<typeof contentSchema>;

export const DEFAULT_SITE_CONTENT: FertiniSiteContent = {
  heroSlides: [
    { photo: "/fertini/hero-01.svg", alt: "شیشه عطر فرتینی در نورپردازی سینمایی" },
    { photo: "/fertini/hero-02.svg", alt: "عطر فرتینی در نور ملایم و سایه‌های عمیق" },
  ],
  bestsellerTitle: "پرفروش‌ترین‌ها",
  bestsellerDescription: "شش انتخاب ماندگار از مجموعه فرتینی.",
  latestTitle: "جدیدترین عطرها",
  latestDescription: "رایحه‌هایی تازه برای سلیقه‌هایی که در جست‌وجوی تجربه‌ای متفاوت‌اند.",
  latestCtaLabel: "مشاهده همه عطرها",
  bestsellerIds: FERTINI_DEMOS.filter(x => x.collection === "bestseller").slice(0, 6).map(x => x.id),
  latestIds: FERTINI_DEMOS.filter(x => x.collection === "new").slice(0, 6).map(x => x.id),
  familyTitle: "گروه‌های بویایی",
  familyDescription: "انتخاب را از حال‌وهوای خودتان آغاز کنید.",
  families: FERTINI_FAMILIES.map(x => ({
    id: x.id, name: x.name, subtitle: x.subtitle, photo: x.image, scentFamilyId: null, categoryId: null,
  })),
  sectionOrder: ["campaign","bestsellers", "latest", "families"],
  sectionVisibility: { campaign:true,bestsellers: true, latest: true, families: true },
  campaigns:[],
  shipping:[{id:"standard",name:"ارسال استاندارد",description:"روش ارسال پس از ثبت سفارش با هماهنگی فروشگاه مشخص می‌شود.",estimatedDays:"زمان ارسال پس از هماهنگی اعلام می‌شود",cost:0,enabled:true}],
  music:{enabled:true,audioUrl:"/audio/luxury-piano.mp3"},
  footerTagline: "THE ART OF AN INVISIBLE SIGNATURE",
  footerCaption: "هر رایحه، رد یک خاطره.",
  seo: DEFAULT_SEO_CONFIG,
};

/** Merge legacy content with new defaults without losing saved hero/product selections. */
export function parseContent(raw: unknown): FertiniSiteContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_SITE_CONTENT;
  const obj = raw as Record<string, unknown>;
  const parsed = contentSchema.safeParse({
    ...DEFAULT_SITE_CONTENT, ...obj,
    families: (Array.isArray(obj.families) ? obj.families : DEFAULT_SITE_CONTENT.families).map((item, index) => ({
      ...DEFAULT_SITE_CONTENT.families[index], ...(item && typeof item === "object" ? item : {}),
    })),
    seo: parseSeoConfig(obj.seo),
    campaigns:Array.isArray(obj.campaigns)?obj.campaigns:[],
    shipping:Array.isArray(obj.shipping)?obj.shipping:DEFAULT_SITE_CONTENT.shipping,
    music:obj.music&&typeof obj.music==="object"?{...DEFAULT_SITE_CONTENT.music,...obj.music}:DEFAULT_SITE_CONTENT.music,
    sectionOrder:[...new Set(["campaign",...(Array.isArray(obj.sectionOrder)?obj.sectionOrder:DEFAULT_SITE_CONTENT.sectionOrder)])],
    sectionVisibility: { ...DEFAULT_SITE_CONTENT.sectionVisibility,
      ...(obj.sectionVisibility && typeof obj.sectionVisibility === "object" ? obj.sectionVisibility : {}) },
  });
  return parsed.success ? parsed.data : DEFAULT_SITE_CONTENT;
}
export function resolveDatabaseSelections(content: FertiniSiteContent, catalog: HomeProduct[]): FertiniSiteContent {
  const active = new Set(catalog.map(x => x.id));
  const featured = [...catalog].sort((a, b) => Number(b.featured) - Number(a.featured) || b.numericId - a.numericId);
  const newest = [...catalog].sort((a, b) => b.numericId - a.numericId);
  const resolve = (ids: string[], fallback: HomeProduct[]) => {
    // Never show old demo IDs as live inventory. Explicit empty lists remain empty.
    if (ids.length === 0) return [];
    const selected = ids.filter(x => active.has(x));
    return selected.length ? selected : fallback.slice(0, 6).map(x => x.id);
  };
  return { ...content, bestsellerIds: resolve(content.bestsellerIds, featured),
    latestIds: resolve(content.latestIds, newest) };
}

/** A campaign affects checkout only for published products during its active UTC window. */
export function getActiveCampaigns(content:FertiniSiteContent,now=Date.now()):FertiniCampaign[]{
 return content.campaigns.filter(c=>c.enabled&&Date.parse(c.startsAt)<=now&&Date.parse(c.endsAt)>now);
}
export function campaignDiscountPercent(content:FertiniSiteContent,productId:number|string,now=Date.now()):number{
 const id=typeof productId==="number"?"db:"+productId:productId;
 return Math.max(0,...getActiveCampaigns(content,now)
  .filter(c=>c.productIds.includes(id)).map(c=>c.discountPercent));
}
