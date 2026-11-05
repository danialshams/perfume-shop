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

      <div
        dir="rtl"
        className="
          mt-[8px]
          flex
          min-h-[28px]
          items-start
          justify-between
          gap-2
          px-[6px]
        "
      >
        <h3
          className="
            min-w-0
            flex-1
            line-clamp-1
            text-right
            text-[11.7px]
            font-normal
            leading-[1.62]
            tracking-[-0.015em]
            text-[#33383C]
            sm:text-[12px]
            lg:text-[12.2px]
          "
        >
          {product.name}
        </h3>

        <div dir="ltr" className="shrink-0 whitespace-nowrap text-left">
          {mobileOriginalPrice && (
            <p
              className="
                text-[10px]
                font-light
                leading-[1.2]
                tracking-[0.005em]
                text-[#A0A0A0]
                line-through
                mb-[2px]
                sm:text-[10px]
                lg:text-[10px]
              "
            >
              {mobileOriginalPrice}
            </p>
          )}

          <p
            className="
              text-[11.8px]
              font-light
              leading-[1.5]
              tracking-[0.005em]
              text-[#7B8487]
              sm:text-[11.8px]
              lg:text-[12px]
            "
          >
            {mobileDisplayPrice}
          </p>
        </div>
      </div>
    </article>
  );
}

export default memo(MobileProductCard);
