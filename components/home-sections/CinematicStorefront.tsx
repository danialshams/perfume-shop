"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpLeft, MoveLeft } from "lucide-react";
import { parseNumericPrice } from "@/lib/product";

const photo = {
  hero: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1800&q=85",
  portrait: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1200&q=83",
  dark: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1400&q=85",
  amber: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1100&q=83",
  floral: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1100&q=83",
  woody: "https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?auto=format&fit=crop&w=1100&q=83",
};

type PerfumePreview = {
  id: string | number;
  name: string;
  main_image?: string | null;
  image?: string | null;
  min_price?: number | string | null;
};

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div data-ql-reveal className={"ql-reveal " + className}>{children}</div>;
}

export default function CinematicStorefront() {
  const [products, setProducts] = useState<PerfumePreview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/products?limit=4&ordering=-created_at", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw Error("Product feed unavailable");
        return response.json();
      })
      .then(json => {
        const items = Array.isArray(json?.data?.items) ? json.data.items : Array.isArray(json?.data) ? json.data : [];
        if (!controller.signal.aborted) setProducts(items.slice(0, 4));
      })
      .catch(() => { /* Editorial content works without making up product data. */ })
      .finally(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll("[data-ql-reveal]");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    elements.forEach(element => observer.observe(element));
    document.documentElement.classList.add("ql-motion-ready");
    return () => { observer.disconnect(); document.documentElement.classList.remove("ql-motion-ready"); };
  }, []);

  return (
    <main className="ql-main" id="main-content">
      <section className="ql-hero" aria-label="معرفی کالکشن عطر">
        <div className="ql-hero-visual">
          <Image unoptimized priority fill sizes="(min-width: 960px) 58vw, 100vw" src={photo.hero} alt="شیشه عطر در نور سینمایی و فضای تیره" className="ql-hero-image" />
          <div className="ql-image-shade" aria-hidden="true" />
          <div className="ql-visual-stamp" lang="en" dir="ltr"><span>EDITION 01</span><span>THE FRAGRANCE EDIT</span></div>
          <div className="ql-visual-bottom" lang="en" dir="ltr">A WORLD OF SCENT</div>
        </div>
        <div className="ql-hero-copy">
          <span className="ql-eyebrow" lang="en" dir="ltr">MAISON · PRIVATE SELECTION</span>
          <span className="ql-hairline" aria-hidden="true" />
          <h1>رایحه‌ای که<br/><em>می‌ماند.</em></h1>
          <p>مجموعه‌ای دست‌چین از عطرهایی که به‌جای جلب توجه، شخصیت شما را تعریف می‌کنند.</p>
          <Link href="/products" className="ql-link-primary">کشف کالکشن <ArrowLeft size={18} strokeWidth={1.2}/></Link>
          <div className="ql-hero-pagination" aria-hidden="true"><span className="ql-pagination-active"/></div>
          <span className="ql-hero-index" lang="en" dir="ltr">THE ART OF SUBTLETY — 2026</span>
        </div>
      </section>

      <section id="collection" className="ql-container ql-section ql-intro-section">
        <Reveal className="ql-intro-grid">
          <p className="ql-overline" lang="en" dir="ltr">01 — THE CURATION</p>
          <div>
            <h2 className="ql-section-title">یک انتخاب،<br/><em>یک امضا.</em></h2>
            <p className="ql-section-copy">انتخاب عطر، انتخاب یک حس است. ما فضای کشف را ساده، آرام و بی‌حاشیه نگه داشته‌ایم تا تمام توجه روی رایحه باشد.</p>
          </div>
        </Reveal>
      </section>

      <section className="ql-editorial ql-container" aria-label="داستان کالکشن">
        <Reveal className="ql-editorial-image-wrap">
          <Image unoptimized fill sizes="(min-width: 920px) 58vw, 100vw" src={photo.portrait} alt="عطر شیشه‌ای در صحنه‌ای روشن و مینیمال" className="ql-editorial-image"/>
          <span className="ql-photo-index" lang="en" dir="ltr">STILL LIFE / 001</span>
        </Reveal>
        <Reveal className="ql-editorial-text">
          <span className="ql-overline" lang="en" dir="ltr">AN OBJECT OF DESIRE</span>
          <h2>زیبایی در<br/><em>جزئیات است.</em></h2>
          <p>بطری، نور و خاطره. هر عطر یک داستان دارد؛ داستانی که قبل از نخستین اسپری شروع می‌شود.</p>
          <Link href="/products" className="ql-text-link">دیدن مجموعه <ArrowUpLeft size={17} strokeWidth={1.3}/></Link>
        </Reveal>
      </section>

      <section className="ql-section ql-families ql-container" aria-labelledby="ql-family-title">
        <Reveal className="ql-section-head">
          <span className="ql-overline" lang="en" dir="ltr">02 — OLFACTIVE NOTES</span>
          <h2 id="ql-family-title">جهان رایحه‌ها</h2>
          <p>سه حس، سه روایت متفاوت. از اینجا شروع کنید.</p>
        </Reveal>
        <div className="ql-family-grid">
          {[
            { image: photo.woody, name: "چوبی و عمیق", latin: "WOODY / SMOKY", description: "آرام، گرم و ماندگار" },
            { image: photo.floral, name: "گلی و لطیف", latin: "FLORAL / SOFT", description: "روشن، ظریف و آشنا" },
            { image: photo.amber, name: "شرقی و گرم", latin: "AMBER / ORIENTAL", description: "مرموز، غنی و شاعرانه" },
          ].map((family, index) => (
            <Reveal key={family.latin} className="ql-family-reveal">
              <Link href="/products" className="ql-family-card" aria-label={"جستجوی عطرها: " + family.name}>
                <div className="ql-family-image">
                  <Image unoptimized fill sizes="(min-width: 920px) 32vw, (min-width: 600px) 50vw, 100vw" src={family.image} alt={"عکاسی عطر برای گروه " + family.name} className="ql-photo"/>
                  <span className="ql-family-no" lang="en" dir="ltr">0{index + 1}</span>
                </div>
                <div className="ql-family-meta"><div><span lang="en" dir="ltr">{family.latin}</span><h3>{family.name}</h3><p>{family.description}</p></div><ArrowUpLeft size={19} strokeWidth={1.25}/></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="ql-dark-story">
        <div className="ql-dark-image">
          <Image unoptimized fill sizes="100vw" src={photo.dark} alt="شیشه عطر در نور تیره و پس‌زمینه سینمایی" className="ql-photo"/>
        </div>
        <div className="ql-dark-overlay" />
        <Reveal className="ql-dark-content">
          <span className="ql-overline" lang="en" dir="ltr">03 — THE MAISON PHILOSOPHY</span>
          <h2>حضور،<br/><em>بدون اغراق.</em></h2>
          <p>برای لحظه‌هایی که می‌خواهید به‌یادماندنی باشید، نه پرسر‌وصدا.</p>
          <Link href="/products" className="ql-dark-link">کشف عطرها <MoveLeft size={20} strokeWidth={1.3}/></Link>
        </Reveal>
        <span className="ql-dark-credit" lang="en" dir="ltr">MAISON / SCENT STUDIES</span>
      </section>

      <section className="ql-container ql-section ql-products-section" aria-labelledby="ql-products-title">
        <Reveal className="ql-products-heading">
          <div><span className="ql-overline" lang="en" dir="ltr">04 — DISCOVER</span><h2 id="ql-products-title">تازه‌های مجموعه</h2></div>
          <Link href="/products" className="ql-text-link">مشاهده همه <ArrowUpLeft size={16}/></Link>
        </Reveal>
        {products.length > 0 ? (
          <div className="ql-product-grid">
            {products.map((product, index) => {
              const raw = product.main_image || product.image || "";
              const image = raw.startsWith("http") ? raw : raw.startsWith("/") ? raw : raw ? "/" + raw : null;
              return <Reveal key={product.id} className="ql-product-reveal"><Link href={"/products/" + product.id} className="ql-product-card">
                <div className="ql-product-image-frame">{image ? <Image unoptimized fill sizes="(min-width: 900px) 23vw, (min-width: 600px) 44vw, 80vw" src={image} alt={product.name} className="ql-product-image"/> : <div className="ql-product-image-placeholder" aria-hidden="true"/>}<span lang="en" dir="ltr">MAISON / 0{index + 1}</span></div>
                <h3>{product.name}</h3>
                {product.min_price != null && parseNumericPrice(product.min_price) !== null && <p>{parseNumericPrice(product.min_price)?.toLocaleString("fa-IR")} تومان</p>}
              </Link></Reveal>;
            })}
          </div>
        ) : (
          <Reveal className="ql-product-empty">
            <div className="ql-product-empty-photo"><Image unoptimized fill sizes="(min-width: 768px) 32vw, 100vw" src={photo.amber} alt="عطر انتخابی در نور گرم" className="ql-photo"/></div>
            <div><span className="ql-overline" lang="en" dir="ltr">THE COMPLETE COLLECTION</span><h3>تمام رایحه‌ها، یک‌جا.</h3><p>{loaded ? "مجموعه محصولات را از فروشگاه مشاهده کنید." : "در حال دریافت تازه‌های مجموعه…"}</p><Link href="/products" className="ql-text-link">ورود به فروشگاه <ArrowUpLeft size={17}/></Link></div>
          </Reveal>
        )}
      </section>

      <section className="ql-services" aria-label="خدمات فروشگاه">
        <div className="ql-container ql-services-grid">
          <div><span lang="en" dir="ltr">01 / AUTHENTIC</span><strong>انتخاب با دقت</strong><p>تمرکز روی کیفیت و اصالت</p></div>
          <div><span lang="en" dir="ltr">02 / EXPERIENCE</span><strong>تجربه‌ای آرام</strong><p>خرید ساده، شفاف و بی‌دردسر</p></div>
          <div><span lang="en" dir="ltr">03 / SIGNATURE</span><strong>رایحه شخصی شما</strong><p>انتخابی متناسب با سلیقه‌تان</p></div>
        </div>
      </section>
    </main>
  );
}

export function CinematicFooter() {
  return <footer className="ql-footer" dir="rtl">
    <div className="ql-container ql-footer-top"><div className="ql-footer-brand">
      <Link href="/" className="ql-footer-wordmark" lang="en" dir="ltr">MAISON<span>®</span></Link>
      <p>رایحه‌ای که می‌ماند.</p>
    </div><nav aria-label="پیوندهای پایانی" className="ql-footer-links">
      <Link href="/">خانه</Link><Link href="/products">مجموعه عطرها</Link><Link href="/account">حساب من</Link><Link href="/cart">سبد خرید</Link>
    </nav></div>
    <div className="ql-container ql-footer-bottom"><span>© 2026 MAISON — ALL RIGHTS RESERVED</span><span>SCENT IS A PERSONAL STORY.</span></div>
  </footer>;
}
