import {z} from "zod";
import {FERTINI_DEMOS} from "@/lib/fertini-demo";
const validPhoto=(url:string)=>
 (url.startsWith("/")&&!url.startsWith("//")&&!url.includes("\\")&&!url.includes(".."))||
 (()=>{try{const u=new URL(url);return u.protocol==="https:"&&!!u.hostname}catch{return false}})();
const photo=z.string().trim().min(2).max(700).refine(validPhoto,"نشانی تصویر باید امن و معتبر باشد");
const id=z.enum(FERTINI_DEMOS.map(x=>x.id) as [string,...string[]]);
export const contentSchema=z.object({
 heroSlides:z.array(z.object({photo,alt:z.string().trim().min(5).max(180)})).min(2).max(5),
 bestsellerTitle:z.string().trim().min(2).max(70),
 bestsellerDescription:z.string().trim().max(260),
 latestTitle:z.string().trim().min(2).max(70),
 latestDescription:z.string().trim().max(260),
 bestsellerIds:z.array(id).length(6).refine(v=>new Set(v).size===v.length,"محصول تکراری است"),
 latestIds:z.array(id).length(6).refine(v=>new Set(v).size===v.length,"محصول تکراری است"),
}).strict();
export type FertiniSiteContent=z.infer<typeof contentSchema>;
export const DEFAULT_SITE_CONTENT:FertiniSiteContent={
 heroSlides:[
  {photo:"/fertini/hero-01.svg",alt:"شیشه عطر فرتینی در نورپردازی سینمایی"},
  {photo:"/fertini/hero-02.svg",alt:"عطر فرتینی در نور ملایم و سایه‌های عمیق"}
 ],
 bestsellerTitle:"پرفروش‌ترین‌ها",
 bestsellerDescription:"شش انتخاب ماندگار از مجموعه فرتینی.",
 latestTitle:"جدیدترین عطرها",
 latestDescription:"رایحه‌هایی تازه برای سلیقه‌هایی که در جست‌وجوی تجربه‌ای متفاوت‌اند.",
 bestsellerIds:FERTINI_DEMOS.filter(x=>x.collection==="bestseller").slice(0,6).map(x=>x.id),
 latestIds:FERTINI_DEMOS.filter(x=>x.collection==="new").slice(0,6).map(x=>x.id),
};
export function parseContent(raw:unknown):FertiniSiteContent{
 const parsed=contentSchema.safeParse(raw);
 return parsed.success?parsed.data:DEFAULT_SITE_CONTENT;
}
