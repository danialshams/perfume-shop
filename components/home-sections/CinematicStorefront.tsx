"use client";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { FertiniSiteContent } from "@/lib/fertini-site-content";
export { default } from "./FertiniHomeV5";

export function CinematicFooter({ content }:{ content?: FertiniSiteContent } = {}) {
  const pathname=usePathname();
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx=gsap.context(()=>{
      const targets=gsap.utils.toArray<HTMLElement>(".fertini-footer-reveal",ref.current);
      const tl=gsap.timeline({paused:true});
      tl.fromTo(".maison-footer__wordmark",{y:38,autoAlpha:0,letterSpacing:".24em"},
        {y:0,autoAlpha:1,letterSpacing:".08em",duration:1.3,ease:"power3.out",clearProps:"transform,opacity,visibility,letterSpacing"});
      tl.fromTo(targets,{y:19,autoAlpha:0},
        {y:0,autoAlpha:1,stagger:.095,duration:.8,ease:"power3.out",clearProps:"transform,opacity,visibility"},"-=.65");
      ScrollTrigger.create({trigger:ref.current,start:"top 87%",once:true,onEnter:()=>tl.play()});
    },ref);
    return ()=>ctx.revert();
  },[pathname]);
  return <footer className="maison-footer fertini-footer" id="site-footer" dir="rtl" ref={ref}>
    <div className="maison-wide maison-footer__main">
      <div className="maison-footer__identity">
        <span lang="en" className="maison-kicker fertini-footer-reveal" dir="ltr">{content?.footerTagline ?? "THE ART OF AN INVISIBLE SIGNATURE"}</span>
        <Link href="/" className="maison-footer__wordmark" dir="ltr" lang="en">FERTINI<span>®</span></Link>
        <p className="fertini-footer-reveal">{content?.footerCaption ?? "هر رایحه، رد یک خاطره."}</p>
      </div>
      <nav className="maison-footer__links" aria-label="پیوندهای پایانی">
        <div><h3 className="fertini-footer-reveal">کشف</h3><Link className="fertini-footer-reveal" href="/products">مجموعه عطرها</Link><Link className="fertini-footer-reveal" href="/journal">ژورنال</Link><Link className="fertini-footer-reveal" href="/about">درباره فرتینی</Link></div>
        <div><h3 className="fertini-footer-reveal">راهنما</h3><Link className="fertini-footer-reveal" href="/contact">ارتباط با ما</Link><Link className="fertini-footer-reveal" href="/shipping">ارسال و سفارش</Link><Link className="fertini-footer-reveal" href="/privacy">حفظ حریم خصوصی</Link><Link className="fertini-footer-reveal" href="/terms">قوانین و مقررات</Link></div>
        <div><h3 className="fertini-footer-reveal">حساب</h3><Link className="fertini-footer-reveal" href="/account">حساب کاربری</Link><Link className="fertini-footer-reveal" href="/cart">سبد خرید</Link></div>
      </nav>
    </div>
    <div className="maison-wide maison-footer__bottom"><span className="fertini-footer-reveal">© 2026 FERTINI — ALL RIGHTS RESERVED.</span><span className="fertini-footer-reveal" lang="en" dir="ltr">A STUDY OF SCENT</span><Link className="fertini-footer-reveal" href="#top">بازگشت به بالا</Link></div>
  </footer>;
}
