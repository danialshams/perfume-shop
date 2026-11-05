import type { Metadata } from "next";
import Link from "next/link";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export const metadata: Metadata = {
  title: "راهنمای ارسال و سفارش | MAISON",
  description: "راهنمای وضعیت سفارش‌گیری، آدرس و ارسال سفارش در فروشگاه MAISON.",
  alternates: { canonical: "/shipping" },
};
export default function ShippingPage() {
  return <MaisonPage kicker="MAISON / ORDERS & DELIVERY" title="از انتخاب تا دریافت."
    lead="شفافیت سفارش و اطلاعات ارسال، بخش مهمی از تجربهٔ خرید آرام است.">
    <MaisonSection number="01" title="وضعیت سفارش‌گیری">
      <p>در نسخهٔ آزمایشی فعلی، ثبت سفارش و پرداخت واقعی فعال نیست. پس از اتصال و تأیید درگاه پرداخت، امکان تکمیل سفارش فراهم خواهد شد.</p>
    </MaisonSection>
    <MaisonSection number="02" title="جزئیات ارسال">
      <p>مدت، محدوده و هزینهٔ ارسال باید پیش از فعال‌شدن سفارش‌گیری بر اساس روش ارسال واقعی فروشگاه مشخص شوند. این صفحه تا آن زمان تعهدی دربارهٔ زمان یا هزینهٔ مشخص ایجاد نمی‌کند.</p>
    </MaisonSection>
    <MaisonSection number="03" title="پیگیری سفارش">
      <p>برای مشاهدهٔ وضعیت سفارش‌های پیشین به حساب کاربری مراجعه کنید.</p>
      <Link href="/account" className="maison-link">مشاهدهٔ حساب کاربری ←</Link>
    </MaisonSection>
  </MaisonPage>;
}
