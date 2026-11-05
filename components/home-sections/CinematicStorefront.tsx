"use client";

import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpLeft, MoveLeft, MoveUpLeft } from "lucide-react";
import { parseNumericPrice } from "@/lib/product";

type PerfumePreview = {
  id: string | number;
  name: string;
  main_image?: string | null;
  image?: string | null;
  min_price?: number | string | null;
};
const images = {
  hero: "/maison/hero.jpg", portrait: "/maison/portrait.jpg",
  noir: "/maison/dark.jpg", mineral: "/maison/woody.jpg",
  floral: "/maison/floral.jpg", amber: "/maison/amber.jpg",
};
const chapters = [
  { no:"01", english:"THE MINERAL", title:"چوبی و دودی", sub:"سکوتِ عمیق", image:images.mineral, classes:"maison-chapter--first" },
  { no:"02", english:"THE FLORAL", title:"گلی و لطیف", sub:"حضورِ بی‌وزن", image:images.floral, classes:"maison-chapter--second" },
  { no:"03", english:"THE AMBER", title:"گرم و شرقی", sub:"ردی ماندگار", image:images.amber, classes:"maison-chapter--third" },
];

function SmallLink({ href, children, light = false }: { href:string; children:React.ReactNode; light?:boolean }) {
  return <Link href={href} className={"maison-link " + (light ? "maison-link--light" : "")}>
    <span>{children}</span><ArrowUpLeft aria-hidden="true" size={18} strokeWidth={1.1}/>
  </Link>;
}

function normalizeProductImage(product: PerfumePreview): string | null {
  const raw = product.main_image || product.image || "";
  if (!raw) return null;
  if (raw.startsWith("/") || raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  return "/" + raw;
}

export default function CinematicStorefront() {
  const mainRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<PerfumePreview[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/products?page=1&limit=4", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Product feed unavailable");
        const json = await response.json();
        if (json?.success === false) throw new Error("Invalid product feed");
        return Array.isArray(json?.data?.items) ? json.data.items as PerfumePreview[] : [];
      })
      .then(items => {
        if (controller.signal.aborted) return;
        setProducts(items.slice(0, 4));
        setCatalogStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setCatalogStatus("unavailable"); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const animations: gsap.core.Animation[] = [];
      let heroPlayed = false;
      const startHero = () => {
        if (heroPlayed) return;
        heroPlayed = true;
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline.fromTo(".maison-hero__image img",
          { scale: 1.105, opacity: .86 }, { scale: 1, opacity: 1, duration: 2.45, ease: "power2.out" }, 0)
          .fromTo(".maison-hero__copy [data-hero-line]",
            { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .95, stagger: .16, clearProps: "transform,opacity" }, .35)
          .fromTo(".maison-hero__edge", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "power3.inOut" }, .36);
        animations.push(timeline);
      };
      const introSeen = (() => {
        try { return window.sessionStorage.getItem("maison:intro:seen:v2") === "1"; }
        catch { return true; }
      })();
      if (introSeen) startHero();
      else window.addEventListener("maison:intro:complete", startHero, { once: true });
      const fallback = window.setTimeout(startHero, 4200);

      const nodes = gsap.utils.toArray<HTMLElement>("[data-maison-motion]", main);
      nodes.forEach((node, i) => {
        const mode = node.dataset.maisonMotion;
        const show = () => {
          if (mode === "mask") {
            animations.push(gsap.fromTo(node,
              { clipPath: "inset(0 0 14% 0)", opacity: .8 },
              { clipPath: "inset(0 0 0% 0)", opacity: 1, duration: 1.35, ease: "power3.out", clearProps: "clipPath,opacity" }));
            const picture = node.querySelector("img");
            if (picture) animations.push(gsap.fromTo(picture,
              { scale: 1.085 }, { scale: 1, duration: 2.1, ease: "power2.out", clearProps: "transform" }));
          } else if (mode === "stagger") {
            const children = [...node.children];
            animations.push(gsap.fromTo(children,
              { y: 26, autoAlpha: .55 }, { y: 0, autoAlpha: 1, duration: .85, stagger: .115, ease: "power3.out", clearProps: "transform,opacity,visibility" }));
          } else if (mode === "line") {
            animations.push(gsap.fromTo(node, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut", clearProps: "transform" }));
          } else if (mode === "side") {
            animations.push(gsap.fromTo(node, { x: i % 2 ? -38 : 38, autoAlpha: .65 },
              { x: 0, autoAlpha: 1, duration: 1.15, ease: "power3.out", clearProps: "transform,opacity,visibility" }));
          } else {
            animations.push(gsap.fromTo(node, { y: 30, autoAlpha: .65 },
              { y: 0, autoAlpha: 1, duration: .95, ease: "power3.out", clearProps: "transform,opacity,visibility" }));
          }
        };
        ScrollTrigger.create({ trigger: node, start: "top 91%", once: true, onEnter: show });
      });
      return () => {
        window.clearTimeout(fallback);
        window.removeEventListener("maison:intro:complete", startHero);
        animations.forEach(animation => animation.kill());
      };
    }, main);
    return () => context.revert();
  }, []);

  return <main ref={mainRef} id="main-content" className="maison-home">
    <section className="maison-hero" aria-labelledby="maison-hero-title">
      <div className="maison-hero__image">
        <Image fill priority sizes="(min-width: 900px) 61vw, 100vw" src={images.hero}
          alt="عکاسی سینمایی از شیشه عطر و گلبرگ‌های تیره" className="maison-object-fit" />
        <span className="maison-hero__image-index" lang="en" dir="ltr">STUDY Nº 001 — FRAGRANCE</span>
        <span className="maison-hero__vertical" lang="en" dir="ltr">MAISON / VISUAL ARCHIVE</span>
      </div>
      <div className="maison-hero__content">
        <div className="maison-hero__edge" aria-hidden="true" />
        <div className="maison-hero__copy">
          <span data-hero-line className="maison-kicker" lang="en" dir="ltr">THE ART OF BEING REMEMBERED</span>
          <h1 data-hero-line id="maison-hero-title">رایحه،<br />شکل دیگری<br />از <em>حضور.</em></h1>
          <p data-hero-line>مجموعه‌ای برای کسانی که به‌جای جلب توجه، ردِ خود را به جا می‌گذارند.</p>
          <div data-hero-line><SmallLink href="/products">ورود به گالری عطرها</SmallLink></div>
        </div>
        <div className="maison-hero__foot" lang="en" dir="ltr"><span>01 / 05</span><span>SCROLL TO EXPLORE</span></div>
      </div>
    </section>

    <section className="maison-manifesto maison-wide" aria-labelledby="maison-manifesto-title">
      <div className="maison-manifesto__number" lang="en">I.</div>
      <div data-maison-motion="stagger">
        <p className="maison-kicker" lang="en" dir="ltr">A PERSONAL SIGNATURE / 001</p>
        <h2 id="maison-manifesto-title">زیبایی همیشه<br />در <em>آنچه گفته نمی‌شود</em> است.</h2>
        <p className="maison-manifesto__copy">عطر، بخشی از زبان بی‌کلام ماست. نه برای پرکردن فضا؛ برای ساختن خاطره‌ای که آرام باقی می‌ماند.</p>
      </div>
      <div className="maison-manifesto__aside" lang="en" dir="ltr">AN INVISIBLE<br/>SIGNATURE</div>
    </section>

    <section className="maison-feature maison-wide" aria-labelledby="maison-feature-title">
      <div className="maison-feature__media" data-maison-motion="mask">
        <Image fill sizes="(min-width: 900px) 53vw, 100vw" src={images.portrait} alt="ترکیب هنری چند بطری عطر در نور پنجره" className="maison-object-fit" />
        <span className="maison-photo-label" lang="en" dir="ltr">STILL LIFE — STUDY 02</span>
      </div>
      <div className="maison-feature__copy" data-maison-motion="side">
        <span className="maison-kicker" lang="en" dir="ltr">02 / AN OBJECT OF DESIRE</span>
        <div className="maison-feature__rule" data-maison-motion="line" />
        <h2 id="maison-feature-title">هر بطری،<br/>یک <em>روایت.</em></h2>
        <p>پیش از آنکه رایحه را بشناسیم، نور روی شیشه، بافت و سکوتِ یک تصویر ما را به دنیای آن دعوت می‌کند.</p>
        <SmallLink href="/products">کشف مجموعه</SmallLink>
      </div>
      <span className="maison-feature__ghost" lang="en" dir="ltr" aria-hidden="true">ÉTUDE</span>
    </section>

    <section id="collection" className="maison-archive maison-wide" aria-labelledby="maison-archive-title">
      <div className="maison-section-heading" data-maison-motion="stagger">
        <span className="maison-kicker" lang="en" dir="ltr">03 / THE OLFACTIVE INDEX</span>
        <h2 id="maison-archive-title">سه جهان،<br/><em>بی‌نهایت احساس.</em></h2>
        <p>از سکوتِ چوب تا لطافتِ گل؛ مسیری برای یافتن شخصیت رایحهٔ خود.</p>
      </div>
      <div className="maison-chapters">
        {chapters.map((item,index) => (
          <Link href="/products" key={item.no} className={"maison-chapter " + item.classes} aria-label={"مشاهدهٔ مجموعه: " + item.title}>
            <div className="maison-chapter__image" data-maison-motion="mask">
              <Image fill sizes="(min-width: 900px) 30vw, (min-width: 600px) 48vw, 100vw" src={item.image} alt={"تصویر روایی عطرهای " + item.title} className="maison-object-fit" />
              <span className="maison-chapter__index" lang="en" dir="ltr">{item.no} / 03</span>
            </div>
            <div className="maison-chapter__name">
              <div><span lang="en" dir="ltr">{item.english}</span><h3>{item.title}</h3><p>{item.sub}</p></div>
              <ArrowUpLeft size={18} strokeWidth={1.1} aria-hidden="true" />
            </div>
            {index === 1 && <span className="maison-chapter__accent" lang="en">SCENT NOTE</span>}
          </Link>
        ))}
      </div>
    </section>

    <section className="maison-film" aria-labelledby="maison-film-title">
      <div className="maison-film__image" data-maison-motion="mask">
        <Image fill sizes="100vw" src={images.noir} alt="پرترهٔ سینمایی از شیشه عطر در نور دودی و تاریک" className="maison-object-fit" />
      </div>
      <div className="maison-film__veil" aria-hidden="true"/>
      <div className="maison-film__copy" data-maison-motion="side">
        <span className="maison-kicker" lang="en" dir="ltr">04 / THE QUIET PRESENCE</span>
        <h2 id="maison-film-title">حضور،<br/><em>بدون اغراق.</em></h2>
        <p>رایحه‌ای که با گذشت زمان، بیشتر از تصویر در ذهن باقی می‌ماند.</p>
        <SmallLink light href="/products">تمام عطرها</SmallLink>
      </div>
      <span className="maison-film__mark" lang="en" dir="ltr">MAISON — NOTES ON SILENCE</span>
    </section>

    <section className="maison-selection maison-wide" aria-labelledby="maison-selection-title">
      <div className="maison-selection__head" data-maison-motion="stagger">
        <span className="maison-kicker" lang="en" dir="ltr">05 / THE CURATED EDIT</span>
        <div><h2 id="maison-selection-title">منتخب گالری</h2><SmallLink href="/products">دیدن تمام مجموعه</SmallLink></div>
      </div>
      {products.length ? (
        <div className="maison-selection__grid" data-maison-motion="stagger">
          {products.map((product,index) => {
            const photo=normalizeProductImage(product);
            const price=parseNumericPrice(product.min_price);
            return <Link href={"/products/"+product.id} className="maison-selection__card" key={product.id}>
              <div className="maison-selection__photo">
                {photo ? <Image fill sizes="(min-width: 900px) 24vw, (min-width: 600px) 45vw, 70vw" src={photo}
                  alt={product.name} className="maison-object-fit" /> : <span className="maison-selection__photo-fallback" lang="en">MAISON</span>}
                <span lang="en">EDITION {String(index+1).padStart(2,"0")}</span>
              </div>
              <div className="maison-selection__meta"><div><h3>{product.name}</h3><p>{price && price>0 ? price.toLocaleString("fa-IR")+" تومان" : "مشاهدهٔ جزئیات"}</p></div><ArrowUpLeft size={19} strokeWidth={1.1}/></div>
            </Link>;
          })}
        </div>
      ) : <div className="maison-selection__empty">
        <div className="maison-selection__empty-image" data-maison-motion="mask">
          <Image fill sizes="(min-width: 900px) 44vw, 100vw" src={images.amber} alt="بطری عطر در نور گرم و پس‌زمینه روشن" className="maison-object-fit" />
        </div>
        <div className="maison-selection__empty-copy" data-maison-motion="side">
          <span className="maison-kicker" lang="en" dir="ltr">THE FRAGRANCE COLLECTION</span>
          <h3>یک عطر،<br/><em>یک امضا.</em></h3>
          <p>{catalogStatus === "loading" ? "در حال آماده‌کردن مجموعهٔ عطرها…" : catalogStatus === "unavailable" ? "ارتباط با فهرست محصولات برقرار نشد؛ مجموعه را از صفحه فروشگاه بررسی کنید." : "مجموعهٔ کامل عطرها را در گالری مشاهده کنید."}</p>
          <SmallLink href="/products">ورود به کالکشن</SmallLink>
        </div>
      </div>}
    </section>

    <section className="maison-journal maison-wide" aria-labelledby="maison-journal-title">
      <div className="maison-journal__head" data-maison-motion="stagger">
        <span className="maison-kicker" lang="en" dir="ltr">THE MAISON JOURNAL / 06</span>
        <h2 id="maison-journal-title">فراتر از بطری.<br/><em>هنر شناخت رایحه.</em></h2>
        <p>داستان‌ها، جزئیات و یادداشت‌هایی دربارهٔ جهانی که انتخاب عطر را به تجربه‌ای شخصی تبدیل می‌کند.</p>
        <SmallLink href="/journal">ورود به ژورنال</SmallLink>
      </div>
      <div className="maison-journal__gallery">
        <div className="maison-journal__photo maison-journal__photo--primary" data-maison-motion="mask">
          <Image fill sizes="(min-width: 900px) 27vw, 65vw" src={images.floral} alt="عطر در ترکیب‌بندی مینیمال با برگ‌ها" className="maison-object-fit"/>
          <span className="maison-photo-label" lang="en">ARCHIVE / 06</span>
        </div>
        <div className="maison-journal__photo maison-journal__photo--secondary" data-maison-motion="mask">
          <Image fill sizes="(min-width: 900px) 21vw, 35vw" src={images.mineral} alt="بطری عطر با نور ملایم روی سطح روشن" className="maison-object-fit"/>
        </div>
      </div>
      <Link href="/journal/how-to-choose-a-fragrance" className="maison-journal__article"><span lang="en">FIELD NOTES — NO. 001</span><span>چگونه رایحهٔ مناسب خود را پیدا کنیم؟</span><MoveUpLeft size={19} strokeWidth={1.1} aria-hidden="true"/></Link>
    </section>

    <section className="maison-values" aria-label="رویکرد مزون">
      <div className="maison-wide maison-values__grid" data-maison-motion="stagger">
        <div><span lang="en">I / CONSIDERED</span><h3>انتخاب آگاهانه</h3><p>فرصتی برای دیدن جزئیات هر رایحه، پیش از تصمیم.</p></div>
        <div><span lang="en">II / PERSONAL</span><h3>سلیقهٔ شخصی</h3><p>جستجو بر اساس حسی که می‌خواهید به‌یاد بماند.</p></div>
        <div><span lang="en">III / TIMELESS</span><h3>زیبایی بی‌زمان</h3><p>گالری‌ای با تمرکز بر ظرافت و سکوت تصویر.</p></div>
      </div>
    </section>
  </main>;
}

export function CinematicFooter() {
  return <footer className="maison-footer" id="site-footer" dir="rtl">
    <div className="maison-wide maison-footer__main">
      <div className="maison-footer__identity">
        <span lang="en" className="maison-kicker" dir="ltr">AN INVISIBLE SIGNATURE</span>
        <Link href="/" className="maison-footer__wordmark" dir="ltr" lang="en">MAISON<span>®</span></Link>
        <p>رایحه‌ای که می‌ماند؛ دور از هیاهو، نزدیک به خاطره.</p>
      </div>
      <nav className="maison-footer__links" aria-label="پیوندهای پایانی">
        <div><h3>کشف</h3><Link href="/products">گالری عطرها</Link><Link href="/journal">ژورنال رایحه</Link><Link href="/about">دربارهٔ مزون</Link></div>
        <div><h3>راهنما</h3><Link href="/contact">ارتباط با ما</Link><Link href="/shipping">ارسال و سفارش</Link><Link href="/privacy">حفظ حریم خصوصی</Link><Link href="/terms">قوانین و مقررات</Link></div>
        <div><h3>حساب</h3><Link href="/account">حساب کاربری</Link><Link href="/cart">سبد خرید</Link><Link href="/login">ورود / ثبت‌نام</Link></div>
      </nav>
    </div>
    <div className="maison-wide maison-footer__bottom"><span>© 2026 MAISON — ALL RIGHTS RESERVED.</span><span lang="en" dir="ltr">THE ART OF BEING REMEMBERED</span><Link href="#main-content">بازگشت به بالا ↑</Link></div>
  </footer>;
}
