/* src/hooks/useProductsPageData.ts */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Category, MappedProduct, ProductItem, ScentFamily, createApiUrl, mapApiProducts } from "@/lib/product";

type ApiListResponse<T> = {
  success?: boolean;
  message?: string;
  data?:
    | {
        items?: T[];
        meta?: unknown;
      }
    | T[];
  items?: T[];
};

function extractItems<T>(json: ApiListResponse<T> | any): T[] {
  if (Array.isArray(json?.data?.items)) {
    return json.data.items;
  }

  if (Array.isArray(json?.items)) {
    return json.items;
  }

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  return [];
}

function normalizeId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getRawProductScentFamilyId(item: any): unknown {
  return (
    item?.scent_family_id ??
    item?.scentFamilyId ??
    item?.scent_family?.id ??
    item?.scentFamily?.id ??
    item?.scent_family_data?.id ??
    item?.scentFamilyData?.id ??
    null
  );
}

function getRawProductScentFamilyName(item: any): unknown {
  const scentFamily = item?.scent_family ?? item?.scentFamily;

  if (typeof scentFamily === "string") {
    return scentFamily;
  }

  return (
    item?.scent_family_name ??
    item?.scentFamilyName ??
    scentFamily?.name ??
    item?.scent_family_data?.name ??
    item?.scentFamilyData?.name ??
    null
  );
}

function getRawProductScentFamilySlug(item: any): unknown {
  const scentFamily = item?.scent_family ?? item?.scentFamily;

  if (typeof scentFamily === "object" && scentFamily !== null) {
    return scentFamily.slug ?? null;
  }

  return (
    item?.scent_family_slug ??
    item?.scentFamilySlug ??
    item?.scent_family_data?.slug ??
    item?.scentFamilyData?.slug ??
    null
  );
}

export function useProductsPageData() {
  const searchParams = useSearchParams();

  const scentFamilyIdParam = searchParams.get("scent_family_id");
  const normalizedScentFamilyIdParam = normalizeId(scentFamilyIdParam);

  const [categories, setCategories] = useState<Category[]>([]);
  const [scentFamilies, setScentFamilies] = useState<ScentFamily[]>([]);

  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingScentFamilies, setLoadingScentFamilies] = useState(true);

  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [rawProducts, setRawProducts] = useState<ProductItem[]>([]);

  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const url = createApiUrl("/api/v1/categories");

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }

        const json = await res.json();
        const items: Category[] = extractItems<Category>(json);

        setCategories(items);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchScentFamilies = async () => {
      try {
        setLoadingScentFamilies(true);

        const url = createApiUrl("/api/v1/scent-families?is_active=1");

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch scent families: ${res.status}`);
        }

        const json = await res.json();
        const items: ScentFamily[] = extractItems<ScentFamily>(json);

        setScentFamilies(items);
      } catch (error) {
        console.error("Failed to fetch scent families:", error);
        setScentFamilies([]);
      } finally {
        setLoadingScentFamilies(false);
      }
    };

    fetchScentFamilies();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let loadedItems: ProductItem[] = [];

    const publishItems = () => {
      if (controller.signal.aborted) return;
      const formattedProducts = mapApiProducts(loadedItems);
      setRawProducts([...loadedItems]);
      setProducts(formattedProducts);
      setSelectedVariants(previous => {
        const next = { ...previous };
        formattedProducts.forEach(product => {
          if (next[product.id] === undefined) {
            next[product.id] = product.defaultVariantId ??
              product.variants[0]?.id ?? product.id;
          }
        });
        return next;
      });
    };

    const fetchPage = async (page: number) => {
      const url = createApiUrl(`/api/v1/products?limit=100&page=${page}`);
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Product catalog: ${response.status}`);
      const json = await response.json();
      if (json?.success === false) throw new Error("Product catalog rejected request");
      const items = extractItems<ProductItem>(json);
      const totalPages = Math.max(1, Number(json?.data?.meta?.totalPages ?? 1) || 1);
      return { items, totalPages };
    };

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const first = await fetchPage(1);
        if (controller.signal.aborted) return;
        loadedItems = first.items;
        publishItems();
        setLoadingProducts(false);

        // Fetch the remaining pages in small parallel batches. The first
        // 100 cards remain interactive while the full catalog is loaded.
        for (let page = 2; page <= first.totalPages; page += 3) {
          const numbers = Array.from(
            { length: Math.min(3, first.totalPages - page + 1) },
            (_, i) => page + i,
          );
          const results = await Promise.all(numbers.map(fetchPage));
          if (controller.signal.aborted) return;
          loadedItems = loadedItems.concat(results.flatMap(result => result.items));
          publishItems();
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[ProductsPage] Failed to load catalog:", error);
        setProductsError(loadedItems.length
          ? "بارگذاری بخشی از کاتالوگ ناموفق بود؛ برای دریافت همه محصولات دوباره تلاش کنید."
          : "ارتباط با کاتالوگ برقرار نشد. لطفاً دوباره تلاش کنید.");
        if (loadedItems.length === 0) {
          setRawProducts([]);
          setProducts([]);
          setSelectedVariants({});
        }
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    };

    void fetchProducts();
    return () => controller.abort();
  }, [reloadIndex]);

  const reloadProducts = () => setReloadIndex(value => value + 1);

  const activeScentFamily = useMemo(() => {
    if (!normalizedScentFamilyIdParam) return null;

    return (
      scentFamilies.find(
        (family) => Number(family.id) === normalizedScentFamilyIdParam,
      ) ?? null
    );
  }, [scentFamilies, normalizedScentFamilyIdParam]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (normalizedScentFamilyIdParam !== null) {
      const activeFamilyName = normalizeText(activeScentFamily?.name);
      const activeFamilySlug = normalizeText(activeScentFamily?.slug);

      result = result.filter((product) => {
        const rawProduct = rawProducts.find(
          (item) => Number(item.id) === Number(product.id),
        ) as any;

        const mappedFamilyId = normalizeId(product.scent_family_id);
        const rawFamilyId = normalizeId(getRawProductScentFamilyId(rawProduct));

        if (
          mappedFamilyId !== null &&
          mappedFamilyId === normalizedScentFamilyIdParam
        ) {
          return true;
        }

        if (
          rawFamilyId !== null &&
          rawFamilyId === normalizedScentFamilyIdParam
        ) {
          return true;
        }

        if (activeScentFamily) {
          const mappedFamilyName = normalizeText(product.family);
          const rawFamilyName = normalizeText(
            getRawProductScentFamilyName(rawProduct),
          );
          const rawFamilySlug = normalizeText(
            getRawProductScentFamilySlug(rawProduct),
          );

          if (activeFamilyName) {
            if (mappedFamilyName === activeFamilyName) return true;
            if (rawFamilyName === activeFamilyName) return true;
          }

          if (activeFamilySlug) {
            if (rawFamilySlug === activeFamilySlug) return true;
          }
        }

        return false;
      });

    }

    if (activeParentId === null && activeChildId === null) {

      return result;
    }

    result = result.filter((product) => {
      const ids = product.categoryIds ?? [];
      const slugs = product.categorySlugs ?? [];
      const names = product.categoryNames ?? [];
      const links = product.categoryLinks ?? [];

      if (activeParentId !== null && activeChildId === null) {
        if (links.length > 0) {
          return links.some((link) =>
            Number(link.parent_id) === Number(activeParentId) ||
            Number(link.child_id) === Number(activeParentId),
          ) || ids.some(id => Number(id) === Number(activeParentId));
        }

        return ids.some((id) => Number(id) === Number(activeParentId));
      }

      if (activeParentId !== null && activeChildId !== null) {
        if (links.length > 0) {
          return links.some(
            (link) =>
              Number(link.parent_id) === Number(activeParentId) &&
              Number(link.child_id) === Number(activeChildId),
          );
        }

        const activeChildCategory = categories.find(
          (category) => Number(category.id) === Number(activeChildId),
        );

        return (
          ids.some((id) => Number(id) === Number(activeChildId)) ||
          Boolean(
            activeChildCategory?.slug &&
              slugs.includes(activeChildCategory.slug),
          ) ||
          Boolean(
            activeChildCategory?.name &&
              names.includes(activeChildCategory.name),
          )
        );
      }

      return true;
    });

    return result;
  }, [
    products,
    rawProducts,
    categories,
    activeParentId,
    activeChildId,
    scentFamilyIdParam,
    normalizedScentFamilyIdParam,
    activeScentFamily,
  ]);

  return {
    categories,
    scentFamilies,

    activeParentId,
    activeChildId,
    setActiveParentId,
    setActiveChildId,

    loadingCategories,
    loadingScentFamilies,

    products,
    rawProducts,
    filteredProducts,

    selectedVariants,
    setSelectedVariants,

    loadingProducts,
    productsError,
    reloadProducts,

    activeScentFamily,
  };
}
