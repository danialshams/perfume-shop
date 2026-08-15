"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getProductImage, type Product } from "@/lib/product";

gsap.registerPlugin(ScrollTrigger);

const TEXT_GAP_PX = 42;
const TEXT_SHIFT_PX = 0;
const DESKTOP_PADDING = 42;
const BOTTOM_SPACING_PX = 110;
const COLUMN_GAP_PX = 24;

type Props = {
  products?: Product[];
  mobileFullscreen?: boolean;
  isLoading?: boolean;
};

function SkeletonBar({
  className = "",
  animationDelay,
}: {
  className?: string;
  animationDelay?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[4px] bg-neutral-300 motion-safe:animate-pulse ${className}`}
      style={{
        animationDelay,
      }}
    />
  );
}

function ProductsHeroSkeleton({
  mobileFullscreen,
}: {
  mobileFullscreen?: boolean;
}) {
  const mobileHeroHeight = mobileFullscreen ? "100svh" : "100vh";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ù…Ø­ØµÙˆÙ„Ø§Øª"
      className="relative w-full overflow-hidden bg-white"
    >
      {/* Ù…ÙˆØ¨Ø§ÛŒÙ„ Ùˆ ØªØ¨Ù„Øª */}
      <div className="relative w-full bg-white lg:hidden">
        {/* Ù‡ÛŒØ±Ùˆ Ø¯Ù‚ÛŒÙ‚Ø§Ù‹ Ù…Ø´Ø§Ø¨Ù‡ Ø³Ø§Ø®ØªØ§Ø± Ø§ØµÙ„ÛŒ: wrapper + sticky */}
        <div
          className="relative"
          style={{
            height: "140svh",
          }}
        >
          <div
            className="sticky top-0 overflow-hidden bg-white"
            style={{
              height: mobileHeroHeight,
            }}
          >
            {/* Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† ØªØµÙˆÛŒØ± Ù‡ÛŒØ±Ùˆ */}
            <div className="absolute inset-0 overflow-hidden bg-neutral-300">
              <div className="absolute inset-0 bg-neutral-300 motion-safe:animate-pulse" />

              {/* Ø¨Ø§ÙØª Ù†Ø±Ù… Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ†Ú©Ù‡ Ø´Ø¨ÛŒÙ‡ placeholder ØªØµÙˆÛŒØ± Ø¨Ø§Ø´Ø¯ */}
              <div className="absolute -left-[22%] top-[8%] h-[46%] w-[82%] rounded-full bg-neutral-200/55 blur-3xl" />
              <div className="absolute -right-[26%] bottom-[4%] h-[54%] w-[88%] rounded-full bg-neutral-400/25 blur-3xl" />
            </div>

            {/* overlay Ù…Ø´Ø§Ø¨Ù‡ Ù‡ÛŒØ±ÙˆÛŒ Ø§ØµÙ„ÛŒ */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Ù…ØªÙ† ÙˆØ³Ø· Ù‡ÛŒØ±Ùˆ Ù…Ø«Ù„ Ù…Ø­ØªÙˆØ§ÛŒ ÙˆØ§Ù‚Ø¹ÛŒ */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
              <div
                className="flex w-full max-w-md flex-col items-center"
                style={{
                  transform: `translateY(${TEXT_SHIFT_PX}px)`,
                }}
              >
                <SkeletonBar
                  animationDelay="80ms"
                  className="h-9 w-[68%] max-w-[290px] bg-white/85 sm:h-10 sm:max-w-[350px]"
                />

                <SkeletonBar
                  animationDelay="160ms"
                  className="mt-4 h-4 w-[88%] max-w-[390px] bg-white/65"
                />

                <SkeletonBar
                  animationDelay="240ms"
                  className="mt-2 h-4 w-[62%] max-w-[280px] bg-white/65"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø¨Ø¹Ø¯ÛŒ Ù…Ø´Ø§Ø¨Ù‡ restProducts */}
        <div className="relative z-20 -mt-[40svh] bg-white">
          {[0, 1].map((cardIndex) => (
            <section
              key={cardIndex}
              className="relative flex min-h-[92svh] items-start justify-center px-4 pb-2 pt-0 sm:px-5 sm:pb-3 sm:pt-0"
            >
              <div className="relative h-[92svh] w-full overflow-hidden bg-neutral-300">
                {/* Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† ØªØµÙˆÛŒØ± Ú©Ø§Ø±Øª */}
                <div
                  className="absolute inset-0 bg-neutral-300 motion-safe:animate-pulse"
                  style={{
                    animationDelay: `${cardIndex * 180}ms`,
                  }}
                />

                {/* Ø¨Ø§ÙØª Ù†Ø±Ù… ØªØµÙˆÛŒØ± Ú©Ø§Ø±Øª */}
                <div className="absolute -left-[30%] top-[5%] h-[48%] w-[92%] rounded-full bg-neutral-200/50 blur-3xl" />
                <div className="absolute -right-[28%] bottom-[2%] h-[56%] w-[92%] rounded-full bg-neutral-400/25 blur-3xl" />

                {/* overlay Ù…Ø´Ø§Ø¨Ù‡ Ú©Ø§Ø±Øª ÙˆØ§Ù‚Ø¹ÛŒ */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />

                {/* Ù…Ø­ØªÙˆØ§ÛŒ Ù¾Ø§ÛŒÛŒÙ† Ú©Ø§Ø±Øª Ø¯Ù‚ÛŒÙ‚Ø§Ù‹ Ù…Ø´Ø§Ø¨Ù‡ Ø³Ø§Ø®ØªØ§Ø± Ø§ØµÙ„ÛŒ */}
                <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-8 pt-16 sm:px-8 sm:pb-10">
                  <div className="w-full max-w-md">
                    <SkeletonBar
                      animationDelay={`${cardIndex * 180 + 80}ms`}
                      className={`h-8 bg-white/85 sm:h-9 ${
                        cardIndex === 0 ? "w-[58%]" : "w-[70%]"
                      }`}
                    />

                    <SkeletonBar
                      animationDelay={`${cardIndex * 180 + 160}ms`}
                      className="mt-4 h-4 w-[92%] bg-white/65"
                    />

                    <SkeletonBar
                      animationDelay={`${cardIndex * 180 + 240}ms`}
                      className="mt-2 h-4 w-[72%] bg-white/65"
                    />

                    <SkeletonBar
                      animationDelay={`${cardIndex * 180 + 320}ms`}
                      className="mt-7 h-3 w-20 bg-white/75"
                    />

                    <SkeletonBar
                      animationDelay={`${cardIndex * 180 + 400}ms`}
                      className="mt-4 h-px w-full max-w-[180px] rounded-none bg-white/70"
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Ø¯Ø³Ú©ØªØ§Ù¾ */}
      <div className="relative hidden h-screen w-full overflow-hidden bg-white lg:block">
        <div
          className="absolute inset-0"
          style={{
            paddingTop: DESKTOP_PADDING,
            paddingBottom: BOTTOM_SPACING_PX,
            paddingLeft: DESKTOP_PADDING,
            paddingRight: DESKTOP_PADDING,
            boxSizing: "border-box",
          }}
        >
          <div
            className="flex h-full w-full items-stretch"
            style={{
              gap: COLUMN_GAP_PX,
            }}
          >
            {[0, 1, 2].map((column) => (
              <div
                key={column}
                className="relative h-full min-w-0 flex-1 overflow-hidden bg-neutral-300"
              >
                <div
                  className="absolute inset-0 bg-neutral-300 motion-safe:animate-pulse"
                  style={{
                    animationDelay: `${column * 160}ms`,
                  }}
                />

                <div className="absolute -left-[35%] top-[5%] h-[50%] w-full rounded-full bg-neutral-200/50 blur-3xl" />
                <div className="absolute -right-[35%] bottom-0 h-[55%] w-full rounded-full bg-neutral-400/25 blur-3xl" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <SkeletonBar
                    animationDelay={`${column * 160 + 80}ms`}
                    className={`h-7 bg-white/85 ${
                      column === 1 ? "w-[62%]" : "w-[72%]"
                    }`}
                  />

                  <SkeletonBar
                    animationDelay={`${column * 160 + 160}ms`}
                    className="mt-4 h-4 w-[92%] bg-white/65"
                  />

                  <SkeletonBar
                    animationDelay={`${column * 160 + 240}ms`}
                    className="mt-2 h-4 w-[68%] bg-white/65"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ù…Ø­ØµÙˆÙ„Ø§Øª...</span>
    </div>
  );
}

export default function ProductsHero({
  products = [],
  mobileFullscreen,
  isLoading,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const textInnerRef = useRef<HTMLDivElement | null>(null);
  const cardsWrapRef = useRef<HTMLDivElement | null>(null);

  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const centerColRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);

  const desktopStateRef = useRef<"collapsed" | "expanded">("collapsed");
  const desktopAnimatingRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(false);

  const showSkeleton = isLoading ?? products.length === 0;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mq.matches);

    apply();
    mq.addEventListener("change", apply);

    return () => {
      mq.removeEventListener("change", apply);
    };
  }, []);

  const heroProduct = products[0];

  const restProducts = useMemo(() => {
    return products.slice(1);
  }, [products]);

  const triProducts = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  const hasTriEffect = !showSkeleton && isDesktop && triProducts.length >= 3;

  // Ø§ÙÚ©Øª Ù…ÙˆØ¨Ø§ÛŒÙ„ Ùˆ ØªØ¨Ù„Øª
  useEffect(() => {
    if (showSkeleton || !heroProduct || isDesktop) return;

    let raf = 0;
    let moveDistance = 0;

    const update = () => {
      raf = 0;

      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      const image = imageRef.current;
      const textInner = textInnerRef.current;

      if (!wrapper || !sticky || !image || !textInner) return;

      const stickyRect = sticky.getBoundingClientRect();
      const stickyHeight = stickyRect.height;
      const total = Math.max(wrapper.offsetHeight - stickyHeight, 0);

      const scrolled = Math.min(
        Math.max(-wrapper.getBoundingClientRect().top, 0),
        total,
      );

      const progress = total > 0 ? scrolled / total : 0;
      const imageY = -(progress * moveDistance);
      const imageBottom = stickyHeight + imageY;
      const textRect = textInner.getBoundingClientRect();

      const splitInText = Math.min(
        Math.max(imageBottom - (textRect.top - stickyRect.top), 0),
        textRect.height,
      );

      image.style.transform = `translateY(${imageY}px)`;

      sticky.style.setProperty("--image-bottom", `${imageBottom}px`);
      sticky.style.setProperty("--text-split", `${splitInText}px`);
    };

    const setup = () => {
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      const textInner = textInnerRef.current;

      if (!wrapper || !sticky || !textInner) return;

      const stickyRect = sticky.getBoundingClientRect();
      const stickyHeight = stickyRect.height;
      const textRect = textInner.getBoundingClientRect();
      const textTopInSticky = textRect.top - stickyRect.top;
      const finalImageBottom = Math.max(textTopInSticky - TEXT_GAP_PX, 0);

      moveDistance = Math.max(stickyHeight - finalImageBottom, 0);
      wrapper.style.height = `${stickyHeight + moveDistance}px`;

      sticky.style.setProperty("--image-bottom", `${stickyHeight}px`);
      sticky.style.setProperty("--text-split", `${textRect.height}px`);

      update();
    };

    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };

    setup();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
    window.addEventListener("resize", setup);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", setup);

      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [heroProduct, isDesktop, showSkeleton]);

  // Ø§ÙÚ©Øª Ø³Ù‡â€ŒØ³ØªÙˆÙ†Ù‡ Ø¯Ø³Ú©ØªØ§Ù¾
  useLayoutEffect(() => {
    if (showSkeleton || !hasTriEffect || !heroSectionRef.current) {
      return;
    }

    const section = heroSectionRef.current;
    const center = centerColRef.current;
    const left = leftColRef.current;
    const right = rightColRef.current;

    if (!center || !left || !right) return;

    desktopStateRef.current = "collapsed";
    desktopAnimatingRef.current = false;

    let lockedScrollY = window.scrollY;
    let touchStartY = 0;
    let isLocked = false;

    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyLeft = document.body.style.left;
    const originalBodyRight = document.body.style.right;
    const originalBodyWidth = document.body.style.width;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    const lockPage = () => {
      if (isLocked) return;

      isLocked = true;
      lockedScrollY = window.scrollY;

      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    };

    const unlockPage = () => {
      if (!isLocked) return;

      isLocked = false;

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = originalBodyLeft;
      document.body.style.right = originalBodyRight;
      document.body.style.width = originalBodyWidth;
      document.body.style.overflow = originalBodyOverflow;

      window.scrollTo(0, lockedScrollY);
    };

    const wheelOptions: AddEventListenerOptions = {
      passive: false,
      capture: true,
    };

    const touchStartOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };

    const touchMoveOptions: AddEventListenerOptions = {
      passive: false,
      capture: true,
    };

    const keyOptions: AddEventListenerOptions = {
      capture: true,
    };

    const ctx = gsap.context(() => {
      gsap.set(center, {
        width: "100%",
        opacity: 1,
        yPercent: 0,
        xPercent: 0,
      });

      gsap.set([left, right], {
        width: 0,
        opacity: 0,
        yPercent: 110,
        overflow: "hidden",
        flexShrink: 0,
      });

      const tl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power3.inOut",
        },
        onComplete: () => {
          desktopAnimatingRef.current = false;
          desktopStateRef.current = "expanded";
          unlockPage();

          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        },
        onReverseComplete: () => {
          desktopAnimatingRef.current = false;
          desktopStateRef.current = "collapsed";
          unlockPage();

          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        },
      });

      tl.to(center, {
        width: "33.333%",
        duration: 1,
      })
        .to(
          [left, right],
          {
            width: "33.333%",
            duration: 1,
            ease: "power3.inOut",
          },
          "<",
        )
        .to(
          [left, right],
          {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
          },
          ">-0.1",
        );

      const playForward = () => {
        if (desktopStateRef.current === "expanded") return;
        if (desktopAnimatingRef.current) return;

        desktopAnimatingRef.current = true;
        lockPage();
        tl.play();
      };

      const playReverse = () => {
        if (desktopStateRef.current === "collapsed") return;
        if (desktopAnimatingRef.current) return;

        desktopAnimatingRef.current = true;
        lockPage();
        tl.reverse();
      };

      const sectionFullyInView = () => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        return (
          rect.top <= 80 &&
          rect.top >= -80 &&
          rect.bottom >= viewportHeight - 80
        );
      };

      const handleWheel = (event: WheelEvent) => {
        if (desktopAnimatingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (
          desktopStateRef.current === "collapsed" &&
          event.deltaY > 0
        ) {
          event.preventDefault();
          event.stopPropagation();
          playForward();
        } else if (
          desktopStateRef.current === "expanded" &&
          event.deltaY < 0 &&
          sectionFullyInView()
        ) {
          event.preventDefault();
          event.stopPropagation();
          playReverse();
        }
      };

      const handleTouchStart = (event: TouchEvent) => {
        touchStartY = event.touches[0]?.clientY ?? 0;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (desktopAnimatingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const currentY = event.touches[0]?.clientY ?? 0;
        const deltaY = touchStartY - currentY;

        if (
          desktopStateRef.current === "collapsed" &&
          deltaY > 0
        ) {
          event.preventDefault();
          event.stopPropagation();
          playForward();
        } else if (
          desktopStateRef.current === "expanded" &&
          deltaY < 0 &&
          sectionFullyInView()
        ) {
          event.preventDefault();
          event.stopPropagation();
          playReverse();
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (desktopAnimatingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const downKeys = [
          "ArrowDown",
          "PageDown",
          " ",
          "Spacebar",
          "End",
        ];

        const upKeys = ["ArrowUp", "PageUp", "Home"];

        if (
          downKeys.includes(event.key) &&
          desktopStateRef.current === "collapsed"
        ) {
          event.preventDefault();
          playForward();
        } else if (
          upKeys.includes(event.key) &&
          desktopStateRef.current === "expanded" &&
          sectionFullyInView()
        ) {
          event.preventDefault();
          playReverse();
        }
      };

      lockPage();

      window.addEventListener("wheel", handleWheel, wheelOptions);
      window.addEventListener(
        "touchstart",
        handleTouchStart,
        touchStartOptions,
      );
      window.addEventListener(
        "touchmove",
        handleTouchMove,
        touchMoveOptions,
      );
      window.addEventListener("keydown", handleKeyDown, keyOptions);

      return () => {
        window.removeEventListener("wheel", handleWheel, wheelOptions);
        window.removeEventListener(
          "touchstart",
          handleTouchStart,
          touchStartOptions,
        );
        window.removeEventListener(
          "touchmove",
          handleTouchMove,
          touchMoveOptions,
        );
        window.removeEventListener("keydown", handleKeyDown, keyOptions);

        tl.kill();
        unlockPage();
      };
    }, section);

    return () => {
      ctx.revert();
    };
  }, [hasTriEffect, showSkeleton]);

  // Ø§ÙÚ©Øª Ú©Ø§Ø±Øªâ€ŒÙ‡Ø§ÛŒ Ø¨Ø§Ù‚ÛŒâ€ŒÙ…Ø§Ù†Ø¯Ù‡ Ø¯Ø± Ù…ÙˆØ¨Ø§ÛŒÙ„ Ùˆ ØªØ¨Ù„Øª
  useEffect(() => {
    if (showSkeleton) return;
    if (!cardsWrapRef.current) return;
    if (restProducts.length === 0) return;
    if (isDesktop) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-luxury-card]");

      cards.forEach((card) => {
        const media = card.querySelector<HTMLElement>("[data-card-media]");
        const overlay = card.querySelector<HTMLElement>(
          "[data-card-overlay]",
        );
        const title = card.querySelector<HTMLElement>("[data-card-title]");
        const desc = card.querySelector<HTMLElement>("[data-card-desc]");
        const cta = card.querySelector<HTMLElement>("[data-card-cta]");
        const line = card.querySelector<HTMLElement>("[data-card-line]");

        if (!media || !overlay || !title || !cta || !line) {
          return;
        }

        gsap.set(card, {
          opacity: 1,
        });

        gsap.set(media, {
          y: 90,
          scale: 1.08,
          opacity: 0,
          filter: "blur(14px)",
        });

        gsap.set(overlay, {
          opacity: 0,
        });

        gsap.set([title, cta], {
          y: 28,
          opacity: 0,
        });

        if (desc) {
          gsap.set(desc, {
            y: 28,
            opacity: 0,
          });
        }

        gsap.set(line, {
          scaleX: 0,
          transformOrigin: "left center",
          opacity: 0.75,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "bottom 30%",
            toggleActions: "play none none none",
            once: true,
          },
        });

        tl.to(media, {
          y: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.35,
          ease: "power3.out",
        })
          .to(
            overlay,
            {
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
            },
            "-=1.0",
          )
          .to(
            title,
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power3.out",
            },
            "-=0.45",
          );

        if (desc) {
          tl.to(
            desc,
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power3.out",
            },
            "-=0.48",
          );
        }

        tl.to(
          cta,
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.5",
        ).to(
          line,
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.05,
            ease: "power2.out",
          },
          "-=0.15",
        );
      });
    }, cardsWrapRef);

    return () => {
      ctx.revert();
    };
  }, [restProducts, isDesktop, showSkeleton]);

  if (showSkeleton) {
    return (
      <ProductsHeroSkeleton mobileFullscreen={mobileFullscreen} />
    );
  }

  if (!heroProduct) {
    return null;
  }

  const imageUrl = getProductImage(heroProduct);

  if (hasTriEffect) {
    const colClass =
      "relative h-full shrink-0 overflow-hidden bg-neutral-200";

    return (
      <div className="relative">
        <div
          ref={heroSectionRef}
          className="relative h-screen w-full overflow-hidden bg-[#F8F8F8]"
        >
          <div
            className="absolute inset-0"
            style={{
              paddingTop: DESKTOP_PADDING,
              paddingBottom: BOTTOM_SPACING_PX,
              paddingLeft: DESKTOP_PADDING,
              paddingRight: DESKTOP_PADDING,
              boxSizing: "border-box",
            }}
          >
            <div
              className="flex h-full w-full items-stretch justify-center"
              style={{
                gap: COLUMN_GAP_PX,
              }}
            >
              <div
                ref={leftColRef}
                className={colClass}
                style={{
                  width: 0,
                }}
              >
                <Image
                  src={getProductImage(triProducts[1])}
                  alt={triProducts[1].name ?? ""}
                  fill
                  unoptimized
                  sizes="33vw"
                  className="object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h2 className="text-2xl font-medium">
                    {triProducts[1].name}
                  </h2>

                  {triProducts[1].short_description && (
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      {triProducts[1].short_description}
                    </p>
                  )}
                </div>
              </div>

              <div
                ref={centerColRef}
                className={colClass}
                style={{
                  width: "100%",
                }}
              >
                <Image
                  src={imageUrl}
                  alt={heroProduct.name ?? ""}
                  fill
                  unoptimized
                  priority
                  sizes="33vw"
                  className="object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h1 className="text-3xl font-semibold">
                    {heroProduct.name}
                  </h1>

                  {heroProduct.short_description && (
                    <p className="mt-3 max-w-md text-sm leading-6 opacity-90">
                      {heroProduct.short_description}
                    </p>
                  )}
                </div>
              </div>

              <div
                ref={rightColRef}
                className={colClass}
                style={{
                  width: 0,
                }}
              >
                <Image
                  src={getProductImage(triProducts[2])}
                  alt={triProducts[2].name ?? ""}
                  fill
                  unoptimized
                  sizes="33vw"
                  className="object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h2 className="text-2xl font-medium">
                    {triProducts[2].name}
                  </h2>

                  {triProducts[2].short_description && (
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      {triProducts[2].short_description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {products.slice(3).length > 0 && (
          <div className="relative z-20 bg-[#F8F8F8]">
            {products.slice(3).map((product) => (
              <div
                key={product.id}
                className="relative flex h-screen items-center justify-center p-12"
              >
                <div className="relative h-full max-h-[72vh] w-full max-w-4xl overflow-hidden bg-[#F8F8F8]">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name ?? ""}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-white">
      <div ref={wrapperRef} className="relative">
        <div
          ref={stickyRef}
          className="sticky top-0 overflow-hidden bg-white"
          style={{
            height: mobileFullscreen ? "100svh" : "100vh",
            ["--image-bottom" as string]: "100vh",
            ["--text-split" as string]: "9999px",
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath:
                "inset(0 0 calc(100% - var(--image-bottom)) 0)",
            }}
          >
            <div
              ref={imageRef}
              className="absolute inset-0 will-change-transform"
            >
              <Image
                src={imageUrl}
                alt={heroProduct.name ?? ""}
                fill
                unoptimized
                priority
                sizes="100vw"
                className="object-cover object-center"
              />

              <div className="absolute inset-0 bg-black/30" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
            <div
              ref={textRef}
              className="relative"
              style={{
                transform: `translateY(${TEXT_SHIFT_PX}px)`,
              }}
            >
              <div
                ref={textInnerRef}
                className="relative text-white drop-shadow-lg"
                style={{
                  clipPath:
                    "inset(0 0 calc(100% - var(--text-split)) 0)",
                }}
              >
                <h1 className="text-3xl font-semibold">
                  {heroProduct.name}
                </h1>

                {heroProduct.short_description && (
                  <p className="mt-3 max-w-md text-sm leading-6 opacity-90">
                    {heroProduct.short_description}
                  </p>
                )}
              </div>

              <div
                className="pointer-events-none absolute inset-0 text-black"
                style={{
                  clipPath: "inset(var(--text-split) 0 0 0)",
                }}
              >
                <h1 className="text-3xl font-semibold">
                  {heroProduct.name}
                </h1>

                {heroProduct.short_description && (
                  <p className="mt-3 max-w-md text-sm leading-6 opacity-90">
                    {heroProduct.short_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {restProducts.length > 0 && (
        <div
          ref={cardsWrapRef}
          className="relative z-20 -mt-[40svh] bg-white lg:mt-0"
        >
          {restProducts.map((product) => (
            <section
              key={product.id}
              data-luxury-card
              className="relative flex min-h-[92svh] items-start justify-center px-4 pb-2 pt-0 sm:px-5 sm:pb-3 sm:pt-0 lg:min-h-screen lg:items-center lg:py-4"
              style={{
                opacity: 0,
              }}
            >
              <div
                data-card-media
                className="relative h-[92svh] w-full overflow-hidden bg-neutral-200"
              >
                <Image
                  src={getProductImage(product)}
                  alt={product.name ?? ""}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 90vw"
                  className="object-cover"
                />

                <div
                  data-card-overlay
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-8 pt-16 sm:px-8 sm:pb-10">
                  <div className="max-w-md text-white">
                    <h2
                      data-card-title
                      className="text-[28px] font-medium tracking-[0.02em] sm:text-[34px]"
                    >
                      {product.name}
                    </h2>

                    {product.short_description && (
                      <p
                        data-card-desc
                        className="mt-3 text-sm leading-6 text-white/82 sm:text-[15px]"
                      >
                        {product.short_description}
                      </p>
                    )}

                    <div
                      data-card-cta
                      className="mt-6 text-[13px] uppercase tracking-[0.28em] text-white/92"
                    >
                      Ù…Ø´Ø§Ù‡Ø¯Ù‡
                    </div>

                    <div
                      data-card-line
                      className="mt-3 h-px w-full max-w-[180px] bg-white/75"
                    />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
