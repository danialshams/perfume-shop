"use client";

import type { RefObject } from "react";
import { useEffect } from "react";
import gsap from "gsap";

type Params = {
  rootRef: RefObject<HTMLDivElement | null>;
  loadingProducts: boolean;
  filteredProductsLength: number;
};

export function useProductsReveal({
  rootRef,
  loadingProducts,
  filteredProductsLength,
}: Params) {
  useEffect(() => {
    if (!rootRef.current || loadingProducts || filteredProductsLength === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      /**
       * اگر کارت‌های محصول شما کلاس دیگری دارند،
       * فقط این selector را تغییر بده.
       */
      const cards = gsap.utils.toArray<HTMLElement>(
        ".product-card, [data-product-card]"
      );

      if (cards.length === 0) return;

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 18,
          scale: 0.992,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.055,
          ease: "power3.out",
          overwrite: true,
        }
      );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [filteredProductsLength, loadingProducts, rootRef]);
}
