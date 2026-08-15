"use client";

import { gsap } from "gsap";
import localFont from "next/font/local";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

const vazir = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
});

const quickLinks = [
  { label: "خانه", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

const topMessages = ["تضمین اصالت", "ارسال مطمئن", "بسته‌بندی امن"];

const socialLinks = [
  {
    label: "اینستاگرام",
    href: "https://instagram.com",
    icon: FaInstagram,
  },
  {
    label: "تلگرام",
    href: "https://t.me",
    icon: FaTelegramPlane,
  },
  {
    label: "واتساپ",
    href: "https://wa.me/989121234567",
    icon: FaWhatsapp,
  },
];

export default function LuxuryFooter() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!rootRef.current) return;

    let observer: IntersectionObserver | null = null;
    let safetyTimer: ReturnType<typeof window.setTimeout> | null = null;
    let rafId: number | null = null;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const root = rootRef.current;
      if (!root) return;

      const lines = root.querySelectorAll(".footer-line");
      const reveals = root.querySelectorAll(".footer-reveal");
      const chars = root.querySelectorAll(".brand-char");
      const navItems = root.querySelectorAll(".footer-nav-item");
      const socials = root.querySelectorAll(".footer-social");
      const slider = root.querySelector(".footer-slider");
      const sliderMessages = root.querySelectorAll(".footer-slider-message");
      const centerMessage = root.querySelector(".footer-slider-message-center");
      const sideMessages = root.querySelectorAll(".footer-slider-message-side");
      const bottom = root.querySelector(".footer-bottom");

      const allAnimatedElements = [
        lines,
        reveals,
        chars,
        navItems,
        socials,
        slider,
        sliderMessages,
        bottom,
      ];

      if (prefersReducedMotion) {
        gsap.set(allAnimatedElements, {
          opacity: 1,
          y: 0,
          scaleX: 1,
          filter: "blur(0px)",
          clearProps: "transform,filter,opacity",
        });

        return;
      }

      gsap.set(lines, {
        scaleX: 0,
        opacity: 0,
        transformOrigin: "center center",
      });

      gsap.set(slider, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      });

      gsap.set(sliderMessages, {
        opacity: 0,
        y: 10,
        filter: "blur(6px)",
      });

      gsap.set([reveals, navItems, socials, bottom], {
        opacity: 0,
        y: 9,
        filter: "blur(5px)",
      });

      gsap.set(chars, {
        opacity: 0,
        y: 8,
        filter: "blur(4px)",
      });

      const tl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power3.out",
        },
      });

      tl.to(centerMessage, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.62,
      })
        .to(
          sideMessages,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.55,
            stagger: 0.09,
          },
          "-=0.24"
        )
        .to(
          lines,
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.62,
            stagger: 0.08,
          },
          "-=0.28"
        )
        .to(
          reveals,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.55,
            stagger: 0.045,
          },
          "-=0.32"
        )
        .to(
          chars,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.52,
            stagger: 0.026,
          },
          "-=0.34"
        )
        .to(
          navItems,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.42,
            stagger: 0.032,
          },
          "-=0.2"
        )
        .to(
          socials,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.4,
            stagger: 0.032,
          },
          "-=0.14"
        )
        .to(
          bottom,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.45,
          },
          "-=0.05"
        );

      let hasPlayed = false;

      const playFooter = () => {
        if (hasPlayed) return;
        hasPlayed = true;
        tl.play(0);
      };

      const isFooterInViewport = () => {
        const rect = root.getBoundingClientRect();

        return (
          rect.top < window.innerHeight * 0.96 &&
          rect.bottom > window.innerHeight * 0.04
        );
      };

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];

            if (entry?.isIntersecting) {
              playFooter();
              observer?.disconnect();
            }
          },
          {
            threshold: 0.08,
            rootMargin: "0px 0px -6% 0px",
          }
        );

        observer.observe(root);
      }

      rafId = window.requestAnimationFrame(() => {
        if (isFooterInViewport()) {
          playFooter();
        }
      });

      safetyTimer = window.setTimeout(() => {
        if (isFooterInViewport()) {
          playFooter();
        }
      }, 700);
    }, rootRef);

    return () => {
      observer?.disconnect();

      if (safetyTimer !== null) {
        window.clearTimeout(safetyTimer);
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      ctx.revert();
    };
  }, []);

  return (
   <footer
  dir="rtl"
  ref={rootRef}
  className={`${vazir.className} relative w-full overflow-hidden bg-[#FFFFFF] text-[#33383C] antialiased`}
>

      <section className="relative w-full border-y border-[#33383C]/[0.055]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="footer-line absolute inset-x-0 top-0 h-px scale-y-[0.5] bg-gradient-to-r from-transparent via-[#33383C]/[0.09] to-transparent" />
          <div className="footer-line absolute inset-x-0 bottom-0 h-px scale-y-[0.5] bg-gradient-to-r from-transparent via-[#33383C]/[0.075] to-transparent" />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-5 py-14 text-center sm:px-8 sm:py-16 md:py-20">
          <div
            aria-label="ویژگی‌های فروشگاه"
            className="footer-slider grid w-full max-w-[620px] grid-cols-3 items-center justify-center gap-2 text-center sm:gap-7"
          >
            {topMessages.map((message, index) => {
              const isCenter = index === 1;

              return (
                <div
                  key={message}
                  className={`footer-slider-message ${
                    isCenter
                      ? "footer-slider-message-center"
                      : "footer-slider-message-side"
                  } flex min-w-0 items-center justify-center`}
                >
                  <span className="block truncate whitespace-nowrap text-[12.5px] font-light tracking-[0.012em] text-[#33383C] sm:text-[14px]">
                    {message}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="footer-reveal mt-12 flex w-full flex-col items-center justify-center text-center">
            <Link
              href="/"
              aria-label="Maison"
              className="group/brand inline-flex flex-col items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33383C]/15 focus-visible:ring-offset-8 focus-visible:ring-offset-white"
            >
              <h2
                dir="ltr"
                className="flex items-center justify-center font-serif text-[35px] font-normal leading-none tracking-[0.2em] text-[#33383C] transition-[letter-spacing,color] duration-700 ease-out group-hover/brand:tracking-[0.212em] sm:text-[48px] md:text-[62px]"
              >
                {"MAISON".split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className="brand-char inline-flex items-center justify-center"
                  >
                    {char}
                  </span>
                ))}
              </h2>
            </Link>

            <p className="footer-reveal mt-8 text-[13px] font-light leading-8 text-[#33383C] sm:text-[14px]">
              آرام. دقیق. ماندگار.
            </p>
          </div>

          <nav
            aria-label="لینک‌های فوتر"
            className="footer-reveal mt-16 flex w-full items-center justify-center"
          >
            <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-center sm:gap-x-12">
              {quickLinks.map((item) => (
                <li
                  key={item.href}
                  className="footer-nav-item flex items-center justify-center"
                >
                  <Link
                    href={item.href}
                    className="group/footer relative inline-flex items-center justify-center rounded-sm text-[12.5px] font-light text-[#33383C] transition-colors duration-300 hover:text-[#33383C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33383C]/15 focus-visible:ring-offset-8 focus-visible:ring-offset-white"
                  >
                    <span>{item.label}</span>
                    <span className="absolute left-1/2 top-[calc(100%+8px)] h-px w-0 -translate-x-1/2 bg-[#33383C]/25 transition-all duration-500 ease-out group-hover/footer:w-[42%]" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-11 flex items-center justify-center gap-6">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="footer-social inline-flex h-6 w-6 items-center justify-center rounded-sm text-[#33383C] transition-colors duration-300 hover:text-[#33383C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33383C]/15 focus-visible:ring-offset-6 focus-visible:ring-offset-white"
                >
                  <Icon className="h-[11.5px] w-[11.5px]" />
                </Link>
              );
            })}
          </div>

          <div className="footer-bottom mt-14 flex w-full flex-col items-center justify-center border-t border-[#33383C]/[0.06] pt-8 text-center sm:mt-16">
            <span className="text-[11px] font-light tracking-[0.01em] text-[#33383C]">
              © 2026 Maison. تمامی حقوق محفوظ است.
            </span>
          </div>
        </div>
      </section>
    </footer>
  );
}
