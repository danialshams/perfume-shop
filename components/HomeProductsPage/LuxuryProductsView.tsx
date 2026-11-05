"use client";

import LuxuryNavbar from "@/components/home-sections/navbar";
import { useMemo, useState } from "react";
import type { SortOption } from "@/components/HomeProductsComponnents/MobileSortSheet";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import ProductsFilterBar from "@/components/HomeProductsComponnents/ProductsFilterBar";
import ProductsSection from "@/components/HomeProductsComponnents/ProductsSection";
import { useProductsPageData } from "@/components/hooks/useProductsPageData";

export default function LuxuryProductsView() {
  const [selectedSort, setSelectedSort] = useState<SortOption>("newest");
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
    activeScentFamily,
  } = useProductsPageData();

  const orderedProducts = useMemo(() => {
    if (selectedSort === "newest") return filteredProducts;
    const priceOf = (product: (typeof filteredProducts)[number]) => {
      const prices = product.variants
        .map(variant => {
          const discount = Number(variant.rawDiscountPrice);
          const regular = Number(variant.rawPrice);
          return discount > 0 ? discount : regular > 0 ? regular : null;
        })
        .filter((price): price is number => price !== null);
      return prices.length ? Math.min(...prices) : null;
    };
    return [...filteredProducts].sort((a, b) => {
      if (selectedSort === "bestselling")
        return Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller));
      const aPrice = priceOf(a), bPrice = priceOf(b);
      if (aPrice === null) return bPrice === null ? 0 : 1;
      if (bPrice === null) return -1;
      return selectedSort === "lowest" ? aPrice - bPrice : bPrice - aPrice;
    });
  }, [filteredProducts, selectedSort]);

  return <div className="ql-shop min-h-screen">
    <LuxuryNavbar />
    <main className="ql-shop-main" id="main-content">
      <div className="ql-container ql-shop-heading">
        <span className="ql-overline" lang="en" dir="ltr">MAISON — ALL FRAGRANCES</span>
        <h1>{activeScentFamily?.name || "کالکشن عطرها"}</h1>
        <p>دنیایی از رایحه‌ها برای کشف‌کردن. بر اساس سلیقه‌تان جستجو کنید و جزئیات هر عطر را ببینید.</p>
      </div>
      <div className="ql-container">
        <div className="ql-shop-filter">
          <ProductsFilterBar
            categories={categories}
            activeParentId={activeParentId}
            activeChildId={activeChildId}
            setActiveParentId={setActiveParentId}
            setActiveChildId={setActiveChildId}
            loadingCategories={loadingCategories}
            activeFilterLabel={activeScentFamily?.name ?? null}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
          />
        </div>
        <div className="ql-products-grid-section">
          <ProductsSection
            loadingProducts={loadingProducts}
            filteredProducts={orderedProducts}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
          />
        </div>
      </div>
    </main>
    <CinematicFooter />
  </div>;
}
