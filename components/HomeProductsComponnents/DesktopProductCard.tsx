"use client";

import MobileProductImageSlider from "./MobileProductImageSlider";
import type { Product } from "./ProductsSection";

export default function MobileProductCard({
  product,
  images,
  displayPrice,
  onClick,
}: {
  product: Product;
  images: string[];
  displayPrice: string;
  onClick: () => void;
}) {
  return (
    <article className="min-w-0">
      <MobileProductImageSlider
        images={images}
        productName={product.name}
        onClick={onClick}
      />

      <div
        className="mt-4 cursor-pointer px-px text-right"
        dir="rtl"
        onClick={onClick}
      >
        <h3 className="line-clamp-1 text-[12.5px] font-medium leading-[1.9] tracking-[-0.012em] text-[#132033] sm:text-[13px]">
          {product.name}
        </h3>

        <div className="mt-1 text-[10.5px] font-normal leading-5 tabular-nums tracking-[0.01em] text-[#8a97aa] sm:text-[11px]">
          {displayPrice}
        </div>
      </div>
    </article>
  );
}
