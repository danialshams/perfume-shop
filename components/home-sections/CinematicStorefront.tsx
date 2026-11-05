"use client";

import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
import { parseNumericPrice } from "@/lib/product";

type PerfumePreview = {
  id: string | number;
  name: string;
  main_image?: string | null;
  image?: string | null;
  min_price?: number | string | null;
};
const imagery = {
  wide: "/maison/hero.jpg",
  shadow: "/maison/dark.jpg",
  portrait: "/maison/portrait.jpg",
  woods: "/maison/woody.jpg",
  floral: "/maison/floral.jpg",
  amber: "/maison/amber.jpg",
};
const heroFrames = [
  {
    photo: imagery.wide,
    alt: "چیدمان سینمایی شیشه عطر با نور و سایه",
    eyebrow: "FERTINI / THE FRAGRANCE EDITION",
    title: <>رایحه،<br/>شکل دیگری<br/>از <em>حضور.</em></>,
    description: "برای کسانی که به‌جای جلب توجه، ردی ماندگار از خود به جا می‌گذارند.",
  },
  {
    photo: imagery.shadow,
    alt: "عطر در پس‌زمینه دودی و نورپردازی تاریک",
    eyebrow: "FERTINI / NO. 002",
    title: <>زیبایی،<br/>در <em>سکوت</em><br/>ماندگار است.</>,
    description: "روایت‌هایی از شیشه، نور و خاطره؛ برای انتخاب یک امضای شخصی.",
  },
] as const;
const families = [
  { no: "01", title: "چوبی و دودی", english: "WOODY / SMOKY", description: "آرام و عمیق", image: imagery.woods, ratio: "portrait" },
  { no: "02", title: "گلی و شفاف", english: "FLORAL / AIRY", description: "ظریف و روشن", image: imagery.floral, ratio: "square" },
  { no: "03", title: "گرم و شرقی", english: "AMBER / ORIENTAL", description: "گرم و ماندگار", image: imagery.amber, ratio: "portrait" },
];

function isDemoPreview(product: PerfumePreview): boolean {
  return String(product.id).startsWith("demo-");
}
function photoOf(product: PerfumePreview): string | null {
  const photo = product.main_image || product.image;
  if (!photo) return null;
  return photo.startsWith("/") || photo.startsWith("https://") ? photo : "/" + photo;
}
function QuietLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <Link href={href} className={"fertini-quiet-link" + (light ? " fertini-quiet-link--light" : "")}>
    <span>{children}</span><span aria-hidden="true" className="fertini-quiet-link__arrow">←</span>
  </Link>;
}

export default function CinematicStorefront() {
  const mainRef = useRef<HTMLElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const pausedRef = useRef(false);
  const [liveProducts, setLiveProducts] = useState<PerfumePreview[]>([]);
  useEffect(() => {
    let done = false;
    try { done = window.sessionStorage.getItem("fertini:intro:seen:v3") === "1"; }
    catch { done = true; }
    const frame = window.requestAnimationFrame(() => { if (done) setStarted(true); });
    const onComplete = () => setStarted(true);
    window.addEventListener("fertini:intro:complete", onComplete);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("fertini:intro:complete", onComplete); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/products?page=1&limit=4", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data?.data?.items) ? data.data.items as PerfumePreview[] : [];
      })
      .then(items => { if (!controller.signal.aborted) setLiveProducts(items.slice(0,4)); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!started || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current && !document.hidden) setHeroIndex(index => (index + 1) % heroFrames.length);
    }, 9200);
    return () => window.clearInterval(id);
  }, [started]);

  useEffect(() => {
    if (!started || !mainRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(".fertini-hero__copy > *",
        { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .21, ease: "power3.out", clearProps: "opacity,visibility,transform" });
      mainRef.current?.querySelectorAll<HTMLElement>("[data-fertini-scene]").forEach(scene => {
        const type = scene.dataset.fertiniScene;
        const photo = scene.querySelector<HTMLElement>("[data-fertini-photo]");
        const picture = photo?.querySelector("img");
        const words = [...scene.querySelectorAll<HTMLElement>("[data-fertini-line]")];
        const tl = gsap.timeline({ paused: true });
        if (photo) {
          if (type === "stretch") {
            tl.fromTo(photo, { clipPath: "inset(0 44% 0 44%)" },
              { clipPath: "inset(0 0% 0 0%)", duration: 1.8, ease: "power3.inOut", clearProps: "clipPath" }, 0);
            if (picture) tl.fromTo(picture, { scaleX: 1.15, scaleY: 1.04 }, { scaleX: 1, scaleY: 1, duration: 2.2, ease: "power2.out", clearProps: "transform" }, .3);
          } else if (type === "curtain") {
            tl.fromTo(photo, { clipPath: "inset(0 0 100% 0)" },
              { clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "power3.inOut", clearProps: "clipPath" }, 0);
            if (picture) tl.fromTo(picture, { scale: 1.08 }, { scale: 1, duration: 2.35, ease: "power2.out", clearProps: "transform" }, .12);
          } else if (type === "fold") {
            tl.fromTo(photo, { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
              { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.65, ease: "power3.inOut", clearProps: "clipPath" }, 0);
            if (picture) tl.fromTo(picture, { scale: 1.13, xPercent: -3 }, { scale: 1, xPercent: 0, duration: 2.2, ease: "power2.out", clearProps: "transform" }, .15);
          } else {
            tl.fromTo(photo, { autoAlpha: .6, y: 34 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: "power3.out", clearProps: "transform,opacity,visibility" }, 0);
          }
        }
        if (words.length) {
          tl.fromTo(words, { autoAlpha: 0, y: 22 }, {
            autoAlpha: 1, y: 0, duration: .85, stagger: .18, ease: "power3.out",
            clearProps: "transform,opacity,visibility",
          }, photo ? .65 : 0);
        }
        ScrollTrigger.create({ trigger: scene, start: "top 87%", once: true, onEnter: () => tl.play() });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [started]);

  const cards: PerfumePreview[] = liveProducts.length ? liveProducts : FERTINI_DEMOS.map(item => ({
    id: item.id, name: item.name, main_image: item.image, min_price: item.variants[0].price,
  }));

  return <main className="maison-home fertini-home" id="main-content" ref={mainRef}>
    {/* Chapter 01 — editorial hero. Navigation is intentionally quiet. */}
    <section className="fertini-hero" aria-labelledby="fertini-hero-title"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false; }}>
      <div className="fertini-hero__gallery">
        {heroFrames.map((frame,index) =>
          <div key={frame.photo} className={"fertini-hero__image " + (index === heroIndex ? "is-active" : "")} aria-hidden={index !== heroIndex}>
            <Image src={frame.photo} fill priority={index===0} sizes="(min-width:900px) 57vw, 100vw"
              alt={index===heroIndex ? frame.alt : ""} className="fertini-hero__photo" />
          </div>)}
        <span className="fertini-hero__caption" lang="en" dir="ltr">FERTINI / FRAGRANCE EDITORIAL</span>
      </div>
      <div className="fertini-hero__text">
        <div key={heroIndex} className="fertini-hero__copy">
          <span className="maison-kicker" lang="en" dir="ltr">{heroFrames[heroIndex].eyebrow}</span>
          <h1 id="fertini-hero-title">{heroFrames[heroIndex].title}</h1>
          <p>{heroFrames[heroIndex].description}</p>
          <QuietLink href="/products">کشف مجموعه عطرها</QuietLink>
        </div>
        <div className="fertini-hero__controls" role="group" aria-label="اسلایدهای معرفی عطر">
          <span dir="ltr" lang="en">{String(heroIndex+1).padStart(2,"0")} <i/> {String(heroFrames.length).padStart(2,"0")}</span>
          <div>{heroFrames.map((frame,index)=><button type="button" key={frame.eyebrow} onClick={()=>setHeroIndex(index)}
            className={index===heroIndex ? "is-active" : ""} aria-label={"نمایش اسلاید " + (index+1)} aria-pressed={index===heroIndex}><span/></button>)}</div>
        </div>
      </div>
    </section>

    {/* Chapter 02 — one visual story instead of multiple repeated manifesto/feature sections. */}
    <section className="fertini-story maison-wide" data-fertini-scene="stretch" aria-labelledby="fertini-story-title">
      <div className="fertini-story__image" data-fertini-photo>
        <Image src={imagery.portrait} fill sizes="(min-width:900px) 48vw, 100vw" alt="چیدمان بطری‌های عطر در نور لطیف" />
      </div>
      <div className="fertini-story__copy">
        <span className="maison-kicker" lang="en" dir="ltr" data-fertini-line>01 / THE ART OF SCENT</span>
        <h2 id="fertini-story-title" data-fertini-line>یک عطر،<br/><em>یک امضا.</em></h2>
        <p data-fertini-line>گاهی یک خاطره، نه با تصویر که با رایحه بازمی‌گردد. فرتینی فضایی برای دیدن جزئیات و انتخابی بدون شتاب است.</p>
        <div data-fertini-line><QuietLink href="/about">دربارهٔ فرتینی</QuietLink></div>
      </div>
    </section>

    {/* Chapter 03 — three distinct image ratios; actual images are scaled/cropped intentionally. */}
    <section className="fertini-notes maison-wide" aria-labelledby="fertini-notes-title">
      <div className="fertini-notes__heading" data-fertini-scene="rise">
        <span data-fertini-line className="maison-kicker" lang="en" dir="ltr">02 / AN OLFACTIVE ATLAS</span>
        <h2 data-fertini-line id="fertini-notes-title">از کجا آغاز می‌شود؟</h2>
        <p data-fertini-line>سه حال‌وهوا، برای سلیقه‌هایی که شبیه هم نیستند.</p>
      </div>
      <div className="fertini-notes__grid">
        {families.map((family,index)=><Link href="/products" className={"fertini-notes__card fertini-notes__card--"+family.ratio} key={family.no}
            aria-label={"دیدن عطرهای " + family.title} data-fertini-scene={index === 0 ? "curtain" : index === 1 ? "fold" : "stretch"}>
          <div className="fertini-notes__image" data-fertini-photo>
            <Image fill src={family.image} sizes="(min-width:900px) 30vw, 88vw" alt={"عکاسی عطر با شخصیت " + family.title}/>
          </div>
          <div className="fertini-notes__caption">
            <span dir="ltr" lang="en" data-fertini-line>{family.english}</span>
            <h3 data-fertini-line>{family.title}</h3>
            <p data-fertini-line>{family.description}</p>
          </div>
        </Link>)}
      </div>
    </section>

    {/* Chapter 04 — gallery with demo fallback and one journal bridge, not another large section. */}
    <section className="fertini-edit maison-wide" aria-labelledby="fertini-edit-title">
      <div className="fertini-edit__heading" data-fertini-scene="rise">
        <span data-fertini-line className="maison-kicker" lang="en" dir="ltr">03 / OBJECTS OF DESIRE</span>
        <div data-fertini-line><h2 id="fertini-edit-title">منتخب گالری</h2><QuietLink href="/products">تمام عطرها</QuietLink></div>
        {!liveProducts.length && <p data-fertini-line className="fertini-edit__note">تصاویر و محصولات زیر نمونهٔ نمایشی طراحی هستند؛ خرید آن‌ها فعال نیست.</p>}
      </div>
      <div className="fertini-edit__grid">
        {cards.map((product,index)=>{
          const image = photoOf(product);
          const price = parseNumericPrice(product.min_price);
          return <Link href={isDemoPreview(product) ? "/demo/fragrance?item="+product.id : "/products/"+product.id}
            key={product.id} className="fertini-edit__card" data-fertini-scene={index%2===0 ? "stretch" : "curtain"}>
            <div className="fertini-edit__photo" data-fertini-photo>
              {image ? <Image src={image} fill sizes="(min-width:900px) 24vw, 46vw" alt={product.name} /> : <span lang="en">FERTINI</span>}
              {isDemoPreview(product) && <span className="fertini-edit__badge">نمونهٔ نمایشی</span>}
            </div>
            <div className="fertini-edit__label" data-fertini-line><h3>{product.name}</h3><p>{price ? price.toLocaleString("fa-IR")+" تومان" : "جزئیات عطر"}</p></div>
          </Link>;
        })}
      </div>
      <Link href="/journal/how-to-choose-a-fragrance" className="fertini-edit__journal">
        <span lang="en" dir="ltr">FROM THE JOURNAL / 01</span><strong>چطور رایحهٔ خودمان را پیدا کنیم؟</strong><span>مطالعهٔ یادداشت ←</span>
      </Link>
    </section>
  </main>;
}

export function CinematicFooter() {
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
        <span lang="en" className="maison-kicker fertini-footer-reveal" dir="ltr">THE ART OF AN INVISIBLE SIGNATURE</span>
        <Link href="/" className="maison-footer__wordmark" dir="ltr" lang="en">FERTINI<span>®</span></Link>
        <p className="fertini-footer-reveal">هر رایحه، ردِ یک خاطره.</p>
      </div>
      <nav className="maison-footer__links" aria-label="پیوندهای پایانی">
        <div><h3 className="fertini-footer-reveal">کشف</h3><Link className="fertini-footer-reveal" href="/products">مجموعهٔ عطرها</Link><Link className="fertini-footer-reveal" href="/journal">ژورنال</Link><Link className="fertini-footer-reveal" href="/about">دربارهٔ فرتینی</Link></div>
        <div><h3 className="fertini-footer-reveal">راهنما</h3><Link className="fertini-footer-reveal" href="/contact">ارتباط با ما</Link><Link className="fertini-footer-reveal" href="/shipping">ارسال و سفارش</Link><Link className="fertini-footer-reveal" href="/privacy">حفظ حریم خصوصی</Link><Link className="fertini-footer-reveal" href="/terms">قوانین و مقررات</Link></div>
        <div><h3 className="fertini-footer-reveal">حساب</h3><Link className="fertini-footer-reveal" href="/account">حساب کاربری</Link><Link className="fertini-footer-reveal" href="/cart">سبد خرید</Link><Link className="fertini-footer-reveal" href="/login">ورود / ثبت‌نام</Link></div>
      </nav>
    </div>
    <div className="maison-wide maison-footer__bottom"><span className="fertini-footer-reveal">© 2026 FERTINI — ALL RIGHTS RESERVED.</span><span className="fertini-footer-reveal" lang="en" dir="ltr">A STUDY OF SCENT</span><Link className="fertini-footer-reveal" href="#top">بازگشت به بالا ↑</Link></div>
  </footer>;
}
