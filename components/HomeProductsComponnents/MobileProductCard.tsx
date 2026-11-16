"use client";

import { memo } from "react";
import MobileProductImageSlider from "./MobileProductImageSlider";
import type { Product } from "./ProductsSection";

function MobileProductCard({
  product,
  images,
  displayPrice,
  originalPrice,
  onClick,
}: {
  product: Product;
  images: string[];
  displayPrice: string;
  originalPrice?: string;
  onClick: () => void;
}) {
  const mobileDisplayPrice = displayPrice.replace(/\s*t$/i, " تومان").trim();
  const mobileOriginalPrice = originalPrice?.replace(/\s*t$/i, " تومان").trim() || null;
  const productLabel = product.scent_family || product.family || product.categoryNames?.[0] || "";


  return (
    <article
      className="
        product-card
        group
        min-w-0
        cursor-pointer
        select-none
        bg-[#f5f2ed]
        border-0
        rounded-none
        shadow-none
        overflow-visible
        will-change-transform
        transition-transform
        duration-300
        ease-out
        active:scale-[0.998]
        px-[0.25px]
        sm:px-[0.25px]
        md:px-[0.25px]
        lg:px-0
        [&_.swiper-pagination-progressbar]:!h-[0.5px]
        [&_.swiper-pagination-progressbar-fill]:!h-[0.5px]
        [&_.swiper-scrollbar]:!h-[0.5px]
        [&_.swiper-scrollbar-drag]:!h-[0.5px]
        [&_[data-progress-track]]:!h-[0.5px]
        [&_[data-progress-fill]]:!h-[0.5px]
      "
      onClick={onClick}
      role="link"
      aria-label={"مشاهده عطر " + product.name}
      tabIndex={0}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } }}
    >
      <div className="w-full overflow-hidden">
        <MobileProductImageSlider
          images={images}
          productName={product.name}
          onClick={onClick}
        />
      </div>

      {/* RTL grid: name + label physically RIGHT, price physically LEFT. */}
      <div dir="rtl" data-fertini-caption-layout="name-right-price-left"
        className="mt-[10px] grid min-h-[48px] grid-cols-[minmax(0,1fr)_minmax(0,44%)] items-start gap-x-2 px-[6px]">
        <div dir="rtl" className="min-w-0 text-right">
          <h3 className="line-clamp-2 text-right text-[11.7px] font-normal leading-[1.62] tracking-[-0.015em] text-[#33383C] sm:text-[12px] lg:text-[12.2px]">{product.name}</h3>
          {productLabel && <span className="mt-1 block text-right text-[10px] font-normal leading-[1.6] text-[#849189]">{productLabel}</span>}
        </div>
        <div dir="rtl" className="min-w-0 text-left">
          {mobileOriginalPrice && <p className="mb-[2px] text-left text-[10px] font-light leading-[1.4] text-[#A0A0A0] line-through">{mobileOriginalPrice}</p>}
          <p className="text-left text-[11px] font-light leading-[1.8] tracking-[0.005em] text-[#566258] sm:text-[11.8px] lg:text-[12px]">{mobileDisplayPrice}</p>
        </div>
      </div>
    </article>
  );
}

export default memo(MobileProductCard);
