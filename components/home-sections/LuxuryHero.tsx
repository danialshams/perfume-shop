"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Product = {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  main_image: string;
  min_price: number;
  is_best_seller?: boolean | number;

  variants?: {
    id: number;
    price: number;
    discount_price: number | null;
  }[];
};


/* عنوان اصلی */
const COLLECTION_TITLE = "منتخب کالکشن‌ها";

/* eyebrow لاتین ریز بالای عنوان */
const COLLECTION_EYEBROW = "CHAPTER 01";

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
const PRODUCTS_DURATION = 0.6;

/* فاصله‌ی مکث بین گام‌ها */
const STEP_GAP = 0.06;

/**
 * فونت لاتین اجباری برای eyebrow.
 * فونت‌های فارسی معمولاً ارقام لاتین را با گلیف ارقام فارسی جایگزین می‌کنند،
 * پس برای «01» باید فونت و ویژگی‌های عددی را روی همین عنصر override کنیم.
 */
const LATIN_FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, system-ui, sans-serif';

function ProductCard({
  product,
  movedRef,
}: {
  product: Product;
  movedRef: MutableRefObject<boolean>;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const nameEl = nameRef.current;

    if (!triggerEl || !nameEl) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(nameEl, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    gsap.set(nameEl, { opacity: 0, y: 6 });

    const tl = gsap.timeline({ paused: true });

    tl.to(nameEl, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: TEXT_EASE,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tl.play(0);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px" },
    );

    observer.observe(triggerEl);

    return () => {
      observer.disconnect();
      tl.kill();
    };
  }, []);

  const imageUrl = product.main_image?.startsWith("http")
    ? product.main_image
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.main_image}`;

  return (
    <div
      ref={triggerRef}
      dir="rtl"
      className="mx-auto w-[85vw] max-w-[480px] select-none sm:w-[70vw] md:w-[60vw] lg:w-[500px] xl:w-[540px]"
    >
      <Link
        href={`/product/${product.id}`}
        draggable={false}
        onClick={(e) => {
          if (movedRef.current) {
            e.preventDefault();
          }
        }}
        className="group/card block w-full select-none"
      >
        <div className="relative h-[calc(100dvh-370px)] min-h-[200px] max-h-[480px] w-full sm:h-[calc(100dvh-390px)] md:h-[calc(100dvh-410px)] lg:h-[calc(100dvh-380px)]">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized
            draggable={false}
            className="pointer-events-none object-contain transition-transform duration-[1200ms] ease-out group-hover/card:scale-[1.015]"
          />
        </div>

        <div className="relative z-10 mt-3 text-center sm:mt-4 md:mt-5">
          <h3
            ref={nameRef}
            className="text-[14px] font-light leading-relaxed tracking-[0.04em] text-[#33383C] sm:text-[15px] md:text-[16px] lg:text-[17px] xl:text-[18px]"
          >
            {product.name}
          </h3>
        </div>
      </Link>
    </div>
  );
}

function SliderArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Previous product" : "Next product"}
      className={[
        "group/arrow absolute top-[40%] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full",
        "bg-white/40 text-neutral-800 border border-neutral-100/50 backdrop-blur-md",
        "transition-all duration-[1000ms] ease-out hover:bg-white hover:border-neutral-200",
        "md:flex",
        isPrev ? "left-6 lg:left-12" : "right-6 lg:right-12",
      ].join(" ")}
    >
      <span
        className={[
          "absolute flex items-center justify-center opacity-100 transition-all duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)]",
          isPrev
            ? "rotate-180 group-hover/arrow:-translate-x-4 group-hover/arrow:opacity-0"
            : "group-hover/arrow:translate-x-4 group-hover/arrow:opacity-0",
        ].join(" ")}
      >
        <MdOutlineKeyboardArrowRight className="h-5 w-5 text-neutral-600" />
      </span>

      <span
        className={[
          "absolute flex items-center justify-center opacity-0 transition-all duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover/arrow:opacity-100",
          isPrev
            ? "translate-x-4 rotate-180 group-hover/arrow:translate-x-0"
            : "-translate-x-4 group-hover/arrow:translate-x-0",
        ].join(" ")}
      >
        <MdOutlineKeyboardArrowRight className="h-5 w-5 text-neutral-600" />
      </span>
    </button>
  );
}

export default function PerfumeAppleTextHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const headingAnimatedRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const titleWords = useMemo(() => COLLECTION_TITLE.split(" "), []);
  const eyebrowChars = useMemo(() => COLLECTION_EYEBROW.split(""), []);

  const resetEdgeResistance = () => {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.style.transition = "transform 500ms cubic-bezier(.22,1,.36,1)";
    slider.style.transform = "translate3d(0, 0, 0)";

    window.setTimeout(() => {
      if (!sliderRef.current) return;
      sliderRef.current.style.transition = "";
    }, 510);
  };

  const scrollBySlide = (direction: "prev" | "next") => {
    const slider = sliderRef.current;
    if (!slider) return;

    const maxScroll = slider.scrollWidth - slider.clientWidth;

    const nextScroll =
      slider.scrollLeft +
      slider.clientWidth * (direction === "next" ? 1 : -1);

    slider.scrollTo({
      left: Math.max(0, Math.min(nextScroll, maxScroll)),
      behavior: "smooth",
    });
  };

  const finishDrag = (pointerId?: number) => {
    const slider = sliderRef.current;

    isDraggingRef.current = false;
    setIsDragging(false);
    resetEdgeResistance();

    if (
      slider &&
      typeof pointerId === "number" &&
      slider.hasPointerCapture(pointerId)
    ) {
      slider.releasePointerCapture(pointerId);
    }

    activePointerIdRef.current = null;

    window.setTimeout(() => {
      movedRef.current = false;
    }, 120);
  };
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const params = new URLSearchParams({
          is_best_seller: "1",
          limit: "12",
        });

        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/products?${params.toString()}`;

        const res = await fetch(url, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          console.error("Products API error:", {
            status: res.status,
            url,
            response: json,
          });

          throw new Error(
            json?.message || `خطا در دریافت محصولات: ${res.status}`,
          );
        }

        const bestSellerProducts = Array.isArray(json?.data?.items)
          ? json.data.items.filter(
            (product: Product) =>
              product.is_best_seller === true ||
              product.is_best_seller === 1,
          )
          : [];


        setProducts(bestSellerProducts);
      } catch (error) {
        console.error("Best seller products fetch error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);


  useEffect(() => {
    const headingEl = headingRef.current;
    const sectionEl = sectionRef.current;

    if (!headingEl || !sectionEl) return;

    const lineWrapEl =
      headingEl.querySelector<HTMLElement>("[data-line-wrap]");

    const topLineEl =
      headingEl.querySelector<HTMLElement>("[data-top-line]");

    const bottomLineEl =
      headingEl.querySelector<HTMLElement>("[data-bottom-line]");

    const charEls =
      headingEl.querySelectorAll<HTMLElement>("[data-eyebrow-char]");

    const wordEls =
      headingEl.querySelectorAll<HTMLElement>("[data-title-word]");

    const productsBlockEl =
      containerRef.current?.querySelector<HTMLElement>(".products-block") ??
      null;

    if (!wordEls.length) return;

    const lineEls = [topLineEl, bottomLineEl].filter(
      (el): el is HTMLElement => Boolean(el),
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      if (lineEls.length) {
        gsap.set(lineEls, { height: "50%" });
      }

      gsap.set([...Array.from(charEls), ...Array.from(wordEls)], {
        opacity: 1,
        y: 0,
        clearProps: "transform",
      });

      if (productsBlockEl) {
        gsap.set(productsBlockEl, {
          opacity: 1,
          y: 0,
          clearProps: "transform",
        });
      }

      headingAnimatedRef.current = true;
      return;
    }

    const halfHeight = lineWrapEl
      ? lineWrapEl.getBoundingClientRect().height / 2
      : 40;

    if (charEls.length) {
      gsap.set(charEls, { opacity: 0 });
    }

    gsap.set(wordEls, { opacity: 0, y: 8 });

    if (productsBlockEl) {
      gsap.set(productsBlockEl, { opacity: 0, y: 16 });
    }

    const mainTl = gsap.timeline({
      paused: true,
      onComplete: () => {
        headingAnimatedRef.current = true;

        if (lineEls.length) {
          gsap.set(lineEls, {
            height: "50%",
            clearProps: "willChange",
          });
        }
      },
    });

    if (lineEls.length) {
      mainTl.to(
        lineEls,
        {
          height: halfHeight,
          duration: LINE_DURATION,
          ease: LINE_EASE,
        },
        0,
      );
    }

    if (charEls.length) {
      mainTl.to(
        charEls,
        {
          opacity: 1,
          duration: CHAPTER_DURATION,
          stagger: { each: CHAPTER_STAGGER, from: "start" },
          ease: "power1.out",
        },
        `>${STEP_GAP}`,
      );
    }

    mainTl.to(
      wordEls,
      {
        opacity: 1,
        y: 0,
        duration: TITLE_DURATION,
        stagger: TITLE_STAGGER,
        ease: TEXT_EASE,
      },
      `>${STEP_GAP}`,
    );

    if (productsBlockEl) {
      mainTl.to(
        productsBlockEl,
        {
          opacity: 1,
          y: 0,
          duration: PRODUCTS_DURATION,
          ease: TEXT_EASE,
        },
        `>${STEP_GAP}`,
      );
    }

    let started = false;

    const play = () => {
      if (started) return;

      started = true;
      mainTl.play(0);
    };

    const isInView = () => {
      const rect = sectionEl.getBoundingClientRect();

      return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
    };

    let rafId = 0;
    let observer: IntersectionObserver | null = null;

    if (isInView()) {
      rafId = window.requestAnimationFrame(play);
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
            play();
            observer?.disconnect();
          }
        },
        { threshold: [0, 0.15, 0.3], rootMargin: "0px" },
      );

      observer.observe(sectionEl);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      mainTl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className="relative h-[100dvh] w-full overflow-hidden"
    >
      <div
        ref={containerRef}
        className="mx-auto flex h-full max-w-[1600px] flex-col justify-between px-6 py-10 sm:px-8 sm:py-12 md:px-12 md:py-16"
      >
        <div
          ref={headingRef}
          className="relative z-10 mt-2 mb-6 shrink-0 text-center sm:mt-3 sm:mb-8 md:mb-10"
        >
          <div
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
                height: 0,
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
                height: 0,
                backgroundColor: ORNAMENT_COLOR,
                willChange: "height",
              }}
            />
          </div>

          <p
            dir="ltr"
            lang="en"
            aria-label={COLLECTION_EYEBROW}
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

          <h2
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

        <div className="products-block relative flex w-full flex-1 items-center justify-center overflow-hidden">
          <SliderArrow direction="prev" onClick={() => scrollBySlide("prev")} />

          <SliderArrow direction="next" onClick={() => scrollBySlide("next")} />

          <div className="w-full overflow-hidden">
            <div
              ref={sliderRef}
              dir="ltr"
              className={[
                "flex overflow-x-auto overflow-y-hidden select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                "touch-pan-y items-center",
                isDragging
                  ? "cursor-grabbing snap-none scroll-auto"
                  : "cursor-grab snap-x snap-mandatory scroll-smooth",
              ].join(" ")}
              style={{ WebkitOverflowScrolling: "touch" }}
              onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
                const slider = sliderRef.current;
                if (!slider) return;

                isDraggingRef.current = true;
                setIsDragging(true);

                activePointerIdRef.current = e.pointerId;
                pointerStartXRef.current = e.clientX;
                scrollStartRef.current = slider.scrollLeft;
                movedRef.current = false;

                slider.style.transition = "";
                slider.style.transform = "translate3d(0, 0, 0)";
                slider.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e: ReactPointerEvent<HTMLDivElement>) => {
                const slider = sliderRef.current;

                if (
                  !slider ||
                  !isDraggingRef.current ||
                  activePointerIdRef.current !== e.pointerId
                ) {
                  return;
                }

                const diff = e.clientX - pointerStartXRef.current;
                const maxScroll = slider.scrollWidth - slider.clientWidth;
                const targetScroll = scrollStartRef.current - diff;

                if (Math.abs(diff) > 4) {
                  movedRef.current = true;
                }

                if (targetScroll < 0) {
                  slider.scrollLeft = 0;

                  slider.style.transform = `translate3d(${Math.min(
                    30,
                    Math.abs(targetScroll) * 0.15,
                  )}px, 0, 0)`;

                  return;
                }

                if (targetScroll > maxScroll) {
                  slider.scrollLeft = maxScroll;

                  slider.style.transform = `translate3d(-${Math.min(
                    30,
                    Math.abs(targetScroll - maxScroll) * 0.15,
                  )}px, 0, 0)`;

                  return;
                }

                slider.style.transform = "translate3d(0, 0, 0)";
                slider.scrollLeft = targetScroll;
              }}
              onPointerUp={(e: ReactPointerEvent<HTMLDivElement>) => {
                finishDrag(e.pointerId);
              }}
              onPointerCancel={(e: ReactPointerEvent<HTMLDivElement>) => {
                finishDrag(e.pointerId);
              }}
              onPointerLeave={(e: ReactPointerEvent<HTMLDivElement>) => {
                if (isDraggingRef.current) {
                  finishDrag(e.pointerId);
                }
              }}
              onDragStart={(e) => {
                e.preventDefault();
              }}
            >
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex w-full min-w-full shrink-0 snap-center items-center justify-center px-[8vw] [scroll-snap-stop:always] sm:px-[10vw] md:px-[8vw] lg:px-[4vw]"
                  >
                    <div className="mx-auto w-[85vw] max-w-[480px] sm:w-[70vw] md:w-[60vw] lg:w-[500px] xl:w-[540px]">
                      <div className="h-[calc(100dvh-370px)] min-h-[200px] max-h-[480px] w-full animate-pulse bg-neutral-100 sm:h-[calc(100dvh-390px)] md:h-[calc(100dvh-410px)] lg:h-[calc(100dvh-380px)]" />

                      <div className="mx-auto mt-4 h-4 w-32 animate-pulse bg-neutral-100" />
                    </div>
                  </div>
                ))}

              {!loading &&
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex w-full min-w-full shrink-0 snap-center items-center justify-center px-[8vw] [scroll-snap-stop:always] sm:px-[10vw] md:px-[8vw] lg:px-[4vw]"
                  >
                    <ProductCard product={product} movedRef={movedRef} />
                  </div>
                ))}

              {!loading && products.length === 0 && (
                <div className="flex w-full min-w-full items-center justify-center py-16 text-center text-sm font-light text-neutral-500">
                  در حال حاضر محصول پرفروشی برای نمایش وجود ندارد.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
