"use client";

import { gsap } from "gsap";
import { RefObject, useEffect, useLayoutEffect, useRef } from "react";

type UseNavbarAnimationsParams = {
  desktopRootRef: RefObject<HTMLElement | null>;
  desktopNavRef: RefObject<HTMLDivElement | null>;
  mobileRootRef: RefObject<HTMLElement | null>;
  mobileNavRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  mobileSearchWrapperRef: RefObject<HTMLDivElement | null>;
  mobileSearchInnerRef: RefObject<HTMLDivElement | null>;
  topLineRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  isHeaderHidden: boolean;
  mobileSearchVisible: boolean;
};

export function useNavbarAnimations({
  desktopRootRef,
  desktopNavRef,
  mobileRootRef,
  mobileNavRef,
  panelRef,
  menuRef,
  mobileSearchWrapperRef,
  mobileSearchInnerRef,
  topLineRef,
  isOpen,
  isHeaderHidden,
  mobileSearchVisible,
}: UseNavbarAnimationsParams) {
  const desktopHeaderAnimationInitializedRef = useRef(false);
  const mobileHeaderAnimationInitializedRef = useRef(false);
  const mobileSearchAnimationRef = useRef<gsap.core.Timeline | null>(null);

  // panelRef و menuRef فعلاً برای سازگاری نگه داشته شده‌اند
  void panelRef;
  void menuRef;
  void mobileNavRef;

  // انیمیشن ورود اولیه نوبار دسکتاپ
  useEffect(() => {
    if (!desktopNavRef.current) return;

    const mm = window.matchMedia("(min-width: 920px)");
    if (!mm.matches) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (!desktopNavRef.current) return;

      if (prefersReducedMotion) {
        gsap.set(desktopNavRef.current, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          clearProps: "all",
        });
        return;
      }

      gsap.fromTo(
        desktopNavRef.current,
        {
          opacity: 0.82,
          y: -8,
          filter: "blur(0px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.64,
          ease: "power3.out",
        },
      );
    }, desktopNavRef);

    return () => {
      ctx.revert();
    };
  }, [desktopNavRef]);

  // نمایش/مخفی شدن هدر بر اساس breakpoint فعال
  useLayoutEffect(() => {
    const isDesktop = window.innerWidth >= 920;

    const header = isDesktop ? desktopRootRef.current : mobileRootRef.current;
    const line = topLineRef.current;

    if (!header) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const shouldHide = isHeaderHidden && !isOpen;
    const initializedRef = isDesktop
      ? desktopHeaderAnimationInitializedRef
      : mobileHeaderAnimationInitializedRef;

    gsap.killTweensOf(header);
    if (line) gsap.killTweensOf(line);

    if (!initializedRef.current) {
      initializedRef.current = true;

      gsap.set(header, {
        yPercent: shouldHide ? -110 : 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        pointerEvents: shouldHide ? "none" : "auto",
        transformOrigin: "50% 0%",
        force3D: true,
      });

      if (isDesktop && line) {
        gsap.set(line, {
          opacity: shouldHide ? 1 : 0,
          scaleX: shouldHide ? 1 : 0.45,
          transformOrigin: "50% 50%",
        });
      }

      return;
    }

    if (prefersReducedMotion) {
      gsap.set(header, {
        yPercent: shouldHide ? -110 : 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        pointerEvents: shouldHide ? "none" : "auto",
      });

      if (isDesktop && line) {
        gsap.set(line, {
          opacity: shouldHide ? 1 : 0,
          scaleX: shouldHide ? 1 : 0.45,
        });
      }

      return;
    }

    if (shouldHide) {
      gsap.to(header, {
        yPercent: -110,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: isDesktop ? 0.58 : 0.42,
        ease: "power3.inOut",
        overwrite: "auto",
        onStart: () => {
          gsap.set(header, {
            pointerEvents: "none",
            transformOrigin: "50% 0%",
            force3D: true,
          });
        },
      });

      if (isDesktop && line) {
        gsap.to(line, {
          opacity: 1,
          scaleX: 1,
          duration: 0.72,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    } else {
      gsap.to(header, {
        yPercent: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: isDesktop ? 0.78 : 0.46,
        ease: isDesktop ? "expo.out" : "power3.out",
        overwrite: "auto",
        onStart: () => {
          gsap.set(header, {
            pointerEvents: "auto",
            transformOrigin: "50% 0%",
            force3D: true,
          });
        },
      });

      if (isDesktop && line) {
        gsap.to(line, {
          opacity: 0,
          scaleX: 0.45,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }
  }, [
    desktopRootRef,
    mobileRootRef,
    topLineRef,
    isHeaderHidden,
    isOpen,
  ]);

  // انیمیشن جستجوی موبایل
  useLayoutEffect(() => {
    if (!mobileSearchWrapperRef.current || !mobileSearchInnerRef.current) {
      return;
    }

    if (window.innerWidth >= 920) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const wrapper = mobileSearchWrapperRef.current;
    const inner = mobileSearchInnerRef.current;
    const shouldHide = isOpen || isHeaderHidden;

    mobileSearchAnimationRef.current?.kill();

    if (prefersReducedMotion) {
      gsap.set(wrapper, {
        autoAlpha: shouldHide ? 0 : 1,
        y: 0,
        filter: "blur(0px)",
        pointerEvents: shouldHide ? "none" : "auto",
      });

      gsap.set(inner, {
        width: mobileSearchVisible ? "100%" : 44,
      });

      return;
    }

    const tl = gsap.timeline({ overwrite: "auto" });
    mobileSearchAnimationRef.current = tl;

    tl.to(
      wrapper,
      {
        autoAlpha: shouldHide ? 0 : 1,
        y: shouldHide ? -6 : 0,
        filter: shouldHide ? "blur(6px)" : "blur(0px)",
        duration: shouldHide ? 0.24 : 0.58,
        ease: shouldHide ? "power2.out" : "expo.out",
        onStart: () => {
          gsap.set(wrapper, {
            pointerEvents: shouldHide ? "none" : "auto",
          });
        },
        onComplete: () => {
          gsap.set(wrapper, {
            pointerEvents: shouldHide ? "none" : "auto",
          });
        },
      },
      0,
    );

    tl.to(
      inner,
      {
        width: mobileSearchVisible ? "100%" : 44,
        duration: mobileSearchVisible ? 0.5 : 0.42,
        ease: mobileSearchVisible ? "expo.out" : "power3.inOut",
      },
      0,
    );

    return () => {
      tl.kill();
    };
  }, [
    mobileSearchWrapperRef,
    mobileSearchInnerRef,
    mobileSearchVisible,
    isOpen,
    isHeaderHidden,
  ]);
}
