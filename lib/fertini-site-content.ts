import { z } from "zod";
import { FERTINI_DEMOS, FERTINI_FAMILIES } from "@/lib/fertini-demo";
import type { HomeProduct } from "@/lib/fertini-home-products";

const safeImage = (url: string) =>
  (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") && !url.includes("..")) ||
  (() => { try { const u = new URL(url); return u.protocol === "https:" && Boolean(u.hostname); } catch { return false; } })();
const photo = z.string().trim().min(2).max(700).refine(safeImage, "آدرس تصویر معتبر نیست");
const demoId = z.enum(FERTINI_DEMOS.map(x => x.id) as [string, ...string[]]);
const productId = z.union([demoId, z.string().regex(/^db:[1-9]\d{0,14}$/, "شناسه محصول معتبر نیست")]);
const familyId = z.enum(["woody", "floral", "amber"]);
export const homepageSection = z.enum(["bestsellers", "latest", "families"]);
export type HomepageSection = z.infer<typeof homepageSection>;
const selection = z.array(productId).min(1).max(6).refine(ids => new Set(ids).size === ids.length, "محصول تکراری است");

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
  }).strict()).length(3).refine(families => new Set(families.map(x => x.id)).size === 3, "خانواده رایحه تکراری است"),
  sectionOrder: z.array(homepageSection).length(3).refine(sections => new Set(sections).size === 3, "ترتیب بخش‌ها معتبر نیست"),
  sectionVisibility: z.object({ bestsellers: z.boolean(), latest: z.boolean(), families: z.boolean() }).strict(),
  footerTagline: z.string().trim().min(2).max(130),
  footerCaption: z.string().trim().min(2).max(130),
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
  familyTitle: "دسته‌بندی رایحه‌ها",
  familyDescription: "انتخاب را از حال‌وهوای خودتان آغاز کنید.",
  families: FERTINI_FAMILIES.map(x => ({
    id: x.id, name: x.name, subtitle: x.subtitle, photo: x.image, scentFamilyId: null,
  })),
  sectionOrder: ["bestsellers", "latest", "families"],
  sectionVisibility: { bestsellers: true, latest: true, families: true },
  footerTagline: "THE ART OF AN INVISIBLE SIGNATURE",
  footerCaption: "هر رایحه، رد یک خاطره.",
};

/** Merge legacy content with new defaults without losing saved hero/product selections. */
export function parseContent(raw: unknown): FertiniSiteContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_SITE_CONTENT;
  const obj = raw as Record<string, unknown>;
  const parsed = contentSchema.safeParse({
    ...DEFAULT_SITE_CONTENT, ...obj,
    sectionVisibility: { ...DEFAULT_SITE_CONTENT.sectionVisibility,
      ...(obj.sectionVisibility && typeof obj.sectionVisibility === "object" ? obj.sectionVisibility : {}) },
  });
  return parsed.success ? parsed.data : DEFAULT_SITE_CONTENT;
}
export function resolveDatabaseSelections(content: FertiniSiteContent, catalog: HomeProduct[]): FertiniSiteContent {
  if (!catalog.length) return content;
  const active = new Set(catalog.map(x => x.id));
  const featured = [...catalog].sort((a, b) => Number(b.featured) - Number(a.featured) || b.numericId - a.numericId);
  const newest = [...catalog].sort((a, b) => b.numericId - a.numericId);
  const resolve = (ids: string[], fallback: HomeProduct[]) => {
    const selected = ids.filter(x => active.has(x));
    return selected.length ? selected : fallback.slice(0, 6).map(x => x.id);
  };
  return { ...content, bestsellerIds: resolve(content.bestsellerIds, featured),
    latestIds: resolve(content.latestIds, newest) };
}
