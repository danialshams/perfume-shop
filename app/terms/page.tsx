import type { Metadata } from "next";
import {currentSeo,seoMetadata} from "@/server/seo-metadata";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export async function generateMetadata():Promise<Metadata>{
 const seo=await currentSeo();
 return seoMetadata(seo,"/terms",{title:"قوانین و مقررات | FERTINI",description:"چارچوب اولیه استفاده از فروشگاه عطر FERTINI و وضعیت سفارش‌گیری آزمایشی."});
}
export default function TermsPage() {
  return <MaisonPage kicker="FERTINI / TERMS OF USE" title="شفافیت، پیش از انتخاب."
    lead="این شرایط در نسخه آزمایشی اطلاع‌رسانی اولیه هستند و جایگزین قوانین نهایی فروش، بازگشت کالا و خدمات پس از خرید نیستند.">
    <MaisonSection number="01" title="محتوا و تصاویر">
      <p>مطالب و تصاویر سایت برای معرفی و بررسی رایحه‌ها ارائه می‌شوند. ظاهر، حجم و جزئیات محصول باید پیش از خرید با مشخصات درج‌شده برای همان محصول تطبیق داده شود.</p>
    </MaisonSection>
    <MaisonSection number="02" title="قیمت و موجودی">
      <p>موجودی و قیمت معتبر باید در زمان ثبت سفارش توسط سرور دوباره بررسی شوند. صرف افزودن محصول به سبد خرید به معنی رزرو موجودی نیست.</p>
    </MaisonSection>
    <MaisonSection number="03" title="پرداخت و ارسال">
      <p>ثبت سفارش واقعی تا اتصال درگاه پرداخت تأییدشده غیرفعال است. شرایط نهایی ارسال، انصراف و بازگشت کالا باید پیش از فعال‌شدن فروش تکمیل و منتشر شود.</p>
    </MaisonSection>
  </MaisonPage>;
}
