import type { Metadata } from "next";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export const metadata: Metadata = {
  title: "حفظ حریم خصوصی | FERTINI",
  description: "اطلاعات اولیه درباره داده‌های حساب کاربری، نشانی و سفارش‌ها در فروشگاه عطر FERTINI.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return <MaisonPage kicker="FERTINI / PRIVACY" title="حریم خصوصی شما."
    lead="این متن درباره داده‌هایی است که ساختار فعلی فروشگاه می‌تواند برای خدمات حساب و سفارش دریافت کند. نسخه حقوقی نهایی پیش از آغاز فروش باید بررسی شود.">
    <MaisonSection number="01" title="اطلاعات حساب">
      <p>برای ثبت‌نام و ورود، نام، نام خانوادگی، شماره همراه و اطلاعات لازم برای احراز هویت دریافت می‌شود. گذرواژه در سامانه به صورت هش ذخیره می‌شود.</p>
    </MaisonSection>
    <MaisonSection number="02" title="آدرس و سفارش">
      <p>در فرایند سفارش ممکن است اطلاعات آدرس، شماره تماس، محصولات انتخابی و وضعیت سفارش ثبت شود تا امکان مدیریت و پیگیری آن فراهم باشد.</p>
    </MaisonSection>
    <MaisonSection number="03" title="حقوق و درخواست‌ها">
      <p>برای بررسی یا اصلاح اطلاعات حساب، از بخش حساب کاربری استفاده کنید. سازوکار درخواست حذف داده و اطلاعات تماس رسمی باید پیش از انتشار نهایی مشخص و در این صفحه تکمیل شوند.</p>
    </MaisonSection>
  </MaisonPage>;
}
