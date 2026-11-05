"use client";

import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import ProductsFilterBar from "@/components/HomeProductsComponnents/ProductsFilterBar";
import ProductsSection from "@/components/HomeProductsComponnents/ProductsSection";
import { useProductsPageData } from "@/components/hooks/useProductsPageData";

export default function LuxuryProductsView() {
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
          />
        </div>
        <div className="ql-products-grid-section">
          <ProductsSection
            loadingProducts={loadingProducts}
            filteredProducts={filteredProducts}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
          />
        </div>
      </div>
    </main>
    <CinematicFooter />
  </div>;
}
