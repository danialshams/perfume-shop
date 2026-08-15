"use client";

import { RefObject, useEffect, useRef } from "react";

type UseNavbarScrollParams = {
  isOpen: boolean;
  desktopSearchRef: RefObject<HTMLInputElement | null>;
  mobileSearchRef: RefObject<HTMLInputElement | null>;
  mobileSearchVisibleRef: RefObject<boolean>;
  setIsScrolled: (value: boolean) => void;
  updateHeaderHidden: (hidden: boolean) => void;
};

export function useNavbarScroll({
  isOpen,
  desktopSearchRef,
  mobileSearchRef,
  mobileSearchVisibleRef,
  setIsScrolled,
  updateHeaderHidden,
}: UseNavbarScrollParams) {
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const previousY = lastScrollY.current;
        const delta = currentY - previousY;

        setIsScrolled(currentY > 16);

        const isDesktopSearchFocused =
          document.activeElement === desktopSearchRef.current;

        const isMobileSearchFocused =
          document.activeElement === mobileSearchRef.current;

        const isAnySearchFocused =
          isDesktopSearchFocused || isMobileSearchFocused;

        const isMobileViewport = window.innerWidth < 920;
        const isMobileSearchExpanded =
          isMobileViewport && mobileSearchVisibleRef.current;

        if (isOpen || isAnySearchFocused || isMobileSearchExpanded) {
          updateHeaderHidden(false);
          lastScrollY.current = currentY;
          ticking.current = false;
          return;
        }

        if (currentY < 40) {
          updateHeaderHidden(false);
          lastScrollY.current = currentY;
          ticking.current = false;
          return;
        }

        if (Math.abs(delta) < 10) {
          ticking.current = false;
          return;
        }

        if (delta > 0 && currentY > 120) {
          updateHeaderHidden(true);
        } else if (delta < 0) {
          updateHeaderHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      ticking.current = false;
    };
  }, [
    isOpen,
    desktopSearchRef,
    mobileSearchRef,
    mobileSearchVisibleRef,
    setIsScrolled,
    updateHeaderHidden,
  ]);
}
