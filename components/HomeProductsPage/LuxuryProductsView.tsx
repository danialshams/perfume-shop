"use client";

import LuxuryNavbar from "@/components/home-sections/navbar";
import Image from "next/image";
import Link from "next/link";
import { FERTINI_DEMOS, FERTINI_FAMILIES } from "@/lib/fertini-demo";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { SortOption } from "@/components/HomeProductsComponnents/MobileSortSheet";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import ProductsFilterBar from "@/components/HomeProductsComponnents/ProductsFilterBar";
import ProductsSection from "@/components/HomeProductsComponnents/ProductsSection";
import { useProductsPageData } from "@/components/hooks/useProductsPageData";

export default function LuxuryProductsView({demoMode=false}:{demoMode?:boolean}) {
  const [selectedSort, setSelectedSort] = useState<SortOption>("newest");
  const searchParams = useSearchParams();
  const router = useRouter();
  const familyFromUrl = searchParams.get("family");
  const categoryFromUrl = searchParams.get("category_id");
  const fallbackCategories = FERTINI_FAMILIES.map((family,index)=>({id:index+9001,name:family.name,slug:family.id,parent_ids:[] as number[],parent_names:[] as string[],has_children:false,is_active:true}));
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

  useEffect(() => {
    if (!categoryFromUrl || loadingCategories) return;
    const categoryId = Number(categoryFromUrl);
    if (Number.isSafeInteger(categoryId) && categoryId > 0 && categories.some(x => x.id === categoryId)) {
      setActiveParentId(categoryId);
      setActiveChildId(null);
    }
  }, [categoryFromUrl, categories, loadingCategories, setActiveParentId, setActiveChildId]);

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

  // The demo shelf is exclusively for an unconfigured showcase, never a failed live catalog.
  const sampleMode=demoMode&&categories.length===0;
  const sampleFamilyFromFilter=fallbackCategories.find(category=>category.id===activeParentId)?.slug;
  const selectedSampleFamily=sampleFamilyFromFilter||familyFromUrl;
  const currentFamily=FERTINI_FAMILIES.find(item=>item.id===selectedSampleFamily);
  const sampleProducts=FERTINI_DEMOS.filter(item=>!selectedSampleFamily||item.family===selectedSampleFamily);
  sampleProducts.sort((a,b)=>selectedSort==="lowest" ? a.variants[1].price-b.variants[1].price : selectedSort==="highest" ? b.variants[1].price-a.variants[1].price : selectedSort==="bestselling"?Number(b.collection==="bestseller")-Number(a.collection==="bestseller"):a.collection===b.collection?0:a.collection==="new"?-1:1);
  const onSelectParent=(id:number|null)=>{
    setActiveParentId(id);
    if(sampleMode){
      const slug=fallbackCategories.find(category=>category.id===id)?.slug;
      router.replace(slug?"/products?family="+slug:"/products",{scroll:false});
    }
  };
  return <div className="ql-shop maison-catalog min-h-screen">
    <LuxuryNavbar />
    <main className="ql-shop-main" id="main-content">
      <section className="fertini-catalog-v5__hero" aria-labelledby="fertini-catalog-title">
        <div className="fertini-catalog-v5__image"><Image src="/fertini/hero-02.svg" alt="چیدمان هنری بطری‌های عطر در نور نرم" fill priority sizes="(min-width:850px) 52vw,100vw"/></div>
        <div className="fertini-catalog-v5__copy">
          <span className="maison-kicker" dir="ltr" lang="en">FERTINI / THE FRAGRANCE COLLECTION</span>
          <h1 id="fertini-catalog-title">{activeScentFamily?.name||currentFamily?.name||"گالری عطرها"}</h1>
          <p>مجموعه‌ای از رایحه‌ها، برای یافتن آنچه به شما نزدیک‌تر است.</p>
        </div>
      </section>
      <div className="ql-container">
        <div className="ql-shop-filter">
          <ProductsFilterBar
            categories={sampleMode?fallbackCategories:categories}
            activeParentId={activeParentId}
            activeChildId={activeChildId}
            setActiveParentId={onSelectParent}
            setActiveChildId={setActiveChildId}
            loadingCategories={loadingCategories}
            activeFilterLabel={activeScentFamily?.name ?? currentFamily?.name ?? null}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
          />
        </div>
        <div className="ql-products-grid-section">
          {!loadingProducts && orderedProducts.length===0 && sampleMode ? (
            <section className="fertini-demo-shelf" aria-label="مجموعه عطرها">
              <div className="fertini-demo-shelf__heading">
                <div><span className="maison-kicker" lang="en" dir="ltr">FERTINI / THE COLLECTION</span><h2>مجموعه فرتینی</h2></div>
                <p>رایحه‌های منتخب فرتینی را کشف کنید.</p>
                
              </div>
              <div className="fertini-demo-shelf__grid">
                {sampleProducts.map(item=>
                  <Link key={item.id} className="fertini-demo-shelf__card" href={"/fragrance/"+item.id}>
                    <div className="fertini-demo-shelf__photo"><Image fill sizes="(min-width:900px) 30vw, 88vw" src={item.image} alt={item.name}/></div>
                    <div className="fertini-demo-shelf__details"><span lang="en" dir="ltr">{item.subtitle}</span><h3>{item.name}</h3><p>از {item.variants[1].price.toLocaleString("fa-IR")} تومان</p></div>
                  </Link>)}
              </div>
            </section>
          ) : !loadingProducts && orderedProducts.length===0 ? (
            <div className="fertini-demo-shelf__heading" role="status">
              <h2>{productsError ? "کاتالوگ موقتا در دسترس نیست" : "در حال حاضر محصول منتشرشده‌ای وجود ندارد"}</h2>
              <p>{productsError ?? "محصولات جدید به‌زودی اضافه می‌شوند."}</p>
            </div>
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
