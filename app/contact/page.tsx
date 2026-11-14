import type { Metadata } from "next";
import {currentSeo,seoMetadata} from "@/server/seo-metadata";
import Link from "next/link";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export async function generateMetadata():Promise<Metadata>{
 const seo=await currentSeo();
 return seoMetadata(seo,"/contact",{title:"ارتباط با FERTINI",description:"راهنمای پیگیری سفارش‌ها و ارتباط با فروشگاه عطر FERTINI."});
}
export default function ContactPage() {
  return <MaisonPage kicker="FERTINI / CONTACT" title="در کنار انتخاب شما."
    lead="برای بررسی اطلاعات حساب و سفارش‌های پیشین، از مسیر حساب کاربری استفاده کنید.">
    <MaisonSection number="01" title="حساب و سفارش‌ها">
      <p>جزئیات سفارش‌های ثبت‌شده و اطلاعات شخصی را از حساب کاربری خود بررسی کنید. سفارش‌گیری جدید تا فعال‌شدن پرداخت واقعی غیرفعال است.</p>
      <Link href="/account" className="maison-link">رفتن به حساب کاربری</Link>
    </MaisonSection>
    <MaisonSection number="02" title="کانال تماس رسمی">
      <p>اطلاعات تماس مستقیم فروشگاه هنوز برای انتشار تأیید نشده است. برای حفظ امنیت و جلوگیری از درج اطلاعات نادرست، در این پیش‌نمایش نشانی یا شماره ساختگی نمایش داده نمی‌شود.</p>
    </MaisonSection>
  </MaisonPage>;
}
