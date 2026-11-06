import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

export const metadata:Metadata={
 title:"ژورنال رایحه | FERTINI",
 description:"روایت‌های فرتینی دربارهٔ شناخت عطر، خانواده‌های بویایی و انتخاب رایحهٔ شخصی.",
 alternates:{canonical:"/journal"},
};
export default function JournalPage(){
 return <div className="fertini-journal-v5 maison-page">
   <LuxuryNavbar/>
   <main id="main-content">
     <header className="fertini-journal-v5__hero" aria-labelledby="fertini-journal-title">
       <Image src="/fertini/hero-02.svg" fill priority sizes="100vw" alt="شیشه عطر در سایه‌های دودی و نور سینمایی"/>
       <div className="fertini-journal-v5__hero-content">
         <span className="maison-kicker" lang="en" dir="ltr">FERTINI / JOURNAL — VOL. 01</span>
         <h1 id="fertini-journal-title">ژورنال<br/>رایحه.</h1>
         <p>روایت‌هایی دربارهٔ عطر، خاطره و هنر انتخاب.</p>
       </div>
     </header>
     <div className="maison-wide fertini-journal-v5__body">
       <div className="fertini-journal-v5__lead">
         <span lang="en" dir="ltr">FIELD NOTES / 001</span>
         <h2>چطور رایحهٔ<br/>خودمان را پیدا کنیم؟</h2>
         <p>از اولین برخورد با یک عطر تا شناخت نت‌های پایانی؛ راهی آرام برای رسیدن به انتخابی شخصی.</p>
       </div>
       <Link href="/journal/how-to-choose-a-fragrance" className="fertini-journal-v5__article">
         <div><Image src="/fertini/hero-01.svg" fill sizes="(min-width:950px) 60vw,100vw" alt="بطری عطر در نور طبیعی و فضای مینیمال"/></div>
         <span>خواندن مقاله</span>
       </Link>
       <p className="fertini-journal-v5__end" lang="en" dir="ltr">SCENT IS THE INVISIBLE PART OF A MEMORY.</p>
     </div>
   </main>
   <CinematicFooter/>
 </div>;
}
