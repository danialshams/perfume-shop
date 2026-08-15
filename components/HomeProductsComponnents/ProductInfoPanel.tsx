"use client";

import { Product } from "@/lib/product";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoAdd, IoRemove } from "react-icons/io5";

type Props = {
  product: Product;
  isVariantLoading?: boolean;
  detailsOpen?: boolean;
  defaultOpen?: boolean;
};

type StoryItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

function ProductInfoSkeleton() {
  return (
    <>
      {/* موبایل: هم‌راستا با پدینگ هدر VoiceCard */}
      <div className="px-7 pt-3.5 sm:px-10 sm:pt-4 lg:hidden">
        <div className="animate-pulse space-y-5">
          <div className="h-4 w-40 rounded-full bg-[#efece6]" />
          <div className="h-3 w-full max-w-[280px] rounded-full bg-[#f5f3ee]" />
          <div className="h-3 w-32 rounded-full bg-[#f5f3ee]" />
        </div>

        <div className="mt-5 h-px w-full bg-[#e9e4dc] sm:mt-6" />
      </div>

      {/* دسکتاپ */}
      <div className="hidden lg:block lg:px-16 lg:pt-4">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-52 rounded-full bg-[#efece6]" />
          <div className="h-3.5 w-full max-w-[420px] rounded-full bg-[#f5f3ee]" />
        </div>

        <div className="mt-6 h-px w-full bg-[#e9e4dc]" />
      </div>
    </>
  );
}

function normalizeNote(value: unknown) {
  if (typeof value === "string") return value.trim();
  return "";
}

function buildAssetUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url;
}

export function getProductStoryItems(product: Product): StoryItem[] {
  const scentFamily = normalizeNote((product as any)?.scent_family);
  const scentFamilyDescription = normalizeNote(
    (product as any)?.scent_family_description,
  );
  const scentFamilyImage = normalizeNote((product as any)?.scent_family_image);

  return [
    {
      id: "family",
      eyebrow: "خانواده بویایی",
      title: scentFamily || "خانواده بویایی",
      description: scentFamilyDescription,
      image: scentFamilyImage,
    },
  ].filter((item) => item.title || item.description || item.image);
}

function MobileScentStory({
  items,
  detailsOpen = true,
}: {
  items: StoryItem[];
  detailsOpen?: boolean;
}) {
  const storyRef = useRef<HTMLDivElement | null>(null);

  const familyItem = items.find((item) => item.id === "family");

  useLayoutEffect(() => {
    const storyElement = storyRef.current;

    if (!storyElement || items.length === 0 || !detailsOpen) {
      return;
    }

    const ctx = gsap.context(() => {
      const timelineMap = new Map<HTMLElement, gsap.core.Timeline>();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const section = entry.target as HTMLElement;
            const timeline = timelineMap.get(section);

            if (!timeline) return;

            if (entry.isIntersecting && section.offsetHeight > 0) {
              timeline.play(0);
              observer.unobserve(section);
              timelineMap.delete(section);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -18% 0px",
          threshold: 0,
        },
      );

      const getInitialState = (direction: "left" | "right") => ({
        autoAlpha: 0,
        x: direction === "right" ? 100 : -100,
        filter: "blur(8px)",
      });

      const createStoryTimeline = ({
        section,
        elements,
      }: {
        section: HTMLElement;
        elements: HTMLElement[];
      }) => {
        if (elements.length === 0) return;

        elements.forEach((element) => {
          const direction =
            element.dataset.mobileStoryFrom === "right" ? "right" : "left";

          gsap.set(element, {
            ...getInitialState(direction),
            willChange: "transform, opacity, filter",
          });
        });

        const timeline = gsap.timeline({
          paused: true,
          defaults: {
            ease: "power3.out",
          },
          onComplete: () => {
            gsap.set(elements, {
              clearProps: "willChange",
            });
          },
        });

        elements.forEach((element, index) => {
          const direction =
            element.dataset.mobileStoryFrom === "right" ? "right" : "left";

          const isImage = element.dataset.mobileStoryType === "image";

          timeline.fromTo(
            element,
            getInitialState(direction),
            {
              autoAlpha: 1,
              x: 0,
              filter: "blur(0px)",
              duration: isImage ? 1.15 : 0.9,
              ease: "power3.out",
            },
            index * 0.2,
          );
        });

        timelineMap.set(section, timeline);
        observer.observe(section);
      };

      const familySection =
        storyElement.querySelector<HTMLElement>(".pd-story-family");

      if (familySection) {
        const familyElements = [
          familySection.querySelector<HTMLElement>(
            '[data-family-part="eyebrow"]',
          ),
          familySection.querySelector<HTMLElement>('[data-family-part="title"]'),
          familySection.querySelector<HTMLElement>(
            '[data-family-part="description"]',
          ),
          familySection.querySelector<HTMLElement>('[data-family-part="image"]'),
        ].filter((element): element is HTMLElement => Boolean(element));

        createStoryTimeline({
          section: familySection,
          elements: familyElements,
        });
      }

      return () => {
        observer.disconnect();
        timelineMap.clear();
      };
    }, storyElement);

    return () => {
      ctx.revert();
    };
  }, [items, detailsOpen]);

  if (items.length === 0 || !familyItem) {
    return null;
  }

  return (
    <div
      ref={storyRef}
      className="pd-mobile-story mx-auto mt-10 w-full overflow-x-hidden lg:hidden"
    >
      <section className="pd-story-family mb-10 w-full text-center">
        {/* پدینگ افقی هم‌راستا با هدر: px-7 / sm:px-10 */}
        <div className="mx-auto max-w-[560px] px-7 sm:px-10">
          <div
            data-family-part="eyebrow"
            data-mobile-story-from="right"
            className="mb-3 flex items-center justify-center gap-3"
          >
            <span className="h-px w-8 bg-gradient-to-l from-[#c9b489] to-transparent" />
            <span
              className="text-[12.5px] leading-[2] text-[#b49b68]"
              style={{
                fontWeight: 300,
                letterSpacing: "0",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {familyItem.eyebrow}
            </span>
            <span className="h-px w-8 bg-gradient-to-r from-[#c9b489] to-transparent" />
          </div>

          <h2
            data-family-part="title"
            data-mobile-story-from="left"
            className="bg-gradient-to-b from-[#24405f] via-[#14294a] to-[#0a1a2e] bg-clip-text pb-[3px] text-[22px] leading-[1.85] text-transparent sm:text-[24px]"
            style={{
              fontWeight: 300,
              letterSpacing: "0",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {familyItem.title}
          </h2>

          {familyItem.description && (
            <p
              data-family-part="description"
              data-mobile-story-from="right"
              className="mt-4 text-[14.5px] leading-[2.15] text-[#565b67] sm:text-[15.5px]"
              style={{
                fontWeight: 300,
                letterSpacing: "0",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {familyItem.description}
            </p>
          )}
        </div>

        {familyItem.image && (
          <div
            data-family-part="image"
            data-mobile-story-from="right"
            data-mobile-story-type="image"
            className="relative left-1/2 right-1/2 -mx-[50vw] mb-6 mt-7 w-screen overflow-hidden bg-[#f4f0e8]"
          >
            <Image
              src={buildAssetUrl(familyItem.image)}
              alt={familyItem.title}
              className="block h-auto w-full"
              loading="lazy"
              width={250}
              height={250}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function DesktopScentStory({
  items,
  detailsOpen = true,
}: {
  items: StoryItem[];
  detailsOpen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const familyItem = items.find((item) => item.id === "family");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!containerRef.current || items.length === 0 || !detailsOpen) {
      return;
    }

    const modalScroller = containerRef.current.closest("aside");

    const ctx = gsap.context(() => {
      const buildSideReveal = ({
        section,
        imageSelector,
        textSelector,
        imageFromX,
        textFromX,
        start = "top 78%",
      }: {
        section: HTMLElement;
        imageSelector: string;
        textSelector: string;
        imageFromX: string;
        textFromX: string;
        start?: string;
      }) => {
        const image = section.querySelector<HTMLElement>(imageSelector);

        const textItems = gsap.utils.toArray<HTMLElement>(textSelector, section);

        if (image) {
          gsap.set(image, {
            opacity: 0,
            x: imageFromX,
            filter: "blur(10px)",
            willChange: "transform, opacity, filter",
          });
        }

        if (textItems.length > 0) {
          gsap.set(textItems, {
            opacity: 0,
            x: textFromX,
            filter: "blur(8px)",
            willChange: "transform, opacity, filter",
          });
        }

        const timeline = gsap.timeline({
          paused: true,
          defaults: {
            ease: "power3.out",
          },
          onComplete: () => {
            gsap.set([image, ...textItems].filter(Boolean), {
              willChange: "auto",
            });
          },
        });

        if (image) {
          timeline.to(image, {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 1.1,
          });
        }

        if (textItems.length > 0) {
          timeline.to(
            textItems,
            {
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              duration: 0.95,
              stagger: 0.12,
            },
            image ? "-=0.75" : 0,
          );
        }

        ScrollTrigger.create({
          trigger: section,
          scroller: modalScroller || undefined,
          start,
          once: true,
          onEnter: () => timeline.play(0),
        });
      };

      const familySection = containerRef.current?.querySelector<HTMLElement>(
        ".scent-family-full-section",
      );

      if (familySection) {
        buildSideReveal({
          section: familySection,
          imageSelector: ".scent-family-full-image",
          textSelector: ".scent-family-full-text-item",
          imageFromX: "100%",
          textFromX: "-100%",
          start: "top 78%",
        });
      }

      window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 50);
    }, containerRef);

    return () => ctx.revert();
  }, [items.length, detailsOpen]);

  if (items.length === 0 || !familyItem) return null;

  return (
    <div ref={containerRef} className="hidden w-full lg:block">
      <section className="scent-family-full-section mb-16 flex flex-col items-center">
        <div className="mb-10 max-w-3xl px-16 text-center">
          <div className="scent-family-full-text-item flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-gradient-to-l from-[#c9b489] to-transparent" />
            <span
              className="text-[13px] leading-[2.05] text-[#b49b68]"
              style={{
                fontWeight: 300,
                letterSpacing: "0",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {familyItem.eyebrow}
            </span>
            <span className="h-px w-10 bg-gradient-to-r from-[#c9b489] to-transparent" />
          </div>

          <h2
            className="scent-family-full-text-item mt-4 bg-gradient-to-b from-[#24405f] via-[#14294a] to-[#0a1a2e] bg-clip-text pb-[3px] text-[32px] leading-[1.7] text-transparent"
            style={{
              fontWeight: 300,
              letterSpacing: "0",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {familyItem.title}
          </h2>

          {familyItem.description && (
            <p
              className="scent-family-full-text-item mt-5 text-[16px] leading-[2.15] text-[#565b67]"
              style={{
                fontWeight: 300,
                letterSpacing: "0",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {familyItem.description}
            </p>
          )}
        </div>

        {familyItem.image && (
          <div className="scent-family-full-image relative -mx-[52px] w-[calc(100%+104px)] overflow-hidden bg-[#f4f0e8]">
            <img
              src={buildAssetUrl(familyItem.image)}
              alt={familyItem.title}
              className="block h-auto w-full"
              loading="lazy"
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProductInfoPanel({
  product,
  isVariantLoading = false,
  detailsOpen = true,
  defaultOpen = false,
}: Props) {
  const panelId = useId();

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lineActiveRef = useRef<HTMLSpanElement>(null);

  const openTweenRef = useRef<gsap.core.Timeline | null>(null);

  const [isOpen, setIsOpen] = useState(defaultOpen);

  const storyItems = useMemo(() => getProductStoryItems(product), [product]);

  const hasStory = storyItems.length > 0;

  useLayoutEffect(() => {
    if (isVariantLoading || !hasStory) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const header = headerRef.current;

    if (!section || !header) return;

    const context = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 20,
        filter: "blur(6px)",
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            once: true,
          },
        })
        .to(header, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
        });
    }, section);

    return () => context.revert();
  }, [isVariantLoading, hasStory, product.id]);

  useLayoutEffect(() => {
    if (isVariantLoading || !hasStory) return;

    const panel = panelRef.current;
    const body = bodyRef.current;
    const chevron = chevronRef.current;
    const activeLine = lineActiveRef.current;

    if (!panel || !body || !chevron || !activeLine) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(panel, {
        height: defaultOpen ? "auto" : 0,
      });

      gsap.set(body, {
        opacity: defaultOpen ? 1 : 0,
        y: defaultOpen ? 0 : 14,
        filter: defaultOpen ? "blur(0px)" : "blur(6px)",
      });

      gsap.set(chevron, {
        rotation: defaultOpen ? 180 : 0,
        transformOrigin: "center center",
      });

      gsap.set(activeLine, {
        scaleX: defaultOpen ? 1 : 0,
        transformOrigin: "center center",
        force3D: true,
      });

      const timeline = gsap.timeline({
        paused: true,
      });

      timeline
        .to(
          panel,
          {
            height: "auto",
            duration: 0.8,
            ease: "power3.inOut",
          },
          0,
        )
        .to(
          chevron,
          {
            rotation: 180,
            duration: 0.8,
            ease: "power3.inOut",
            transformOrigin: "center center",
          },
          0,
        )
        .to(
          body,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          },
          0.2,
        )
        .to(
          activeLine,
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power2.inOut",
            force3D: true,
          },
          0.3,
        );

      openTweenRef.current = timeline;

      if (defaultOpen) {
        timeline.progress(1);
      }
    }, panel);

    return () => {
      openTweenRef.current = null;
      context.revert();
    };
  }, [isVariantLoading, hasStory, defaultOpen]);

  useLayoutEffect(() => {
    const timeline = openTweenRef.current;

    if (!timeline) return;

    if (isOpen) {
      timeline.timeScale(1).play();
    } else {
      timeline.timeScale(1).reverse();
    }

    const timeoutId = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  return (
    <section ref={sectionRef} dir="rtl" className="order-1 w-full lg:order-2">
      {isVariantLoading || !hasStory ? (
        <ProductInfoSkeleton />
      ) : (
        <div className="w-full text-right">
          <button
            ref={headerRef}
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="group relative flex w-full items-center justify-between gap-6 px-7 py-3.5 outline-none sm:px-10 sm:py-4 lg:px-16"
          >
            <span
              className={[
                "max-w-[80%] bg-gradient-to-b from-[#24405f] via-[#14294a] to-[#0a1a2e]",
                "bg-clip-text pb-[3px] text-right text-transparent",
                "transition-opacity duration-700 ease-out group-hover:opacity-85",
                "text-[14.5px] leading-[2] sm:text-[15.5px] lg:text-[18px] lg:leading-[2.05]",
              ].join(" ")}
              style={{
                fontWeight: 300,
                letterSpacing: "0",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <span style={{ opacity: 0.72 }}>ساختار</span>{" "}
              <span style={{ fontWeight: 400 }}>رایحه</span>
            </span>

            <div
              ref={chevronRef}
              aria-hidden="true"
              className="shrink-0 text-[#7d8189] opacity-45 transition-opacity duration-500 ease-out group-hover:opacity-80"
              style={{ willChange: "transform" }}
            >
              {isOpen ? <IoRemove size={14} /> : <IoAdd size={14} />}
            </div>
          </button>

          <div
            ref={panelRef}
            id={panelId}
            className="overflow-hidden"
            style={{ height: 0 }}
          >
            <div ref={bodyRef} className="pt-2 lg:pt-3">
              <div className="w-full">
                <div className="text-center lg:hidden">
                  <MobileScentStory
                    items={storyItems}
                    detailsOpen={detailsOpen && isOpen}
                  />
                </div>

                <DesktopScentStory
                  items={storyItems}
                  detailsOpen={detailsOpen && isOpen}
                />
              </div>

              <div className="h-2 lg:h-3" />
            </div>
          </div>

          <div className="relative mx-7 mt-5 h-px sm:mx-10 sm:mt-6 lg:mx-16">
            <span className="absolute inset-x-0 top-0 h-px w-full bg-[#e9e4dc]" />

            <span
              ref={lineActiveRef}
              className="absolute inset-x-0 top-0 h-px w-full bg-[#8a8a90]/55"
              style={{ willChange: "transform" }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
