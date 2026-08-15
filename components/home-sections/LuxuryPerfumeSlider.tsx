"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import Link from "next/link";
import gsap from "gsap";

type Product = {
  id: number;
  name: string;
  slug?: string;
  main_image?: string | null;
  image?: string | null;
};

type SliderApiItem = {
  id: number;
  title?: string;
  link?: unknown;
  image_url?: string | null;
  product_id?: number;
  product?: Product | null;
};


type Slide = {
  id: number;
  image: string;
  link: string;
};

const AUTOPLAY_DURATION = 5000;

// اگر ارتفاع نوبار در هر سایز فرق داشت، فقط همین عددها را تنظیم کن.
const MOBILE_NAVBAR_HEIGHT = 72;
const SMALL_TABLET_NAVBAR_HEIGHT = 76;
const TABLET_NAVBAR_HEIGHT = 80;
const DESKTOP_NAVBAR_HEIGHT = 88;

// mt-4 یعنی 16px و خود dot حدود 10px است.
const DOTS_SPACE = 26;

// برای اینکه کل اسلایدر کمی از پایین ویوپورت فاصله بگیرد.
const BOTTOM_SAFE_GAP = 14;

export default function LuxuryPerfumeSlider() {
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const dotColor = "#b8bcc4";
  const activeColor = "#111827";
  const trackColor = "rgba(17,24,39,.15)";

  const goToSlide = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  };

  useEffect(() => {
    const fetchHomeSlides = async () => {
      try {
        setLoadingSlides(true);

        const [slidersRes, productsRes] = await Promise.all([
          fetch("/api/v1/sliders?placement=HOME", {
            cache: "no-store",
          }),
          fetch("/api/v1/products", {
            cache: "no-store",
          }),
        ]);

        const slidersJson = await slidersRes.json();
        const productsJson = await productsRes.json();

        const sliders: SliderApiItem[] = Array.isArray(slidersJson?.data)
          ? slidersJson.data
          : Array.isArray(slidersJson?.data?.items)
            ? slidersJson.data.items
            : [];

        const products: Product[] = Array.isArray(productsJson?.data?.items)
          ? productsJson.data.items
          : Array.isArray(productsJson?.data)
            ? productsJson.data
            : [];

        const productsMap = new Map<number, Product>();

        products.forEach((product) => {
          productsMap.set(product.id, product);
        });

        const mappedSlides: Slide[] = sliders
          .map((slider) => {
            const product =
              slider.product ??
              productsMap.get(Number(slider.product_id)) ??
              null;

            const productId = product?.id ?? slider.product_id;

            const safeSliderLink =
              typeof slider.link === "string" && slider.link.trim().length > 0
                ? slider.link.trim()
                : null;

            return {
              id: slider.id,
              image:
                product?.main_image ??
                product?.image ??
                slider.image_url ??
                "/images/perfume-1.jpg",
              link:
                safeSliderLink ??
                (product?.slug
                  ? `/products/${product.slug}`
                  : productId
                    ? `/products/${productId}`
                    : "/products"),
            };
          })
          .filter(Boolean);

        setSlides(mappedSlides);
      } catch (error) {
        console.error(error);
        setSlides([]);
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchHomeSlides();
  }, []);

  // فقط انیمیشن تصاویر با GSAP
  useEffect(() => {
    if (!slides.length) return;

    imageRefs.current.forEach((image, index) => {
      if (!image) return;

      if (index === activeIndex) {
        gsap.to(image, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
        });
      } else {
        gsap.to(image, {
          autoAlpha: 0,
          scale: 1.03,
          duration: 0.9,
          ease: "power3.out",
        });
      }
    });
  }, [activeIndex, slides]);

  // autoplay با یک تایمر ساده و دقیق (به جای onComplete داخل GSAP)
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [activeIndex, slides]);

  const sliderVars = {
    "--slider-mobile-navbar-height": `${MOBILE_NAVBAR_HEIGHT}px`,
    "--slider-small-tablet-navbar-height": `${SMALL_TABLET_NAVBAR_HEIGHT}px`,
    "--slider-tablet-navbar-height": `${TABLET_NAVBAR_HEIGHT}px`,
    "--slider-desktop-navbar-height": `${DESKTOP_NAVBAR_HEIGHT}px`,
    "--slider-dots-space": `${DOTS_SPACE}px`,
    "--slider-bottom-safe-gap": `${BOTTOM_SAFE_GAP}px`,
  } as CSSProperties;

  const sliderShellClassName =
    "w-full overflow-x-hidden " +
    "[--slider-navbar-height:var(--slider-mobile-navbar-height)] " +
    "sm:[--slider-navbar-height:var(--slider-small-tablet-navbar-height)] " +
    "md:[--slider-navbar-height:var(--slider-tablet-navbar-height)] " +
    "min-[920px]:[--slider-navbar-height:var(--slider-desktop-navbar-height)]";

  const sliderSectionClassName =
    "relative w-full touch-pan-y overflow-hidden " +
    "h-[calc(100svh-var(--slider-navbar-height)-var(--slider-dots-space)-var(--slider-bottom-safe-gap))]";

  if (loadingSlides) {
    return (
      <div className={sliderShellClassName} style={sliderVars}>
        <section className={sliderSectionClassName}>
          <div className="absolute inset-0 animate-pulse bg-neutral-200" />
        </section>

        <div className="mt-4 flex h-[10px] justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-neutral-300"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!slides.length) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) < 50) return;

    if (distance > 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  };

  const visibleDots = Math.min(slides.length, 6);

  const dotIndexes = Array.from({ length: visibleDots }, (_, i) =>
    Math.round((i * (slides.length - 1)) / Math.max(visibleDots - 1, 1)),
  );

  return (
    <div className={sliderShellClassName} style={sliderVars}>
      <section
        className={sliderSectionClassName}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => {
              imageRefs.current[index] = el;
            }}
            className="absolute inset-0"
            style={{
              opacity: index === 0 ? 1 : 0,
            }}
          >
            <Link
              href={slide.link}
              className="block h-full w-full"
              aria-label={`slide-${index}`}
            >
              <div
                className="h-full w-full bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${slide.image})`,
                }}
              />
            </Link>
          </div>
        ))}
      </section>

      {slides.length > 1 && (
        <div className="mt-4 flex h-[10px] justify-center gap-3">
          {dotIndexes.map((slideIndex) => {
            const isActive = slideIndex === activeIndex;
            return (
              <button
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className="relative flex h-[10px] w-[10px] items-center justify-center"
                aria-label={`Go to slide ${slideIndex + 1}`}
                type="button"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  className="-rotate-90 overflow-visible"
                  style={{ opacity: isActive ? 1 : 0, position: "absolute" }}
                >
                  <circle
                    cx="5"
                    cy="5"
                    r="3.5"
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="1"
                  />
                  <circle
                    key={isActive ? `active-${activeIndex}` : "idle"}
                    cx="5"
                    cy="5"
                    r="3.5"
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="1"
                    strokeLinecap="round"
                    className={isActive ? "dot-progress" : ""}
                  />
                </svg>

                <span
                  className="h-[8px] w-[8px] rounded-full transition-opacity duration-300"
                  style={{
                    backgroundColor: dotColor,
                    opacity: isActive ? 0 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
