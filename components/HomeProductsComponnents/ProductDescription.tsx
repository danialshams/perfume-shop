"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Props = {
  description?: string;
  compact?: boolean;
  className?: string;
  desktop?: boolean;
};

function normalizeDescription(description?: string) {
  if (!description) return "";

  const value = description.trim();

  if (!value) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(value);

  if (hasHtml) {
    return value;
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => {
      return `<p>${paragraph.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

export default function ProductDescription({
  description,
  compact = false,
  className,
  desktop = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const normalizedHtml = useMemo(() => {
    return normalizeDescription(description);
  }, [description]);

  useLayoutEffect(() => {
    if (!normalizedHtml) return;

    gsap.registerPlugin(ScrollTrigger);

    const sectionEl = sectionRef.current;
    const titleEl = titleRef.current;
    const bodyEl = bodyRef.current;

    if (!sectionEl || !titleEl || !bodyEl) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set([titleEl, bodyEl], {
          opacity: 1,
          filter: "blur(0px)",
          clearProps: "transform",
        });

        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: "top 85%",
          once: true,
        },
      });

      timeline
        .fromTo(
          titleEl,
          {
            opacity: 0,
            filter: "blur(10px)",
          },
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "power2.out",
          },
        )
        .fromTo(
          bodyEl,
          {
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
              setupScrollColorEffect(bodyEl);
            },
          },
          "-=0.8",
        );
    }, sectionEl);

    function setupScrollColorEffect(container: HTMLDivElement) {
      const excludedTags = new Set([
        "IMG",
        "PICTURE",
        "VIDEO",
        "AUDIO",
        "IFRAME",
        "SVG",
        "CANVAS",
        "PRE",
        "CODE",
        "SCRIPT",
        "STYLE",
      ]);

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const text = node.textContent;

            if (!text || !text.trim()) {
              return NodeFilter.FILTER_REJECT;
            }

            const parent = node.parentElement;

            if (!parent) {
              return NodeFilter.FILTER_REJECT;
            }

            if (excludedTags.has(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }

            if (parent.closest("pre, code, script, style")) {
              return NodeFilter.FILTER_REJECT;
            }

            if (parent.classList.contains("scroll-color-word")) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      const textNodes: Text[] = [];
      let node: Node | null;

      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      const words: HTMLElement[] = [];

      textNodes.forEach((textNode) => {
        const parent = textNode.parentElement;

        if (!parent) return;

        const text = textNode.textContent || "";
        const parts = text.split(/(\s+)/);

        const tempContainer = document.createElement("span");
        tempContainer.style.display = "inline";

        parts.forEach((part) => {
          if (!part) return;

          const span = document.createElement("span");
          span.textContent = part;
          span.style.display = "inline";
          span.style.color = "#ACB2B4";
          span.style.transition = "none";
          span.className = "scroll-color-word";

          tempContainer.appendChild(span);

          if (part.trim()) {
            words.push(span);
          }
        });

        parent.replaceChild(tempContainer, textNode);
      });

      words.forEach((word, index) => {
        const progress = index / Math.max(words.length - 1, 1);
        const offset = 200;

        gsap.to(word, {
          scrollTrigger: {
            trigger: container,
            start: `top+=${progress * container.offsetHeight} bottom-=${offset}`,
            end: `top+=${progress * container.offsetHeight} top+=${offset}`,
            scrub: 0.5,
            onUpdate: (self) => {
              const progressValue = self.progress;

              const startColor = { r: 172, g: 178, b: 180 };
              const endColor = { r: 51, g: 56, b: 60 };

              const r = Math.round(
                startColor.r + (endColor.r - startColor.r) * progressValue,
              );

              const g = Math.round(
                startColor.g + (endColor.g - startColor.g) * progressValue,
              );

              const b = Math.round(
                startColor.b + (endColor.b - startColor.b) * progressValue,
              );

              word.style.color = `rgb(${r}, ${g}, ${b})`;
            },
          },
        });
      });

      ScrollTrigger.refresh();
    }

    return () => {
      ctx.revert();
    };
  }, [normalizedHtml]);

  if (!normalizedHtml) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className={[
        desktop ? "hidden lg:block" : "lg:hidden",
        className ?? "",
      ].join(" ")}
    >
      <div
        className={[
          "w-full text-right",
          desktop ? "" : "px-12 sm:px-16",
        ].join(" ")}
      >
        <h2
          ref={titleRef}
          className={[
            "m-0",
            "bg-gradient-to-b from-[#1b3a6b] via-[#0f2547] to-[#081427]",
            "bg-clip-text font-extralight text-[#33383C] text-transparent",
            "leading-[1.4] tracking-[0.06em]",
            desktop ? "text-[26px]" : "text-[21px]",
          ].join(" ")}
          style={{
            willChange: "opacity, filter",
          }}
        >
          درباره این عطر
        </h2>

        <div className={desktop ? "pt-8" : "pt-6"}>
          <div
            ref={bodyRef}
            className={[
              desktop
                ? "max-w-[600px] text-[15.5px] leading-[2.15] text-[#ACB2B4]"
                : "w-full text-[14.5px] leading-[2.2] text-[#ACB2B4]",
              compact ? "text-[14px]" : "",

              "font-light tracking-[0.02em]",
              "break-words text-right [direction:rtl] [text-align:right]",

              "[&_*]:max-w-full",

              "[&_p]:m-0",
              "[&_p]:mb-7",
              "[&_p]:block",

              "[&_br]:block",
              "[&_br]:content-['']",
              "[&_br]:mb-3",

              "[&_div]:block",
              "[&_div]:w-full",

              "[&_span]:inline",

              "[&_strong]:font-normal",
              "[&_b]:font-normal",
              "[&_strong]:text-[#3a3a40]",
              "[&_b]:text-[#3a3a40]",

              "[&_em]:italic",

              "[&_ul]:my-6",
              "[&_ul]:list-disc",
              "[&_ul]:space-y-3",
              "[&_ul]:pr-6",

              "[&_ol]:my-6",
              "[&_ol]:list-decimal",
              "[&_ol]:space-y-3",
              "[&_ol]:pr-6",

              "[&_li]:leading-[2]",

              "[&_blockquote]:my-7",
              "[&_blockquote]:border-r-2",
              "[&_blockquote]:border-[#1b3a6b]",
              "[&_blockquote]:pr-4",
              "[&_blockquote]:text-[#4f5961]",

              "[&_pre]:my-7",
              "[&_pre]:overflow-x-auto",
              "[&_pre]:rounded-xl",
              "[&_pre]:bg-[#111827]",
              "[&_pre]:p-4",
              "[&_pre]:text-left",
              "[&_pre]:text-[13px]",
              "[&_pre]:leading-7",
              "[&_pre]:text-white",
              "[&_pre]:[direction:ltr]",

              "[&_code]:rounded",
              "[&_code]:bg-neutral-100",
              "[&_code]:px-1.5",
              "[&_code]:py-0.5",
              "[&_code]:text-[13px]",
              "[&_code]:text-[#1f2937]",

              "[&_pre_code]:bg-transparent",
              "[&_pre_code]:p-0",
              "[&_pre_code]:text-white",

              "[&_hr]:my-8",
              "[&_hr]:border-0",
              "[&_hr]:border-t",
              "[&_hr]:border-[#dde3e8]",

              "[&_h1]:mb-4",
              "[&_h1]:mt-8",
              "[&_h1]:text-[21px]",
              "[&_h1]:font-extralight",
              "[&_h1]:tracking-[0.04em]",
              "[&_h1]:text-[#23211f]",

              "[&_h2]:mb-4",
              "[&_h2]:mt-8",
              "[&_h2]:text-[19px]",
              "[&_h2]:font-extralight",
              "[&_h2]:tracking-[0.04em]",
              "[&_h2]:text-[#23211f]",

              "[&_h3]:mb-3",
              "[&_h3]:mt-6",
              "[&_h3]:text-[16.5px]",
              "[&_h3]:font-light",
              "[&_h3]:tracking-[0.03em]",
              "[&_h3]:text-[#23211f]",

              "[&_h4]:mb-3",
              "[&_h4]:mt-5",
              "[&_h4]:text-[15px]",
              "[&_h4]:font-light",
              "[&_h4]:text-[#23211f]",

              "[&_a]:text-[#1b3a6b]",
              "[&_a]:underline",
              "[&_a]:decoration-[#c3d2e8]",
              "[&_a]:underline-offset-4",

              "[&_img]:my-6",
              "[&_img]:mx-auto",
              "[&_img]:block",
              "[&_img]:h-auto",
              "[&_img]:max-h-[520px]",
              "[&_img]:max-w-full",
              "[&_img]:rounded-2xl",
              "[&_img]:object-contain",

              "[&>p:first-child]:mt-0",
              "[&>*:first-child]:mt-0",
              "[&>*:last-child]:mb-0",
            ].join(" ")}
            style={{
              willChange: "opacity, filter",
            }}
            dangerouslySetInnerHTML={{
              __html: normalizedHtml,
            }}
          />

          <div className={desktop ? "h-4" : "h-3"} />
        </div>
      </div>
    </section>
  );
}
