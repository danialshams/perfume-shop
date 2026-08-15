"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LuxuryFooter from "../home-sections/LuxuryFooter";
import LuxuryNavbar from "../home-sections/navbar";
import ProductsFilterBar from "../HomeProductsComponnents/ProductsFilterBar";
import ProductsHero from "../HomeProductsComponnents/ProductsHero";
import ProductsSection from "../HomeProductsComponnents/ProductsSection";
import { useProductsPageData } from "../hooks/useProductsPageData";
import { useProductsReveal } from "../hooks/useProductsReveal";

const MOBILE_NAVBAR_H = 88;
const OVERSCROLL_PX = 24;
const TOP_SPACER_H = 40;

export default function LuxuryProductsView() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);

  const searchParams = useSearchParams();
  const scentFamilyId = searchParams.get("scent_family_id");
  const hasScentFamilyFilter = Boolean(scentFamilyId);

  const {
    categories,
    activeParentId,
    activeChildId,
    setActiveParentId,
    setActiveChildId,
    loadingCategories,
    filteredProducts,
    selectedVariants,
    setSelectedVariants,
    loadingProducts,
    activeScentFamily, // دریافت گروه بویایی فعال
  } = useProductsPageData();

  useProductsReveal({
    rootRef,
    loadingProducts,
    filteredProductsLength: filteredProducts.length,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (hasScentFamilyFilter) {
      setMainVisible(true);
      return;
    }

    if (!isMobile || mainVisible) return;

    const onScroll = () => {
      const heroEl = heroRef.current;
      if (!heroEl) return;

      const heroH = heroEl.offsetHeight;

      if (window.scrollY < 10) return;

      const atBottom =
        window.scrollY + window.innerHeight >= heroH + OVERSCROLL_PX;

      if (atBottom) {
        const rect = heroEl.getBoundingClientRect();
        heroEl.style.position = "fixed";
        heroEl.style.top = `${rect.top}px`;
        heroEl.style.left = `${rect.left}px`;
        heroEl.style.width = `${rect.width}px`;
        heroEl.style.zIndex = "1";

        document.body.style.overflow = "hidden";
        setMainVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile, mainVisible, hasScentFamilyFilter]);

  useEffect(() => {
    if (hasScentFamilyFilter) return;
    if (!isMobile || !mainVisible) return;

    const el = mainRef.current;
    if (!el) return;

    el.scrollTop = TOP_SPACER_H;

    const onInnerScroll = () => {
      if (el.scrollTop <= 0) {
        const heroEl = heroRef.current;
        if (heroEl) {
          heroEl.style.position = "";
          heroEl.style.top = "";
          heroEl.style.left = "";
          heroEl.style.width = "";
          heroEl.style.zIndex = "";
        }

        document.body.style.overflow = "";
        setMainVisible(false);

        const heroH = heroEl?.offsetHeight ?? 0;
        window.scrollTo({
          top: Math.max(0, heroH - window.innerHeight),
          behavior: "instant",
        });
      }
    };

    el.addEventListener("scroll", onInnerScroll, { passive: true });
    return () => el.removeEventListener("scroll", onInnerScroll);
  }, [isMobile, mainVisible, hasScentFamilyFilter]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);


  return (
    <div ref={rootRef} style={{ overflowX: "clip" }} className="bg-[#F8F8F8]">
      <style>{`
        .luxury-main-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .luxury-main-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <LuxuryNavbar />

      {isMobile ? (
        <div style={{ overflowX: "clip" }}>
          {!hasScentFamilyFilter && (
            <>
              <div ref={heroRef}>
                <ProductsHero
                  products={filteredProducts}
                  isLoading={loadingProducts}
                  mobileFullscreen
                />
              </div>
              <div aria-hidden style={{ height: `${OVERSCROLL_PX + 2}px` }} />
            </>
          )}

          <main
            ref={mainRef}
            className="luxury-main-scroll bg-[#F8F8F8]"
            style={
              hasScentFamilyFilter
                ? {
                  paddingTop: "12px",
                  paddingBottom: "24px",
                }
                : {
                  position: "fixed",
                  top: `${MOBILE_NAVBAR_H}px`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 40,
                  overflowY: "auto",
                  overflowX: "clip",
                  WebkitOverflowScrolling: "touch",
                  transform: mainVisible ? "translateY(0)" : "translateY(100%)",
                  transition: "transform 2s cubic-bezier(0.45, 0, 0.55, 1)",
                  willChange: "transform",
                }
            }
          >
            {!hasScentFamilyFilter && (
              <div aria-hidden style={{ height: `${TOP_SPACER_H}px`, flexShrink: 0 }} />
            )}

            <div className="sticky top-0 z-40 overflow-hidden bg-[#F8F8F8]">

              <ProductsFilterBar
                categories={categories}
                activeParentId={activeParentId}
                activeChildId={activeChildId}
                setActiveParentId={setActiveParentId}
                setActiveChildId={setActiveChildId}
                loadingCategories={loadingCategories}
                activeFilterLabel={activeScentFamily?.name ?? null}
              />

            </div>

            <ProductsSection
              loadingProducts={loadingProducts}
              filteredProducts={filteredProducts}
              selectedVariants={selectedVariants}
              setSelectedVariants={setSelectedVariants}
            />

            <LuxuryFooter />
          </main>
        </div>
      ) : (
        /* بخش دسکتاپ */
        <div>
          {!hasScentFamilyFilter && (
            <ProductsHero
              products={filteredProducts}
              isLoading={loadingProducts}
            />
          )}

          <div className="sticky top-0 z-40 overflow-hidden bg-[#F8F8F8]">


            <ProductsFilterBar
              categories={categories}
              activeParentId={activeParentId}
              activeChildId={activeChildId}
              setActiveParentId={setActiveParentId}
              setActiveChildId={setActiveChildId}
              loadingCategories={loadingCategories}
              activeFilterLabel={activeScentFamily?.name ?? null}
            />

          </div>

          <ProductsSection
            loadingProducts={loadingProducts}
            filteredProducts={filteredProducts}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
          />

          <LuxuryFooter />
        </div>
      )}
    </div>
  );
}
