"use client";

import LuxuryNavbar from "@/components/home-sections/navbar";
import Image from "next/image";
import Link from "next/link";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";
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
    productsError,
    reloadProducts,
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

  return <div className="ql-shop maison-catalog min-h-screen">
    <LuxuryNavbar />
    <main className="ql-shop-main" id="main-content">
      <div className="ql-container ql-shop-heading">
        <span className="ql-overline" lang="en" dir="ltr">FERTINI — ALL FRAGRANCES</span>
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
          {!loadingProducts && orderedProducts.length===0 ? (
            <section className="fertini-demo-shelf" aria-label="مجموعه عطرهای نمایشی">
              <div className="fertini-demo-shelf__heading">
                <div><span className="maison-kicker" lang="en" dir="ltr">FERTINI / FRAGRANCE SAMPLES</span><h2>مجموعهٔ فرتینی</h2></div>
                <p>{productsError ? "اتصال محصولات اصلی در این پیش‌نمایش برقرار نیست." : "هنوز محصول قابل‌فروشی ثبت نشده است."} رایحه‌های منتخب را کشف کنید.</p>
                {productsError&&<button type="button" onClick={reloadProducts}>تلاش دوباره برای محصولات واقعی</button>}
              </div>
              <div className="fertini-demo-shelf__grid">
                {[...FERTINI_DEMOS].sort((a,b)=>selectedSort==="lowest" ? a.variants[0].price-b.variants[0].price : selectedSort==="highest" ? b.variants[0].price-a.variants[0].price : 0).map(item=>
                  <Link key={item.id} className="fertini-demo-shelf__card" href={"/fragrance/"+item.id}>
                    <div className="fertini-demo-shelf__photo"><Image fill sizes="(min-width:900px) 30vw, 88vw" src={item.image} alt={item.name}/></div>
                    <div className="fertini-demo-shelf__details"><span lang="en" dir="ltr">{item.subtitle}</span><h3>{item.name}</h3><p>از {item.variants[0].price.toLocaleString("fa-IR")} تومان</p></div>
                  </Link>)}
              </div>
            </section>
          ) : <ProductsSection
            loadingProducts={loadingProducts}
            filteredProducts={orderedProducts}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
          />}
        </div>
      </div>
    </main>
    <CinematicFooter />
  </div>;
}
