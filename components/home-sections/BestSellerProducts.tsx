"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/* eyebrow لاتین ریز بالای عنوان */
const HEADING_EYEBROW = "CHAPTER 02";

/* عنوان فارسی */
const HEADING_TITLE = "جدیدترین‌ها";

/* رنگ خط عمودی و چپتر */
const ORNAMENT_COLOR = "#DAD6D0";

/* ease خط: دو سر نرم تا کشیده شدن دیده شود */
const LINE_EASE = "power2.inOut";
const LINE_DURATION = 0.9;

/* ease متن‌ها */
const TEXT_EASE = "power2.out";

/* زمان‌بندی گام‌ها */
const CHAPTER_DURATION = 0.35;
const CHAPTER_STAGGER = 0.035;
const TITLE_DURATION = 0.5;
const TITLE_STAGGER = 0.07;

/* کارت‌های محصول */
const FEATURED_DURATION = 0.7;
const SMALL_DURATION = 0.6;
const CARD_OVERLAP = 0.45;

/* فاصله‌ی مکث بین گام‌ها */
const STEP_GAP = 0.06;

/**
 * فونت لاتین اجباری برای eyebrow.
 * فونت‌های فارسی معمولاً ارقام لاتین را با گلیف ارقام فارسی جایگزین می‌کنند،
 * پس برای «02» باید فونت و ویژگی‌های عددی را روی همین عنصر override کنیم.
 */
const LATIN_FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, system-ui, sans-serif';

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function getImageUrl(product: any) {
  if (!product) return "/placeholder-product.jpg";

  if (product?.main_image) {
    if (product.main_image.startsWith("http")) return product.main_image;
    return `${API_BASE_URL}${product.main_image}`;
  }

  if (product?.images?.length > 0) {
    const imageUrl = product.images[0]?.image_url || product.images[0]?.url;
    if (imageUrl) {
      if (imageUrl.startsWith("http")) return imageUrl;
      return `${API_BASE_URL}${imageUrl}`;
    }
  }

  const variantWithImage = product?.variants?.find(
    (variant: any) => variant?.images?.length > 0
  );

  if (variantWithImage) {
    const imageUrl =
      variantWithImage.images[0]?.image_url || variantWithImage.images[0]?.url;

    if (imageUrl) {
      if (imageUrl.startsWith("http")) return imageUrl;
      return `${API_BASE_URL}${imageUrl}`;
    }
  }

  return "/placeholder-product.jpg";
}

function getProductId(product: any) {
  return product?.id ?? null;
}

function getProductName(product: any) {
  return product?.name || product?.title || "نام محصول";
}
/* تاریخ ساخت را از کلیدهای رایج API می‌خواند */
function getCreatedTime(product: any) {
  const raw =
    product?.created_at ??
    product?.createdAt ??
    product?.created ??
    product?.date_created ??
    null;

  if (raw) {
    const time = new Date(raw).getTime();
    if (!Number.isNaN(time)) return time;
  }

  // fallback: id عددی بزرگ‌تر = جدیدتر
  const numericId = Number(product?.id);
  return Number.isFinite(numericId) ? numericId : 0;
}

/* همیشه ۶ محصول آخر (جدیدترین) */
function getLatestProducts(items: any[], count = 6) {
  if (!Array.isArray(items)) return [];

  return [...items]
    .sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
    .slice(0, count);
}


function splitProducts(products: any[]) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      firstFeaturedProduct: null,
      firstGridProducts: [],
      secondFeaturedProduct: null,
      secondGridProducts: [],
    };
  }

  return {
    firstFeaturedProduct: products[0] || null,
    firstGridProducts: products.slice(1, 3),
    secondFeaturedProduct: products[3] || null,
    secondGridProducts: products.slice(4, 6),
  };
}

/* بلاک عنوان: هم‌ساختار با PerfumeAppleTextHero */
function HeadingBlock({
  blockRef,
  lineWrapRef,
  eyebrowRef,
  headingRef,
  titleWords,
  eyebrowChars,
  animated = true,
}: {
  blockRef?: React.RefObject<HTMLDivElement>;
  lineWrapRef?: React.RefObject<HTMLDivElement>;
  eyebrowRef?: React.RefObject<HTMLParagraphElement>;
  headingRef?: React.RefObject<HTMLHeadingElement>;
  titleWords: string[];
  eyebrowChars: string[];
  animated?: boolean;
}) {
  /* در حالت انیمیت‌شده، استیت اولیه (height: 0) همین‌جا در markup است تا فلش اولیه نداشته باشیم */
  const halfLineHeight = animated ? 0 : "50%";

  return (
    <div ref={blockRef} className="text-center">
      {/*
        خط عمودی:
        - رنگ یکدست (بدون گرادیان) تا ابتدا و انتها نازک‌تر دیده نشود
        - عرض واقعی 1px، ظرافت با opacity روی wrapper
        - دو نیمه‌ی absolute که از خط مرکزی لنگر شده‌اند
        - انیمیشن روی height است نه scaleY، پس عرض خط ثابت می‌ماند
      */}
      <div
        ref={lineWrapRef}
        data-line-wrap="true"
        aria-hidden="true"
        className="relative mx-auto mb-5 h-[72px] opacity-80 sm:mb-6 sm:h-[80px] md:mb-7 md:h-[88px]"
        style={{ width: "1px" }}
      >
        <div
          data-top-line="true"
          style={{
            position: "absolute",
            left: 0,
            bottom: "50%",
            width: "100%",
            height: halfLineHeight,
            backgroundColor: ORNAMENT_COLOR,
            willChange: "height",
          }}
        />
        <div
          data-bottom-line="true"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: "100%",
            height: halfLineHeight,
            backgroundColor: ORNAMENT_COLOR,
            willChange: "height",
          }}
        />
      </div>

      {/*
        eyebrow لاتین: فونت لاتین و lining-nums اجباری
        تا فونت فارسی پروژه ارقام «02» را به ارقام فارسی تبدیل نکند.
      */}
      <p
        ref={eyebrowRef}
        dir="ltr"
        lang="en"
        data-eyebrow
        aria-label={HEADING_EYEBROW}
        className="flex items-center justify-center text-[10px] font-light uppercase leading-none tracking-[0.4em] text-[#DAD6D0]"
        style={{
          fontFamily: LATIN_FONT_STACK,
          fontVariantNumeric: "lining-nums tabular-nums",
          fontFeatureSettings: '"lnum" 1, "tnum" 1',
          unicodeBidi: "isolate",
        }}
      >
        {eyebrowChars.map((char, index) => (
          <span
            key={`${char}-${index}`}
            data-eyebrow-char="true"
            aria-hidden="true"
            className="inline-block"
            style={{
              fontFamily: LATIN_FONT_STACK,
              fontVariantNumeric: "lining-nums tabular-nums",
              ...(char === " " ? { width: "0.42em" } : null),
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </p>

      {/* عنوان فارسی */}
      <h2
        ref={headingRef}
        className={[
          "mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:mt-6",
          "font-light leading-[1.5] tracking-[0.05em]",
          "text-[28px] sm:text-[34px] md:text-[40px]",
          "text-[#33383C]",
        ].join(" ")}
      >
        {titleWords.map((word, index) => (
          <span
            key={`${word}-${index}`}
            data-title-word="true"
            className="inline-block"
          >
            {word}
          </span>
        ))}
      </h2>
    </div>
  );
}

function SmallProductCard({ product }: { product: any }) {
  const productName = getProductName(product);
  const productId = getProductId(product);
  const imageUrl = getImageUrl(product);

  return (
    <Link
      href={`/products/${productId}`}
      draggable={false}
      aria-label={productName}
      data-product-card
      data-small-product
      className="group block w-full select-none outline-none focus-visible:ring-1 focus-visible:ring-[#33383C]/20 focus-visible:ring-offset-4"
    >
      <article className="flex flex-col items-center text-center">
        <div
          data-product-mask
          className="relative flex aspect-[4/5] w-full max-w-[88%] items-end justify-center overflow-hidden sm:max-w-[80%] md:max-w-[72%]"
        >
          <Image
            data-product-image
            src={imageUrl}
            alt={productName}
            fill
            unoptimized
            draggable={false}
            className="pointer-events-none object-contain object-bottom transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012]"
          />
        </div>

        <div
          data-product-title
          className="mt-3 flex flex-col items-center text-center"
        >
          <h3 className="relative max-w-full overflow-hidden px-2 text-[12px] font-thin tracking-[0.04em] text-[#33383C] transition-colors duration-500 ease-out group-hover:text-black sm:text-[13px] md:text-[14px]">
            <span className="block truncate">{productName}</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 left-1/2 h-[0.5px] w-0 -translate-x-1/2 bg-[#33383C] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-4"
            />
          </h3>
        </div>
      </article>
    </Link>
  );
}

function FeaturedProductCard({ product }: { product: any }) {
  const productName = getProductName(product);
  const productId = getProductId(product);
  const imageUrl = getImageUrl(product);

  return (
    <Link
      href={`/products/${productId}`}
      draggable={false}
      aria-label={productName}
      data-product-card
      data-featured-product
      className="group mx-auto block w-full max-w-[680px] select-none outline-none focus-visible:ring-1 focus-visible:ring-[#33383C]/20 focus-visible:ring-offset-4"
    >
      <article className="flex flex-col items-center text-center">
        <div
          data-product-mask
          className="relative flex aspect-[4/5] w-full max-w-[92%] items-end justify-center overflow-hidden sm:max-w-[85%] md:max-w-[78%] lg:max-w-[70%]"
        >
          <Image
            data-product-image
            src={imageUrl}
            alt={productName}
            fill
            unoptimized
            draggable={false}
            className="pointer-events-none object-contain object-bottom transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012]"
          />
        </div>

        <div
          data-product-title
          className="mt-4 flex flex-col items-center text-center"
        >
          <h3 className="relative max-w-full overflow-hidden px-2 text-[15px] font-thin tracking-[0.06em] text-[#33383C] transition-colors duration-500 ease-out group-hover:text-black sm:text-[16px] md:text-[18px] lg:text-[20px]">
            <span className="block truncate">{productName}</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-1/2 h-[0.5px] w-0 -translate-x-1/2 bg-[#33383C] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-8"
            />
          </h3>
        </div>
      </article>
    </Link>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[680px] animate-pulse">
      <div className="relative aspect-[4/5] w-full bg-neutral-50/80" />
      <div className="mx-auto mt-4 h-3 w-32 bg-[#33383C]/10" />
    </div>
  );
}

function SmallSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col items-center">
      <div className="relative aspect-[4/5] w-full max-w-[88%] bg-neutral-50/80" />
      <div className="mx-auto mt-3 h-2.5 w-24 bg-[#33383C]/10" />
    </div>
  );
}

export default function BestSellerProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingBlockRef = useRef<HTMLDivElement>(null);
  const lineWrapRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const titleWords = useMemo(() => HEADING_TITLE.split(" "), []);
  const eyebrowChars = useMemo(() => HEADING_EYEBROW.split(""), []);

  const {
    firstFeaturedProduct,
    firstGridProducts,
    secondFeaturedProduct,
    secondGridProducts,
  } = useMemo(() => splitProducts(products), [products]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE_URL}/api/v1/products?limit=6&ordering=-created_at`,
          { cache: "no-store", signal: controller.signal }
        );


        if (!res.ok) {
          throw new Error("خطا در دریافت محصولات");
        }

        const json = await res.json();
        const items =
          json?.data?.items ||
          json?.data?.products ||
          json?.items ||
          json?.products ||
          [];

        if (!ignore) {
          setProducts(getLatestProducts(items, 6));
        }

      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (!ignore) {
          setError(err.message || "خطایی رخ داده است");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const blockEl = headingBlockRef.current;
    const lineWrapEl = lineWrapRef.current;
    const eyebrowEl = eyebrowRef.current;
    const headingEl = headingRef.current;

    if (!sectionEl || !blockEl || !headingEl || loading || error) return;

    const wordEls = Array.from(
      headingEl.querySelectorAll("[data-title-word]")
    ) as HTMLElement[];

    const charEls = eyebrowEl
      ? (Array.from(
        eyebrowEl.querySelectorAll("[data-eyebrow-char]")
      ) as HTMLElement[])
      : [];

    if (!wordEls.length) return;

    const topLineEl =
      lineWrapEl?.querySelector<HTMLElement>("[data-top-line]") ?? null;
    const bottomLineEl =
      lineWrapEl?.querySelector<HTMLElement>("[data-bottom-line]") ?? null;

    const lineEls = [topLineEl, bottomLineEl].filter((el): el is HTMLElement =>
      Boolean(el)
    );

    const cards = gsap.utils.toArray(
      "[data-product-card]",
      sectionEl
    ) as HTMLElement[];

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // در حالت کاهش حرکت، همه چیز فوراً در حالت نهایی
    if (prefersReducedMotion) {
      if (lineEls.length) {
        gsap.set(lineEls, { height: "50%", clearProps: "willChange" });
      }

      gsap.set([...charEls, ...wordEls], {
        opacity: 1,
        y: 0,
        clearProps: "transform",
      });

      gsap.set(cards, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        clearProps: "transform,filter",
      });

      cards.forEach((card) => {
        const mask = card.querySelector("[data-product-mask]");
        const image = card.querySelector("[data-product-image]");
        const title = card.querySelector("[data-product-title]");

        gsap.set([mask, image, title].filter(Boolean), {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          filter: "blur(0px)",
          clearProps: "transform,filter,clipPath",
        });
      });

      return;
    }

    const ctx = gsap.context(() => {
      /**
       * ارتفاع هدف هر نیمه را پیکسلی محاسبه می‌کنیم.
       * انیمیت پیکسلی از تبدیل واحد px↔% در میانه‌ی انیمیشن جلوگیری می‌کند
       * و حرکت را کاملاً یکنواخت نگه می‌دارد.
       */
      const halfHeight = lineWrapEl
        ? lineWrapEl.getBoundingClientRect().height / 2
        : 40;

      // حروف eyebrow: فید ساده بدون جابجایی
      if (charEls.length) {
        gsap.set(charEls, { opacity: 0 });
      }

      // کلمات عنوان
      gsap.set(wordEls, { opacity: 0, y: 8 });

      // آماده‌سازی اولیه‌ی کارت‌های محصول
      cards.forEach((card) => {
        const mask = card.querySelector("[data-product-mask]");
        const image = card.querySelector("[data-product-image]");
        const title = card.querySelector("[data-product-title]");
        const isFeatured = card.hasAttribute("data-featured-product");

        gsap.set(card, {
          opacity: 0,
          y: isFeatured ? 12 : 8,
          filter: "blur(4px)",
        });

        gsap.set(mask, {
          clipPath: isFeatured ? "inset(4% 0% 0% 0%)" : "inset(6% 0% 0% 0%)",
        });

        gsap.set(image, { opacity: 0, scale: 1.015 });
        gsap.set(title, { opacity: 0, y: 4 });
      });

      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: blockEl,
          start: "top 82%",
          once: true,
        },
        onComplete: () => {
          /**
           * بعد از پایان، ارتفاع را به درصد برمی‌گردانیم
           * تا در ریسایز و breakpointهای مختلف درست بماند.
           */
          if (lineEls.length) {
            gsap.set(lineEls, { height: "50%", clearProps: "willChange" });
          }
        },
      });

      /**
       * توالی کاملاً پشت‌سرهم است:
       * موقعیت ">" یعنی «بعد از پایان تمام تویین قبلی»،
       * که در تویین‌های stagger شامل آخرین المان هم می‌شود.
       */

      // گام ۱ — خط از مرکز به بالا و پایین کشیده می‌شود
      if (lineEls.length) {
        mainTl.to(
          lineEls,
          {
            height: halfHeight,
            duration: LINE_DURATION,
            ease: LINE_EASE,
          },
          0
        );
      }

      // گام ۲ — حروف CHAPTER 02 یکی‌یکی از چپ فید می‌شوند
      if (charEls.length) {
        mainTl.to(
          charEls,
          {
            opacity: 1,
            duration: CHAPTER_DURATION,
            stagger: { each: CHAPTER_STAGGER, from: "start" },
            ease: "power1.out",
          },
          `>${STEP_GAP}`
        );
      }

      // گام ۳ — عنوان فارسی، کلمه به کلمه
      mainTl.to(
        wordEls,
        {
          opacity: 1,
          y: 0,
          duration: TITLE_DURATION,
          stagger: TITLE_STAGGER,
          ease: TEXT_EASE,
        },
        `>${STEP_GAP}`
      );

      // گام ۴ — کارت‌های محصول، متوالی و با هم‌پوشانی نرم
      cards.forEach((card, index) => {
        const mask = card.querySelector("[data-product-mask]");
        const image = card.querySelector("[data-product-image]");
        const title = card.querySelector("[data-product-title]");
        const isFeatured = card.hasAttribute("data-featured-product");
        const duration = isFeatured ? FEATURED_DURATION : SMALL_DURATION;

        const itemTl = gsap.timeline({
          defaults: { ease: TEXT_EASE },
        });

        itemTl
          .to(card, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration,
          })
          .to(mask, { clipPath: "inset(0% 0% 0% 0%)", duration }, "<")
          .to(image, { opacity: 1, scale: 1, duration }, "<")
          .to(title, { opacity: 1, y: 0, duration: 0.4 }, "-=0.4");

        mainTl.add(
          itemTl,
          index === 0 ? `>${STEP_GAP}` : `-=${CARD_OVERLAP}`
        );
      });
    }, sectionEl);

    return () => {
      ctx.revert();
    };
  }, [loading, error, products.length]);

  if (loading) {
    return (
      <section
        dir="rtl"
        className="w-full overflow-hidden bg-[#F8F8F8] py-16 sm:py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 md:px-12">
          <div className="mb-24 sm:mb-32">
            <HeadingBlock
              titleWords={titleWords}
              eyebrowChars={eyebrowChars}
              animated={false}
            />
          </div>

          <div className="mb-20">
            <FeaturedSkeleton />
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-16 sm:gap-x-12">
            <SmallSkeleton />
            <SmallSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (error || !products.length) {
    return (
      <section dir="rtl" className="w-full bg-[#F8F8F8] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <HeadingBlock
            titleWords={titleWords}
            eyebrowChars={eyebrowChars}
            animated={false}
          />

          <p className="mt-6 text-center text-[11px] font-extralight text-[#33383C]/40">
            {error ? "خطایی در بارگذاری رخ داده است" : "محصولی یافت نشد"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className="relative w-full overflow-hidden bg-[#F8F8F8] py-16 sm:py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 md:px-12">
        <div className="mb-24 sm:mb-32">
          <HeadingBlock
            blockRef={headingBlockRef}
            lineWrapRef={lineWrapRef}
            eyebrowRef={eyebrowRef}
            headingRef={headingRef}
            titleWords={titleWords}
            eyebrowChars={eyebrowChars}
          />
        </div>

        {firstFeaturedProduct && (
          <div className="mb-20 sm:mb-24">
            <FeaturedProductCard product={firstFeaturedProduct} />
          </div>
        )}

        {firstGridProducts.length > 0 && (
          <div className="grid grid-cols-2 items-start gap-x-8 gap-y-16 sm:gap-x-12 md:gap-x-16">
            {firstGridProducts.map((product, index) => (
              <SmallProductCard
                key={product?.id || product?.slug || index}
                product={product}
              />
            ))}
          </div>
        )}

        {secondFeaturedProduct && (
          <div className="my-20 sm:my-24">
            <FeaturedProductCard product={secondFeaturedProduct} />
          </div>
        )}

        {secondGridProducts.length > 0 && (
          <div className="grid grid-cols-2 items-start gap-x-8 gap-y-16 sm:gap-x-12 md:gap-x-16">
            {secondGridProducts.map((product, index) => (
              <SmallProductCard
                key={product?.id || product?.slug || index}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
