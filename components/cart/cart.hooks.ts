"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";

export function useViewportReveal<T extends HTMLElement>({
  disabled = false,
  threshold = 0.18,
  rootMargin = "0px 0px -8% 0px",
  once = true,
  animation = "default",
}: {
  disabled?: boolean;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  animation?: "default" | "list" | "summary" | "header";
} = {}) {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (disabled || prefersReducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.filter = "none";
      return;
    }

    gsap.set(el, {
      autoAlpha: 0,
      y: animation === "summary" ? 24 : 18,
      scale: animation === "summary" ? 0.985 : 1,
      filter: "blur(8px)",
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration:
            animation === "summary"
              ? 0.85
              : animation === "header"
                ? 0.78
                : 0.72,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility,filter",
        });

        if (once) observer.disconnect();
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [disabled, prefersReducedMotion, threshold, rootMargin, once, animation]);

  return ref;
}

export function useViewportListReveal<T extends HTMLElement>({
  disabled = false,
  itemSelector = ".reveal-list-item",
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
}: {
  disabled?: boolean;
  itemSelector?: string;
  threshold?: number;
  rootMargin?: string;
} = {}) {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = gsap.utils.toArray<HTMLElement>(
      el.querySelectorAll(itemSelector),
    );

    if (disabled || prefersReducedMotion) {
      items.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
        item.style.filter = "none";
      });
      return;
    }

    gsap.set(items, {
      autoAlpha: 0,
      y: 18,
      filter: "blur(8px)",
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.68,
          stagger: 0.075,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility,filter",
        });

        observer.disconnect();
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [disabled, prefersReducedMotion, itemSelector, threshold, rootMargin]);

  return ref;
}
