"use client";

import type { MouseEvent, TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slide } from "../HomeProductsComponnents/HeroSlider";

type Product = {
  id: number;
  name?: string;
  slug?: string;
  short_description?: string | null;
  scent_family?: string | null;
  top_notes?: string | null;
  middle_notes?: string | null;
  base_notes?: string | null;
  main_image?: string | null;
  image?: string | null;
};

type SliderApiItem = {
  id: number;
  title?: string;
  link?: string | null;
  image_url?: string | null;
  image?: string | null;
  product_id?: number | null;
  product?: Product | null;
};

const AUTOPLAY_DELAY = 7800;
const SWIPE_THRESHOLD = 42;
const DRAG_LIMIT = 8;

const FALLBACK_IMAGE = "/images/perfume-2.jpg";

export function useHeroSlider() {
  const heroRef = useRef<HTMLElement | null>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideCounterInnerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  const prefersReducedMotionRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<Slide[]>([]);
  const [loadingHeroSlides, setLoadingHeroSlides] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);

  const buildProductLink = useCallback(
    (product?: Product | null, productId?: number | null) => {
      if (product?.slug) return `/products/${product.slug}`;
      if (product?.id) return `/products/${product.id}`;
      if (productId) return `/products/${productId}`;
      return "/products";
    },
    [],
  );

  const normalizeLink = useCallback((link?: string | null) => {
    if (!link) return null;

    const trimmed = link.trim();

    if (!trimmed) return null;

    return trimmed;
  }, []);

  const displaySlides = useMemo<Slide[]>(() => {
    if (heroSlides.length > 0) return heroSlides;

    return [
      {
        id: 0,
        image: FALLBACK_IMAGE,
        detailsLink: "/products",
      },
    ];
  }, [heroSlides]);

  const activeSlide = displaySlides[activeIndex] ?? displaySlides[0];

  const setImageRef = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      imageRefs.current[index] = element;
    },
    [],
  );

  const preloadImage = useCallback((src?: string | null) => {
    if (!src || typeof window === "undefined") return;

    const img = new window.Image();
    img.src = src;
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (displaySlides.length <= 1) return prev;
      return (prev + 1) % displaySlides.length;
    });
  }, [displaySlides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (displaySlides.length <= 1) return prev;
      return (prev - 1 + displaySlides.length) % displaySlides.length;
    });
  }, [displaySlides.length]);

  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  const pauseAutoplay = useCallback(() => {
    clearPauseTimeout();
    setIsPaused(true);
  }, [clearPauseTimeout]);

  const resumeAutoplayWithDelay = useCallback(
    (delay = 1800) => {
      clearPauseTimeout();

      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
      }, delay);
    },
    [clearPauseTimeout],
  );

  const handleMouseEnter = useCallback(() => {
    if (displaySlides.length <= 1) return;
    pauseAutoplay();
  }, [displaySlides.length, pauseAutoplay]);

  const handleMouseLeave = useCallback(() => {
    if (displaySlides.length <= 1) return;
    resumeAutoplayWithDelay(500);
  }, [displaySlides.length, resumeAutoplayWithDelay]);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (displaySlides.length <= 1) return;
      if (event.touches.length !== 1) return;

      pauseAutoplay();

      didSwipeRef.current = false;
      touchStartXRef.current = event.touches[0]?.clientX ?? null;
      touchCurrentXRef.current = event.touches[0]?.clientX ?? null;
    },
    [displaySlides.length, pauseAutoplay],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (displaySlides.length <= 1) return;
      if (event.touches.length !== 1) return;

      const startX = touchStartXRef.current;
      const currentX = event.touches[0]?.clientX ?? null;

      touchCurrentXRef.current = currentX;

      const activeImage = imageRefs.current[activeIndex];

      if (
        startX == null ||
        currentX == null ||
        !activeImage ||
        prefersReducedMotionRef.current
      ) {
        return;
      }

      const rawDelta = currentX - startX;

      const clampedDelta = Math.max(
        -DRAG_LIMIT,
        Math.min(DRAG_LIMIT, rawDelta * 0.14),
      );

      activeImage.style.transform = `translate3d(${clampedDelta}px, 0, 0)`;
    },
    [activeIndex, displaySlides.length],
  );

  const handleTouchEnd = useCallback(() => {
    if (displaySlides.length <= 1) return;

    const startX = touchStartXRef.current;
    const endX = touchCurrentXRef.current;
    const activeImage = imageRefs.current[activeIndex];

    if (activeImage) {
      activeImage.style.transform = "";
    }

    if (startX == null || endX == null) {
      resumeAutoplayWithDelay();
      return;
    }

    const deltaX = endX - startX;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      didSwipeRef.current = true;

      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }

      window.setTimeout(() => {
        didSwipeRef.current = false;
      }, 90);
    }

    touchStartXRef.current = null;
    touchCurrentXRef.current = null;

    resumeAutoplayWithDelay();
  }, [
    activeIndex,
    displaySlides.length,
    goNext,
    goPrev,
    resumeAutoplayWithDelay,
  ]);

  const handleHeroClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!didSwipeRef.current) return;

      event.preventDefault();
      didSwipeRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    prefersReducedMotionRef.current = media.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);

      return () => {
        media.removeEventListener("change", handleChange);
      };
    }

    media.addListener(handleChange);

    return () => {
      media.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchHeroSlides() {
      try {
        setLoadingHeroSlides(true);

        const [slidersRes, productsRes] = await Promise.all([
          fetch("/api/v1/sliders?placement=PRODUCTS", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/v1/products", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const slidersJson = await slidersRes.json();
        const productsJson = await productsRes.json();

        const sliders: SliderApiItem[] = Array.isArray(slidersJson?.data)
          ? slidersJson.data
          : Array.isArray(slidersJson?.data?.items)
            ? slidersJson.data.items
            : Array.isArray(slidersJson?.items)
              ? slidersJson.items
              : [];

        const products: Product[] = Array.isArray(productsJson?.data?.items)
          ? productsJson.data.items
          : Array.isArray(productsJson?.data)
            ? productsJson.data
            : Array.isArray(productsJson?.items)
              ? productsJson.items
              : [];

        const productsMap = new Map<number, Product>();

        products.forEach((product) => {
          productsMap.set(product.id, product);
        });

        const mappedSlides = sliders
          .map((slider) => {
            const product =
              slider.product ??
              productsMap.get(Number(slider.product_id)) ??
              null;

            const productId = product?.id ?? slider.product_id ?? undefined;

            const image =
              product?.main_image ??
              product?.image ??
              slider.image_url ??
              slider.image ??
              FALLBACK_IMAGE;

            if (!image) return null;

            return {
              id: slider.id,
              productId,
              image,
              detailsLink:
                normalizeLink(slider.link) ??
                buildProductLink(product, productId),
            };
          })
          .filter(Boolean) as Slide[];

        setHeroSlides(mappedSlides);
        setActiveIndex(0);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Failed to fetch product sliders:", error);

        setHeroSlides([]);
        setActiveIndex(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHeroSlides(false);
        }
      }
    }

    fetchHeroSlides();

    return () => {
      controller.abort();
    };
  }, [buildProductLink, normalizeLink]);

  useEffect(() => {
    imageRefs.current = [];
  }, [displaySlides.length]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);

      if (document.hidden) {
        setIsPaused(true);
      } else {
        resumeAutoplayWithDelay(600);
      }
    };

    setIsDocumentHidden(document.hidden);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resumeAutoplayWithDelay]);

  useEffect(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    if (
      loadingHeroSlides ||
      displaySlides.length <= 1 ||
      isPaused ||
      isDocumentHidden ||
      prefersReducedMotionRef.current
    ) {
      return;
    }

    autoplayRef.current = setInterval(() => {
      goNext();
    }, AUTOPLAY_DELAY);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [
    displaySlides.length,
    goNext,
    isDocumentHidden,
    isPaused,
    loadingHeroSlides,
  ]);

  useEffect(() => {
    if (displaySlides.length <= 1) return;

    const nextIndex = (activeIndex + 1) % displaySlides.length;
    const nextSlide = displaySlides[nextIndex];

    if (nextSlide?.image) {
      preloadImage(nextSlide.image);
    }
  }, [activeIndex, displaySlides, preloadImage]);

  useEffect(() => {
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }

      clearPauseTimeout();
    };
  }, [clearPauseTimeout]);

  return {
    heroRef,
    imageRefs,
    setImageRef,
    slideCounterInnerRef,
    progressBarRef,

    activeIndex,
    activeSlide,
    heroSlides,
    displaySlides,
    loadingHeroSlides,
    isPaused,

    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleHeroClick,
  };
}
