"use client";

import { useEffect, useMemo, useState } from "react";

type ProductImage = {
  id: number;
  product_id?: number;
  variant_id?: number;
  image_url: string;
  is_main: boolean;
};

type ProductVariant = {
  id: number;
  product_id: number;
  volume_ml: number;
  price: number;
  discount_price: number | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
};

type ProductItem = {
  id: number;
  category_id: number;
  parent_category_id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  scent_family: string | null;
  top_notes: string | null;
  middle_notes: string | null;
  base_notes: string | null;
  voice_file: string | null;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  brand_name: string | null;
  brand_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
  parent_category_name: string | null;
  parent_category_slug: string | null;
  min_price: number | null;
  max_price: number | null;
  total_stock: number;
  main_image: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
};

type ProductsResponse = {
  success: boolean;
  message: string;
  data: {
    items: ProductItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

export function useProductsHero() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchHeroProduct() {
      try {
        setLoading(true);

        const res = await fetch("/api/v1/products", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch products hero data");
        }

        const json: ProductsResponse = await res.json();

        if (!active) return;

        setItems(json?.data?.items || []);
      } catch (error) {
        console.error("Products hero fetch error:", error);
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchHeroProduct();

    return () => {
      active = false;
    };
  }, []);

  const heroProduct = useMemo(() => {
    if (!items.length) return null;

    const featured = items.find((item) => item.is_featured);
    if (featured) return featured;

    const withImage = items.find((item) => {
      const hasProductImage = !!item.main_image || !!item.images?.length;
      const hasVariantImage = item.variants?.some((variant) => variant.images?.length > 0);
      return hasProductImage || hasVariantImage;
    });

    return withImage || items[0];
  }, [items]);

  return {
    heroProduct,
    loading,
  };
}
