"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductsFilterBar from "./ProductsFilterBar";

gsap.registerPlugin(ScrollTrigger);

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
  parent_ids: number[];
  parent_names: string[];
  children_count?: number;
  has_children: boolean;
};

type Props = {
  categories: Category[];
  activeParentId: number | null;
  activeChildId: number | null;
  setActiveParentId: (id: number | null) => void;
  setActiveChildId: (id: number | null) => void;
  loadingCategories?: boolean;
};

export default function ProductsFilterTransition({
  categories,
  activeParentId,
  activeChildId,
  setActiveParentId,
  setActiveChildId,
  loadingCategories = false,
}: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pinWrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current || !pinWrapRef.current || !panelRef.current) return;

    const navbarEl =
      document.querySelector(".luxury-navbar") ||
      document.querySelector("header") ||
      document.querySelector("nav");

    const getNavbarHeight = () => {
      if (!navbarEl) return 72;
      return (navbarEl as HTMLElement).offsetHeight || 72;
    };

    const ctx = gsap.context(() => {
      const section = sectionRef.current!;
      const pinWrap = pinWrapRef.current!;
      const panel = panelRef.current!;
      const bg = bgRef.current;

      const applyInitial = () => {
        const navH = getNavbarHeight();

        gsap.set(pinWrap, {
          paddingTop: navH + 10,
        });

        gsap.set(panel, {
          y: 110,
          opacity: 0,
          scale: 0.985,
          filter: "blur(10px)",
        });

        if (bg) {
          gsap.set(bg, {
            opacity: 0,
          });
        }
      };

      applyInitial();

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=260",
          scrub: 1,
          pin: pinWrap,
          pinSpacing: true,
          pinReparent: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        panel,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
        },
        0,
      );

      if (bg) {
        tl.to(
          bg,
          {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
          },
          0,
        );
      }

      const handleResize = () => {
        applyInitial();
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-30 bg-white"
      style={{ minHeight: "320px" }}
    >
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.58)_32%,rgba(255,255,255,0.88)_64%,rgba(255,255,255,1)_100%)]"
      />

      <div
        ref={pinWrapRef}
        className="relative flex min-h-[320px] items-start justify-center px-3 sm:px-4"
      >
        <div ref={panelRef} className="w-full max-w-7xl">
          <ProductsFilterBar
            categories={categories}
            activeParentId={activeParentId}
            activeChildId={activeChildId}
            setActiveParentId={setActiveParentId}
            setActiveChildId={setActiveChildId}
            loadingCategories={loadingCategories}
          />
        </div>
      </div>
    </section>
  );
}
