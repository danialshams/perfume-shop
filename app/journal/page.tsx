import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { MaisonPage } from "@/components/maison/MaisonContentPage";

export const metadata: Metadata = {
  title: "ژورنال رایحه | MAISON",
  description: "یادداشت‌های مزون درباره شناخت عطر، خانواده‌های بویایی و هنر انتخاب رایحه شخصی.",
  alternates: { canonical: "/journal" },
};
export default function JournalPage() {
  return <MaisonPage kicker="THE MAISON JOURNAL — VOL. 01" title="یادداشت‌هایی از جهان رایحه"
    lead="عطر فقط یک انتخاب نیست؛ بخشی از زبان شخصی ماست. اینجا از جزئیاتی می‌گوییم که انتخاب را آگاهانه‌تر می‌کنند.">
    <Link href="/journal/how-to-choose-a-fragrance" className="maison-journal-page__feature">
      <div className="maison-journal-page__image">
        <Image fill priority sizes="(min-width: 900px) 60vw, 100vw" src="/maison/woody.jpg" alt="بطری عطر در نور طبیعی و پس‌زمینهٔ مینیمال" />
      </div>
      <div className="maison-journal-page__details">
        <span lang="en" dir="ltr">FIELD NOTE / 001</span>
        <h2>چگونه رایحهٔ مناسب خود را پیدا کنیم؟</h2>
        <p>از اولین برخورد با عطر تا شناخت نت‌های پایانی؛ راهی آرام برای رسیدن به انتخاب شخصی.</p>
        <span className="maison-link">خواندن یادداشت <ArrowUpLeft size={18}/></span>
      </div>
    </Link>
    <div className="maison-journal-page__quote" lang="en" dir="ltr">SCENT IS THE INVISIBLE PART OF A MEMORY.</div>
  </MaisonPage>;
}
