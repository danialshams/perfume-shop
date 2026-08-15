"use client";

import { gsap } from "gsap";
import { RefObject, useLayoutEffect, useRef } from "react";
import { useNavbarUI } from "@/context/NavbarUIContext";

export function useFilterBarSync(ref: RefObject<HTMLElement | null>) {
  const { isHeaderHidden, navHeight } = useNavbarUI();
  const initializedRef = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // فقط دسکتاپ؛ موبایل sticky/top جداگانه دارد
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "top" });
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // نوبار مخفی => فیلتر بچسبد به بالای صفحه (top: 0)
    // نوبار پیدا => فیلتر بچسبد دقیقاً زیر نوبار (top: navHeight)
    const targetTop = isHeaderHidden ? 0 : navHeight;

    gsap.killTweensOf(el);

    // اولین بار بدون انیمیشن مقدار را ست کن
    if (!initializedRef.current) {
      initializedRef.current = true;
      gsap.set(el, { top: targetTop });
      return;
    }

    if (prefersReducedMotion) {
      gsap.set(el, { top: targetTop });
      return;
    }

    // تطبیق دقیق با تایمینگ نوبار:
    // hide => duration 0.58 / power3.inOut
    // show => duration 0.78 / expo.out
    gsap.to(el, {
      top: targetTop,
      duration: isHeaderHidden ? 0.58 : 0.78,
      ease: isHeaderHidden ? "power3.inOut" : "expo.out",
      overwrite: "auto",
    });
  }, [ref, isHeaderHidden, navHeight]);
}
