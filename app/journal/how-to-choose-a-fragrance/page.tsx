import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export const metadata: Metadata = {
  title: "چگونه عطر مناسب انتخاب کنیم؟ | ژورنال FERTINI",
  description: "راهنمای ساده و کاربردی شناخت نت‌های اولیه، میانی و پایه، آزمایش روی پوست و انتخاب رایحه بر اساس سلیقه و موقعیت.",
  alternates: { canonical: "/journal/how-to-choose-a-fragrance" },
};
export default function FragranceGuide() {
  return <MaisonPage kicker="THE FERTINI JOURNAL / FIELD NOTE 001" title="چگونه عطر مناسب خود را پیدا کنیم؟"
    lead="پیش از نام برند یا شکل بطری، به حسی فکر کنید که قرار است با شما بماند.">
    <figure className="maison-article__image">
      <Image fill priority sizes="(min-width: 900px) 80vw, 100vw" src="/fertini/hero-02.svg" alt="چند شیشه عطر در نور ملایم" />
      <figcaption>THE ART OF CHOOSING — FERTINI JOURNAL</figcaption>
    </figure>
    <div className="maison-article__chapters">
      <MaisonSection number="01" title="اول، یک حس را انتخاب کنید">
        <p>برای شروع لازم نیست نام عطرهای زیادی را بدانید. فکر کنید به رایحه‌های روشن و تمیز علاقه دارید، گرمای چوب و ادویه را ترجیح می‌دهید یا عطرهای گلی و آرام را دوست دارید. این تصویر ذهنی، نقطهٔ شروع بهتری از دنبال‌کردن نام‌های مشهور است.</p>
      </MaisonSection>
      <MaisonSection number="02" title="به عطر زمان بدهید">
        <p>رایحهٔ اولین اسپری، همهٔ داستان نیست. نت‌های اولیه معمولاً زودتر تغییر می‌کنند و پس از آن، نت‌های میانی و پایه شخصیت ماندگارتر عطر را نشان می‌دهند. هنگام امتحان عطر، چند دقیقه تا چند ساعت به آن فرصت بدهید.</p>
      </MaisonSection>
      <MaisonSection number="03" title="آن را روی پوست خود بشناسید">
        <p>عطر روی کاغذ تست و پوست یکسان تجربه نمی‌شود. اگر امکان دارید، مقدار کمی را روی پوست تمیز امتحان کنید و بدون مالیدن محل اسپری، تغییر رایحه را دنبال کنید. میزان پخش بو و ماندگاری در شرایط مختلف متفاوت است.</p>
      </MaisonSection>
      <MaisonSection number="04" title="به موقعیت و فصل فکر کنید">
        <p>رایحه‌ای که برای فضای باز یا هوای خنک دوست دارید، ممکن است در فضای بسته متفاوت احساس شود. انتخابی مناسب‌تر است که هم با سلیقهٔ شما سازگار باشد و هم در موقعیتی که بیشتر استفاده می‌کنید، راحتی ایجاد کند.</p>
      </MaisonSection>
      <MaisonSection number="05" title="انتخاب نهایی، شخصی است">
        <p>برچسب «بهترین عطر» برای همه یک معنی ندارد. اگر رایحه‌ای را پس از گذشت زمان همچنان دوست دارید، احساس راحتی می‌کنید و می‌خواهید دوباره آن را تجربه کنید، به احتمال زیاد به امضای شخصی‌تان نزدیک شده‌اید.</p>
      </MaisonSection>
    </div>
    <div className="maison-article__end"><Link href="/products" className="maison-link">کشف مجموعهٔ عطرها ←</Link><Link href="/journal" className="maison-link">بازگشت به ژورنال ←</Link></div>
  </MaisonPage>;
}
