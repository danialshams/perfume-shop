import type {Metadata} from "next";
import {currentSeo,seoMetadata} from "@/server/seo-metadata";
import {readSiteContent} from "@/server/site-content";
import {DEFAULT_SITE_CONTENT} from "@/lib/fertini-site-content";
import Link from "next/link";
import {MaisonPage,MaisonSection} from "@/components/maison/MaisonContentPage";
export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{
 const seo=await currentSeo();
 return seoMetadata(seo,"/shipping",{title:"راهنمای ارسال و سفارش | FERTINI",description:"روش‌ها، هزینه و زمان تقریبی ارسال سفارش‌های فرتینی."});
}
export default async function ShippingPage(){
 const content=await readSiteContent().catch(()=>DEFAULT_SITE_CONTENT);
 const methods=content.shipping.filter(method=>method.enabled);
 return <MaisonPage kicker="FERTINI / DELIVERY" title="روش‌های ارسال"
  lead="روش ارسال، هزینه و زمان تقریبی تحویل را پیش از ثبت سفارش بررسی کنید.">
  <MaisonSection number="01" title="روش‌های قابل انتخاب فروشگاه">
   {methods.length?methods.map((method,index)=><div key={method.id} className="my-5 border-b border-neutral-200 pb-6">
    <h3 className="font-medium">{method.name}</h3>
    {method.description&&<p>{method.description}</p>}
    {method.estimatedDays&&<p>زمان تقریبی: {method.estimatedDays}</p>}
    <p>هزینه اعلام‌شده: {method.cost===0?"رایگان / توافقی":method.cost.toLocaleString("fa-IR")+" تومان"}</p>
   </div>):<p>روش ارسال فعالی تعریف نشده است. برای اطلاعات بیشتر با فروشگاه تماس بگیرید.</p>}
  </MaisonSection>
  <MaisonSection number="02" title="زمان و هزینه نهایی">
   <p>هزینه و زمان اعلام‌شده حدودی است و پیش از پرداخت نهایی باید روش انتخابی شما و وضعیت مقصد تأیید شود. تا زمان اتصال درگاه و انتخاب روش ارسال در تسویه‌حساب، این اطلاعات صرفاً راهنمای مشتری هستند.</p>
  </MaisonSection>
  <MaisonSection number="03" title="پیگیری سفارش">
   <p>وضعیت سفارش‌های ثبت‌شده را در حساب کاربری ببینید.</p>
   <Link href="/account" className="maison-link">مشاهده حساب کاربری</Link>
  </MaisonSection>
 </MaisonPage>;
}
