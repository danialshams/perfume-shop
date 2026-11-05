"use client";

import gsap from "gsap";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import MobileProductCard from "./MobileProductCard";
import ProductsEmptyState from "./ProductsEmptyState";
import ProductsLoadingState from "./ProductsLoadingState";

export type ProductImage = {
  id?: number;
  product_id?: number;
  variant_id?: number;
  image_url?: string;
  url?: string;
  src?: string;
  is_main?: boolean | number;
};

export type ProductVariant = {
  id: number;
  product_id?: number;
  volume_ml?: number | string | null;
  volumeMl?: number | string | null;
  price?: number | string | null;
  discount_price?: number | string | null;
  discountPrice?: number | string | null;
  compare_at_price?: number | string | null;
  compareAtPrice?: number | string | null;
  rawPrice?: number | string | null;
  rawDiscountPrice?: number | string | null;
  rawCompareAtPrice?: number | string | null;
  stock_qty?: number;
  is_active?: boolean | number;
  label?: string;
  size?: string;
  image?: string | null;
  images?: ProductImage[] | string[] | null;
};

export type Product = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  scent_family?: string;
  family?: string;
  top_notes?: string;
  middle_notes?: string;
  base_notes?: string;
  notes?: {
    top?: string;
    middle?: string;
    base?: string;
  };
  min_price?: number | string | null;
  max_price?: number | string | null;
  image?: string | null;
  main_image?: string | null;
  images?: ProductImage[] | string[] | null;
  variants?: ProductVariant[];
  defaultVariantId?: number | null;
  limited?: boolean;
  layout?: "wide" | "standard";
  tone?: "light" | "soft" | "deep";
  categoryIds?: number[];
  categoryNames?: string[];
  categorySlugs?: string[];
  categoryLinks?: unknown[];
  category_links?: unknown[];
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function parseNumericPrice(rawPrice?: number | string | null): number | null {
  if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
    return null;
  }

  if (typeof rawPrice === "number") {
    return Number.isFinite(rawPrice) ? rawPrice : null;
  }

  const trimmed = String(rawPrice).trim();
  if (!trimmed) return null;

  const normalized = toEnglishDigits(trimmed)
    .replace(/تومان/g, "")
    .replace(/[,\s٬]/g, "");

  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : null;
}

function formatPrice(rawPrice?: number | string | null): string {
  const numeric = parseNumericPrice(rawPrice);

  if (numeric === null || numeric <= 0) {
    return "تماس بگیرید";
  }

  return `${numeric.toLocaleString("fa-IR")} تومان`;
}

function toImageUrl(path?: string | null) {
  if (!path) return "/images/placeholder.jpg";

  const cleanPath = String(path).trim();

  if (!cleanPath) return "/images/placeholder.jpg";

  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("blob:") ||
    cleanPath.startsWith("data:")
  ) {
    return cleanPath;
  }

  if (cleanPath.startsWith("/images/")) {
    return cleanPath;
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

  return `${base}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

function normalizeImageKey(path?: string | null) {
  const url = toImageUrl(path);

  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function isProbablyRenderableImage(path?: string | null) {
  if (!path) return false;

  const url = toImageUrl(path);

  if (url === "/images/placeholder.jpg") return true;

  return Boolean(
    url.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i) ||
      url.includes("/uploads/"),
  );
}

function uniqueImageUrls(images: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  images.forEach((image) => {
    const normalizedUrl = toImageUrl(image);
    const key = normalizeImageKey(normalizedUrl);

    if (!seen.has(key) && isProbablyRenderableImage(normalizedUrl)) {
      seen.add(key);
      result.push(normalizedUrl);
    }
  });

  return result;
}

function getImagePath(img?: ProductImage | string | null) {
  if (!img) return null;

  if (typeof img === "string") {
    const trimmed = img.trim();
    return trimmed || null;
  }

  const value = img.image_url || img.url || img.src || null;

  if (!value) return null;

  const trimmed = String(value).trim();

  return trimmed || null;
}

function extractImageStrings(
  images?: ProductImage[] | string[] | null,
): string[] {
  if (!images || !Array.isArray(images)) return [];

  return images
    .map((img) => getImagePath(img))
    .filter((img): img is string => Boolean(img));
}

function getMainImageFromImageObjects(
  images?: ProductImage[] | string[] | null,
) {
  if (!images || !Array.isArray(images)) return null;

  const objectImages = images.filter(
    (img): img is ProductImage => typeof img === "object" && img !== null,
  );

  const mainImage = objectImages.find((img) => img.is_main);
  const mainPath = getImagePath(mainImage);

  if (mainPath) return mainPath;

  return getImagePath(images[0]);
}

function getProductImages(
  product: Product,
  selectedVariant?: ProductVariant | null,
) {
  const allImages: string[] = [];

  if (selectedVariant?.image) {
    allImages.push(selectedVariant.image);
  }

  const selectedVariantMainImage = getMainImageFromImageObjects(
    selectedVariant?.images,
  );

  if (selectedVariantMainImage) {
    allImages.push(selectedVariantMainImage);
  }

  allImages.push(...extractImageStrings(selectedVariant?.images));

  if (product.main_image) {
    allImages.push(product.main_image);
  }

  if (product.image) {
    allImages.push(product.image);
  }

  const productMainFromImages = getMainImageFromImageObjects(product.images);

  if (productMainFromImages) {
    allImages.push(productMainFromImages);
  }

  allImages.push(...extractImageStrings(product.images));

  product.variants?.forEach((variant) => {
    if (selectedVariant && Number(variant.id) === Number(selectedVariant.id)) {
      return;
    }

    if (variant.image) {
      allImages.push(variant.image);
    }

    const variantMainImage = getMainImageFromImageObjects(variant.images);

    if (variantMainImage) {
      allImages.push(variantMainImage);
    }

    allImages.push(...extractImageStrings(variant.images));
  });

  const uniqueImages = uniqueImageUrls(
    allImages.map((image) => String(image).trim()).filter(Boolean),
  );

  return uniqueImages.length ? uniqueImages : ["/images/placeholder.jpg"];
}

function getSelectedVariant(
  product: Product,
  selectedVariants: Record<number, number>,
) {
  const variants = product.variants ?? [];

  if (!variants.length) return null;

  const selectedId = selectedVariants[product.id];

  if (selectedId !== undefined && selectedId !== null) {
    const found = variants.find(
      (variant) => Number(variant.id) === Number(selectedId),
    );

    if (found) return found;
  }

  if (
    product.defaultVariantId !== undefined &&
    product.defaultVariantId !== null
  ) {
    const foundDefault = variants.find(
      (variant) => Number(variant.id) === Number(product.defaultVariantId),
    );

    if (foundDefault) return foundDefault;
  }

  return variants[0];
}
function getVariantPrice(
  variant?: ProductVariant | null,
  product?: Product,
): number | null {
  // اولویت با rawDiscountPrice عددی، بعد discount_price عددی
  const rawDiscount =
    variant?.rawDiscountPrice ??
    variant?.discount_price ??
    variant?.discountPrice;
  const discount = parseNumericPrice(rawDiscount);

  // قیمت اصلی را از rawPrice عددی بگیر، نه از variant.price فرمت‌شده
  const rawPrice = variant?.rawPrice ?? variant?.price;
  const price = parseNumericPrice(rawPrice);

  const rawCompareAt =
    variant?.rawCompareAtPrice ??
    variant?.compare_at_price ??
    variant?.compareAtPrice;
  const compareAt = parseNumericPrice(rawCompareAt);

  const fallbackMin = parseNumericPrice(product?.min_price);

  if (discount !== null && discount > 0) return discount;
  if (price !== null && price > 0) return price;
  if (compareAt !== null && compareAt > 0) return compareAt;
  if (fallbackMin !== null && fallbackMin > 0) return fallbackMin;

  return null;
}
function getVariantOriginalPrice(
  variant?: ProductVariant | null,
  product?: Product,
): number | null {
  const rawDiscount =
    variant?.rawDiscountPrice ??
    variant?.discount_price ??
    variant?.discountPrice;
  const discount = parseNumericPrice(rawDiscount);

  const rawPrice = variant?.rawPrice ?? variant?.price;
  const price = parseNumericPrice(rawPrice);

  const rawCompareAt =
    variant?.rawCompareAtPrice ??
    variant?.compare_at_price ??
    variant?.compareAtPrice;
  const compareAt = parseNumericPrice(rawCompareAt);

  const fallbackMax = parseNumericPrice(product?.max_price);

  if (discount !== null && discount > 0) {
    if (price !== null && price > discount) return price;
    if (compareAt !== null && compareAt > discount) return compareAt;
    if (fallbackMax !== null && fallbackMax > discount) return fallbackMax;
    return null;
  }

  if (compareAt !== null && price !== null && compareAt > price) {
    return compareAt;
  }

  return null;
}

export default function ProductsSection({
  loadingProducts,
  filteredProducts,
  selectedVariants,
  setSelectedVariants,
}: {
  loadingProducts: boolean;
  filteredProducts: Product[];
  selectedVariants: Record<number, number>;
  setSelectedVariants: Dispatch<SetStateAction<Record<number, number>>>;
}) {
  const router = useRouter();

  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const goToProduct = useCallback(
    (product: Product) => {
      router.push(`/products/${product.id}`);
    },
    [router],
  );

  useEffect(() => {
    if (!filteredProducts?.length) return;

    const context = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll(".product-card");

      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.035,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }, sectionRef);

    return () => context.revert();
  }, [filteredProducts]);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        bg-[#f5f2ed]
        px-0
        py-8
        sm:px-0
        sm:py-10
        lg:px-0
        lg:py-12
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
          px-2
          sm:px-3
          md:px-4
          lg:px-5
          xl:px-6
        "
      >
        {loadingProducts ? (
          <ProductsLoadingState />
        ) : filteredProducts?.length === 0 ? (
          <ProductsEmptyState />
        ) : (
          <div
            ref={gridRef}
            className="
              grid
              grid-cols-2
              items-start
              gap-x-[0.5px]
              gap-y-6
              sm:grid-cols-2
              sm:gap-x-[0.5px]
              md:grid-cols-3
              md:gap-x-[0.5px]
              md:gap-y-5
              lg:grid-cols-4
              lg:gap-x-1
              lg:gap-y-4
              xl:grid-cols-4
              xl:gap-x-1
              xl:gap-y-4
            "
          >
            {filteredProducts?.map((product) => {
              const selectedVariant = getSelectedVariant(
                product,
                selectedVariants,
              );

              const productImages = getProductImages(product, selectedVariant);

              const displayPrice = formatPrice(
                getVariantPrice(selectedVariant, product),
              );

              const originalPriceValue = getVariantOriginalPrice(
                selectedVariant,
                product,
              );

              const originalPrice = originalPriceValue
                ? formatPrice(originalPriceValue)
                : undefined;

              if (process.env.NODE_ENV !== "production") {
                console.log("[Product Card Data]", {
                  productId: product.id,
                  productName: product.name,
                  selectedVariant,
                  displayPrice,
                  originalPrice,
                });
              }

              return (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  images={productImages}
                  displayPrice={displayPrice}
                  originalPrice={originalPrice}
                  onClick={() => goToProduct(product)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
