import type { Metadata } from "next";
import Image from "next/image";
import { MaisonPage, MaisonSection } from "@/components/maison/MaisonContentPage";

export const metadata: Metadata = {
  title: "دربارهٔ FERTINI | فلسفهٔ گالری رایحه",
  description: "با نگاه و زبان بصری FERTINI آشنا شوید؛ گالری‌ای برای کشف آرام، شخصی و آگاهانهٔ عطر.",
  alternates: { canonical: "/about" },
};
export default function AboutPage() {
  return <MaisonPage kicker="THE FERTINI — OUR POINT OF VIEW" title="سکوتِ تصویر، حضورِ رایحه."
    lead="FERTINI تلاشی است برای دیدن عطر فراتر از یک کالا؛ تجربه‌ای میان خاطره، انتخاب و زیبایی.">
    <div className="maison-page__feature-photo"><Image fill sizes="(min-width: 900px) 80vw, 100vw" src="/maison/dark.jpg" alt="عکاسی تیره و سینمایی شیشه عطر" /></div>
    <MaisonSection number="01" title="نگاه ما">
      <p>در یک گالری خوب، فاصله و سکوت به اندازهٔ خود اثر اهمیت دارند. ما همین نگاه را به معرفی عطر نزدیک کرده‌ایم: عکس‌هایی برای دیدن جزئیات، توضیحاتی روشن و فضایی آرام برای انتخاب.</p>
    </MaisonSection>
    <MaisonSection number="02" title="انتخاب، بدون شتاب">
      <p>به باور ما هیچ رایحه‌ای برای همه مناسب نیست. هدف از این مجموعه، آشناشدن با شخصیت عطرها و کمک به انتخابی است که با سلیقهٔ شخصی هماهنگ باشد.</p>
    </MaisonSection>
  </MaisonPage>;
}
