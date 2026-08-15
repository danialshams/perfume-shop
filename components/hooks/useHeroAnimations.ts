"use client";

import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

type Params = {
  heroRef: RefObject<HTMLElement | null>;
  imageRefs: RefObject<(HTMLDivElement | null)[]>;
  slideCounterInnerRef: RefObject<HTMLDivElement | null>;
  progressBarRef: RefObject<HTMLDivElement | null>;
  activeIndex: number;
  slidesLength: number;
  loadingHeroSlides: boolean;
  isPaused: boolean;
};

const PROGRESS_DURATION = 7.8;

export function useHeroAnimations({
  heroRef,
  imageRefs,
  slideCounterInnerRef,
  progressBarRef,
  activeIndex,
  slidesLength,
  loadingHeroSlides,
  isPaused,
}: Params) {
  const didIntroRef = useRef(false);

  useLayoutEffect(() => {
    if (!heroRef.current || loadingHeroSlides) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const titleWords = gsap.utils.toArray<HTMLElement>(".hero-title-word");
      const eyebrowItems = gsap.utils.toArray<HTMLElement>(".hero-eyebrow");
      const copyLine = gsap.utils.toArray<HTMLElement>(".hero-copy-line");

      gsap.set(imageRefs.current, {
        opacity: 0,
        scale: 1.012,
        x: 0,
        y: 0,
      });

      imageRefs.current.forEach((image) => {
        if (!image) return;

        const media = image.querySelector(".hero-parallax-media");

        if (media) {
          gsap.set(media, {
            scale: 1.028,
            x: 0,
            y: 0,
          });
        }
      });

      const activeImage = imageRefs.current[activeIndex];

      if (activeImage) {
        gsap.set(activeImage, {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
        });

        const activeMedia = activeImage.querySelector(".hero-parallax-media");

        if (activeMedia) {
          gsap.set(activeMedia, {
            scale: 1.012,
            x: 0,
            y: 0,
          });
        }
      }

      if (didIntroRef.current || prefersReducedMotion) {
        gsap.set([...titleWords, ...eyebrowItems, ...copyLine], {
          opacity: 1,
          y: 0,
          scaleX: 1,
        });

        return;
      }

      didIntroRef.current = true;

      gsap.set(titleWords, {
        opacity: 0,
        y: 16,
      });

      gsap.set(eyebrowItems, {
        opacity: 0,
        y: 8,
      });

      gsap.set(copyLine, {
        scaleX: 0,
        transformOrigin: "right center",
      });

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      tl.to(copyLine, {
        scaleX: 1,
        duration: 0.95,
      })
        .to(
          eyebrowItems,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.07,
          },
          "-=0.62",
        )
        .to(
          titleWords,
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            stagger: 0.05,
          },
          "-=0.54",
        );
    }, heroRef);

    return () => {
      ctx.revert();
    };
  }, [activeIndex, heroRef, imageRefs, loadingHeroSlides]);

  useEffect(() => {
    if (loadingHeroSlides || slidesLength === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const images = imageRefs.current;
    const activeImage = images[activeIndex];

    if (!activeImage) return;

    if (prefersReducedMotion) {
      gsap.set(images, {
        opacity: 0,
        scale: 1,
        x: 0,
        y: 0,
      });

      images.forEach((image, index) => {
        if (!image) return;

        const media = image.querySelector(".hero-parallax-media");

        if (media) {
          gsap.set(media, {
            scale: 1,
            x: 0,
            y: 0,
          });
        }

        if (index === activeIndex) {
          gsap.set(image, {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
          });
        }
      });

      return;
    }

    images.forEach((image, index) => {
      if (!image) return;

      const media = image.querySelector(".hero-parallax-media");

      gsap.killTweensOf(image);
      if (media) gsap.killTweensOf(media);

      if (index === activeIndex) {
        gsap.fromTo(
          image,
          {
            opacity: 0,
            scale: 1.01,
            x: 0,
            y: 0,
          },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            duration: 1,
            ease: "power2.out",
            overwrite: true,
          },
        );

        if (media) {
          gsap.fromTo(
            media,
            {
              scale: 1.035,
              y: 5,
              x: 0,
            },
            {
              scale: 1.012,
              y: 0,
              x: 0,
              duration: 1.35,
              ease: "power2.out",
              overwrite: true,
            },
          );
        }
      } else {
        gsap.to(image, {
          opacity: 0,
          scale: 1.012,
          x: 0,
          y: 0,
          duration: 0.82,
          ease: "power2.out",
          overwrite: true,
        });

        if (media) {
          gsap.to(media, {
            scale: 1.026,
            y: 0,
            x: 0,
            duration: 0.72,
            ease: "power2.out",
            overwrite: true,
          });
        }
      }
    });

    if (slideCounterInnerRef.current) {
      gsap.killTweensOf(slideCounterInnerRef.current);

      gsap.fromTo(
        slideCounterInnerRef.current,
        {
          y: 8,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        },
      );
    }
  }, [
    activeIndex,
    imageRefs,
    loadingHeroSlides,
    slideCounterInnerRef,
    slidesLength,
  ]);

  useEffect(() => {
    if (loadingHeroSlides || slidesLength <= 1 || !progressBarRef.current) {
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
      }

      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.killTweensOf(progressBarRef.current);

    if (isPaused) {
      return;
    }

    if (prefersReducedMotion) {
      gsap.set(progressBarRef.current, {
        scaleX: 1,
      });

      return;
    }

    gsap.set(progressBarRef.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    gsap.to(progressBarRef.current, {
      scaleX: 1,
      duration: PROGRESS_DURATION,
      ease: "none",
      overwrite: true,
    });

    return () => {
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
      }
    };
  }, [
    activeIndex,
    isPaused,
    loadingHeroSlides,
    progressBarRef,
    slidesLength,
  ]);
}
