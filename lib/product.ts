const LOCAL_PLACEHOLDER = "/images/placeholder-perfume.jpg";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export type ProductStatus = "ACTIVE" | "DRAFT" | "INACTIVE";
export type ProductType = "SINGLE" | "GROUPED";

export type ProductQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  is_active?: 0 | 1;
  is_featured?: 0 | 1;
  is_best_seller?: 0 | 1;
};

export type ProductVariantImage = {
  id: number;
  variant_id?: number;
  product_variant_id?: number;
  image_url: string;
  is_main: boolean | number;
  created_at?: string;
};

export type ProductImage = {
  id: number;
  product_id?: number;
  image_url: string;
  is_main: boolean | number;
  created_at?: string;
};

export type ProductVariant = {
  id: number;
  product_id?: number;
  label?: string | null;
  volume_ml?: number | null;
  volumeMl?: number | null;
  price: number | string;
  discount_price?: number | string | null;
  compare_at_price?: number | string | null;
  stock?: number;
  stock_qty?: number;
  low_stock_threshold?: number;
  is_default?: boolean | number;
  is_active?: boolean | number;
  status?: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  reserved_stock_qty?: number;
  images?: ProductVariantImage[];
};

export type ProductVariantOption = {
  id: number | string;
  label: string;
  price: number | string;
  stock_qty: number | string;
};

export type ProductCategoryLink = {
  parent_id: number | string;
  child_id: number | string;
  parent_name?: string;
  parent_slug?: string;
  child_name?: string;
  child_slug?: string;
};

export type ProductItem = {
  id: number;

  category_id: number | null;
  parent_category_id?: number | null;
  brand_id?: number | null;

  name: string;
  slug: string;
  description: string | null;
  type: ProductType;

  scent_family_id?: number | null;
  scent_family?:
    | string
    | {
        id?: number | string | null;
        name?: string | null;
        slug?: string | null;
        image_url?: string | null;
        description?: string | null;
      }
    | null;
  scent_family_name?: string | null;
  scent_family_slug?: string | null;
  scent_family_image?: string | null;
  scent_family_description?: string | null;

  top_notes: string | null;
  top_notes_description?: string | null;
  top_notes_image?: string | null;

  middle_notes: string | null;
  middle_notes_description?: string | null;
  middle_notes_image?: string | null;

  base_notes: string | null;
  base_notes_description?: string | null;
  base_notes_image?: string | null;

  voice_file?: string | null;

  price?: string | number | null;
  min_price?: string | number | null;
  max_price?: string | number | null;
  display_price?: string | number | null;

  image?: string | null;
  main_image?: string | null;
  primary_image?: string | null;

  display_variant_id?: number | string | null;
  display_variant_price?: number | string | null;
  display_variant_label?: string | null;
  in_stock_variant_label?: string | null;
  fallback_variant_label?: string | null;

  total_stock?: string | number | null;
  variant_count?: number | string | null;

  is_active: boolean | number;
  is_featured: boolean | number;
  is_best_seller: boolean | number;
  status: ProductStatus;

  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;

  category_name?: string | null;
  category_slug?: string | null;
  parent_category_name?: string | null;
  parent_category_slug?: string | null;

  brand_name?: string | null;
  brand_slug?: string | null;

  category?: {
    id: number;
    name: string;
    slug?: string;
  } | null;

  brand?: {
    id: number;
    name: string;
    slug?: string;
  } | null;

  category_links?: ProductCategoryLink[];

  images?: ProductImage[];
  variants?: ProductVariant[];
  variant_options?: ProductVariant[];
};

export type Product = ProductItem;

export type ProductsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductsResponse = {
  success: boolean;
  message: string;
  data: {
    items: ProductItem[];
    meta: ProductsMeta;
  };
};

export type ProductDetailsResponse = {
  success: boolean;
  message: string;
  data: ProductItem;
};

export type Brand = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  logo_url?: string | null;
  country?: string | null;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
};

export type BrandsResponse = {
  success: boolean;
  message: string;
  data: Brand[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
  parent_ids: number[];
  parent_names: string[];
  children_count?: number;
  has_children: boolean;
};

export type CategoriesResponse = {
  success: boolean;
  message: string;
  data: Category[];
};

export type ScentFamily = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description?: string | null;
  is_active: boolean | number;
  sort_order: number;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type ScentFamiliesResponse = {
  success: boolean;
  message: string;
  data: ScentFamily[];
};

export type ProductImageInput = {
  image_url: string;
  is_main?: boolean;
};

export type ProductVariantImageInput = {
  image_url: string;
  is_main?: boolean;
};

export type ProductVariantInput = {
  volume_ml?: number | null;
  price: number;
  discount_price?: number | null;
  compare_at_price?: number | null;
  stock_qty: number;
  is_active?: boolean;
  images?: ProductVariantImageInput[];
};

export type ProductCategoryLinkInput = {
  parent_id: number;
  child_id: number;
};

export type CreateProductPayload = {
  name: string;
  slug: string;
  description?: string | null;
  type: ProductType;

  category_id?: number | null;
  parent_category_id?: number | null;
  category_links?: ProductCategoryLinkInput[];

  voice_file?: string | null;

  scent_family_id?: number | null;

  new_scent_family?: {
    name: string;
    image_url: string;
  } | null;

  top_notes?: string | null;
  top_notes_description?: string | null;
  top_notes_image?: string | null;

  middle_notes?: string | null;
  middle_notes_description?: string | null;
  middle_notes_image?: string | null;

  base_notes?: string | null;
  base_notes_description?: string | null;
  base_notes_image?: string | null;

  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;

  images: ProductImageInput[];
  variants: ProductVariantInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type CreateProductFormValues = {
  name: string;
  slug: string;
  description?: string | null;
  type: ProductType;

  parent_category_id?: number | null;
  category_id?: number | null;
  category_links?: ProductCategoryLinkInput[];

  scent_family_mode?: "EXISTING" | "NEW";

  scent_family_id?: number | null;

  new_scent_family?: {
    name?: string;
    image_url?: string | null;
  } | null;

  top_notes?: string | null;
  top_notes_description?: string | null;
  top_notes_image?: string | null;

  middle_notes?: string | null;
  middle_notes_description?: string | null;
  middle_notes_image?: string | null;

  base_notes?: string | null;
  base_notes_description?: string | null;
  base_notes_image?: string | null;

  voice_file?: string | null;

  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;

  images: ProductImageInput[];

  variants: Array<{
    volume_ml?: number | null;
    price: number;
    discount_price?: number | null;
    compare_at_price?: number | null;
    stock_qty: number;
    is_active?: boolean;
    images: ProductVariantImageInput[];
  }>;
};

export type UploadImageResult = {
  url: string;
  file_name?: string;
  size?: number;
  mime_type?: string;
};

export type UploadVoiceResult = {
  url: string;
  file_name?: string;
  size?: number;
  mime_type?: string;
};

export type MappedProductVariant = {
  id: number;
  price: string;
  originalPrice?: string | null;
  rawPrice: number | null;
  rawDiscountPrice?: number | null;
  rawCompareAtPrice?: number | null;
  size: string;
  volumeMl?: number | string | null;
  label: string;
  image?: string | null;
  images?: ProductVariantImage[];
  stockQty?: number;
  isActive?: boolean;

  // برای سازگاری مستقیم با کارت‌ها و سکشن‌ها
  discount_price?: number | null;
  compare_at_price?: number | null;
};

export type MappedProductNote = {
  title: string;
  description?: string | null;
  image?: string | null;
};

export type MappedProduct = {
  id: number;
  name: string;
  type: ProductType;
  family: string;
  scent_family_id?: number | null;
  description: string;
  scentFamilyDescription?: string | null;
  scentFamilyImage?: string | null;
  notes: {
    top: string;
    middle: string;
    base: string;
  };
  noteDetails: {
    top: MappedProductNote;
    middle: MappedProductNote;
    base: MappedProductNote;
  };
  image: string;
  main_image?: string | null;
  images?: ProductImage[];
  limited?: boolean;
  isBestSeller?: boolean;
  layout?: "wide" | "standard";
  tone?: "light" | "soft" | "deep";
  variants: MappedProductVariant[];
  defaultVariantId?: number | null;
  categoryIds?: number[];
  categorySlugs?: string[];
  categoryNames?: string[];
  categoryLinks?: { parent_id: number; child_id: number }[];
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function parseNumericPrice(rawPrice?: number | string | null) {
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

export function createApiUrl(path: string) {
  if (!API_BASE_URL) return path;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function normalizeAssetUrl(url?: string | null) {
  if (!url || !String(url).trim()) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  return createApiUrl(url);
}

export function getSafeImageSrc(url?: string | null) {
  const normalized = normalizeAssetUrl(url);
  if (!normalized || !String(normalized).trim()) return LOCAL_PLACEHOLDER;
  return normalized;
}

export function normalizeNumberList(values: unknown[]) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

export function formatPrice(rawPrice?: number | string | null) {
  const numeric = parseNumericPrice(rawPrice);

  if (numeric === null || numeric <= 0) {
    return "تماس بگیرید";
  }

  return `${numeric.toLocaleString("fa-IR")} تومان`;
}

export function pickFirstNote(
  value?: string | null,
  fallback = "Not specified",
) {
  if (!value) return fallback;

  const parts = value
    .split(/[,،/|·-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts[0] || fallback;
}

export function cleanVariantSize(size?: string | null) {
  if (!size) return "";

  const normalized = String(size).trim();

  if (!normalized) return "";

  const lower = normalized.toLowerCase();

  if (lower === "default" || lower === "deafault") return "";

  return normalized;
}

export function getMainImage(product: ProductItem) {
  const mainImage = product.images?.find(
    (img) =>
      img.image_url?.trim() && (img.is_main === true || img.is_main === 1),
  );

  return (
    mainImage?.image_url ||
    product.main_image ||
    product.primary_image ||
    product.image ||
    product.images?.find((img) => img.image_url?.trim())?.image_url ||
    null
  );
}

export function getProductImage(item: ProductItem) {
  const main = item.images?.find(
    (img) =>
      img.image_url?.trim() && (img.is_main === true || img.is_main === 1),
  );

  if (main?.image_url) return getSafeImageSrc(main.image_url);

  return getSafeImageSrc(
    item.main_image || item.primary_image || item.image || null,
  );
}

export function getVariantStock(variant: ProductVariant) {
  if (variant.stock_qty !== null && variant.stock_qty !== undefined) {
    const qty = Number(variant.stock_qty);
    return Number.isNaN(qty) ? 0 : qty;
  }

  const stock = Number(variant.stock ?? 0);
  return Number.isNaN(stock) ? 0 : stock;
}

export function getProductVariants(product: Product): ProductVariant[] {
  const rawVariants = product.variants?.length
    ? product.variants
    : product.variant_options?.length
      ? product.variant_options
      : [];

  const normalized = rawVariants.map((variant) => ({
    ...variant,
    images: Array.isArray(variant.images)
      ? variant.images.filter((img) => img?.image_url?.trim())
      : [],
    stock_qty: Number(variant.stock_qty ?? variant.stock ?? 0),
    price: parseNumericPrice(variant.price) ?? 0,
    discount_price:
      variant.discount_price !== null && variant.discount_price !== undefined
        ? parseNumericPrice(variant.discount_price)
        : null,
    compare_at_price:
      variant.compare_at_price !== null &&
      variant.compare_at_price !== undefined
        ? parseNumericPrice(variant.compare_at_price)
        : null,
    volume_ml:
      variant.volume_ml !== null && variant.volume_ml !== undefined
        ? Number(variant.volume_ml)
        : variant.volumeMl !== null && variant.volumeMl !== undefined
          ? Number(variant.volumeMl)
          : null,
  }));

  if (product.type === "SINGLE" && normalized.length > 0) {
    return [normalized[0]];
  }

  return normalized;
}

export function getTotalStock(product: ProductItem) {
  if (product.total_stock !== null && product.total_stock !== undefined) {
    const total = Number(product.total_stock);
    return Number.isNaN(total) ? 0 : total;
  }

  const variants = getProductVariants(product);

  if (!variants.length) return 0;

  return variants.reduce((sum, variant) => {
    return sum + getVariantStock(variant);
  }, 0);
}

export function getVariantPriceInfo(product: ProductItem) {
  const variants = getProductVariants(product);

  if (!variants.length) {
    const fallback =
      product.display_price ??
      product.min_price ??
      product.max_price ??
      product.price;

    const parsedFallback = parseNumericPrice(fallback);

    return {
      minPrice: parsedFallback,
      maxPrice: parsedFallback,
      hasRange: false,
    };
  }

  const prices = variants
    .map((variant) => {
      const discount = parseNumericPrice(variant.discount_price);
      const price = parseNumericPrice(variant.price);
      return discount !== null && discount > 0 ? discount : price;
    })
    .filter((price): price is number => Number.isFinite(price as number));

  if (!prices.length) {
    const fallback =
      product.display_price ??
      product.min_price ??
      product.max_price ??
      product.price;

    const parsedFallback = parseNumericPrice(fallback);

    return {
      minPrice: parsedFallback,
      maxPrice: parsedFallback,
      hasRange: false,
    };
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    minPrice,
    maxPrice,
    hasRange: minPrice !== maxPrice,
  };
}

export function getDefaultVariant(product: Product) {
  const variants = getProductVariants(product);

  if (!variants.length) return null;

  const inStock = variants.find((variant) => Number(variant.stock_qty) > 0);
  return inStock || variants[0];
}

export function getVariantLabel(variant?: ProductVariant | null) {
  if (!variant) return "واریانت";

  const volume =
    variant.volume_ml !== null && variant.volume_ml !== undefined
      ? variant.volume_ml
      : variant.volumeMl;

  if (volume !== null && volume !== undefined && Number(volume) > 0) {
    return `${Number(volume).toLocaleString("en-US")} ml`;
  }

  if (variant.label && String(variant.label).trim()) {
    return String(variant.label).trim();
  }

  return "واریانت";
}

export function getVariantImages(
  product: Product,
  variant: ProductVariant | null,
) {
  const variantImages =
    variant?.images
      ?.filter((img) => !!img?.image_url && !!String(img.image_url).trim())
      ?.sort((a, b) => {
        const aMain = a.is_main === true || a.is_main === 1;
        const bMain = b.is_main === true || b.is_main === 1;

        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;

        return Number(a.id ?? 0) - Number(b.id ?? 0);
      })
      ?.map((img) => ({
        src: getSafeImageSrc(img.image_url),
        alt: product.name,
      })) || [];

  if (variantImages.length > 0) return variantImages;

  const productImages =
    product.images
      ?.filter((img) => !!img?.image_url && !!String(img.image_url).trim())
      ?.sort((a, b) => {
        const aMain = a.is_main === true || a.is_main === 1;
        const bMain = b.is_main === true || b.is_main === 1;

        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;

        return Number(a.id ?? 0) - Number(b.id ?? 0);
      })
      ?.map((img) => ({
        src: getSafeImageSrc(img.image_url),
        alt: product.name,
      })) || [];

  if (productImages.length > 0) return productImages;

  const fallback = [product.primary_image, product.main_image, product.image]
    .filter((img) => !!img && !!String(img).trim())
    .map((img) => ({
      src: getSafeImageSrc(img),
      alt: product.name,
    }));

  if (fallback.length > 0) return fallback;

  return [
    {
      src: LOCAL_PLACEHOLDER,
      alt: product.name,
    },
  ];
}

export function getCategoryTrail(product: Product) {
  if (
    Array.isArray(product.category_links) &&
    product.category_links.length > 0
  ) {
    const firstLink = product.category_links[0];
    const parent = firstLink.parent_name?.trim();
    const child = firstLink.child_name?.trim();

    if (parent && child) return `${parent} / ${child}`;
    if (child) return child;
  }

  const child = product.category_name || "دسته‌بندی محصول";
  const parent = product.parent_category_name;

  if (!parent) return child;

  return `${parent} / ${child}`;
}

export function getCategoryParts(product: Product) {
  const trail = getCategoryTrail(product);

  return trail
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function extractProductCategoryMeta(item: ProductItem) {
  const rawCategories = item.category ? [item.category] : [];

  const ids = normalizeNumberList([
    item.category_id,
    item.parent_category_id,
    ...rawCategories.map((category) => category.id),
    ...(Array.isArray(item.category_links)
      ? item.category_links.flatMap((link) => [link.parent_id, link.child_id])
      : []),
  ]);

  const slugs = [
    item.category_slug,
    item.parent_category_slug,
    ...rawCategories.map((category) => category.slug),
    ...(Array.isArray(item.category_links)
      ? item.category_links.flatMap((link) => [
          link.parent_slug,
          link.child_slug,
        ])
      : []),
  ]
    .filter(Boolean)
    .map((slug) => String(slug));

  const names = [
    item.category_name,
    item.parent_category_name,
    ...rawCategories.map((category) => category.name),
    ...(Array.isArray(item.category_links)
      ? item.category_links.flatMap((link) => [
          link.parent_name,
          link.child_name,
        ])
      : []),
  ]
    .filter(Boolean)
    .map((name) => String(name));

  const links = Array.isArray(item.category_links)
    ? item.category_links
        .map((link) => ({
          parent_id: Number(link.parent_id),
          child_id: Number(link.child_id),
        }))
        .filter(
          (link) =>
            !Number.isNaN(link.parent_id) && !Number.isNaN(link.child_id),
        )
    : [];

  return {
    categoryIds: Array.from(new Set(ids)),
    categorySlugs: Array.from(new Set(slugs)),
    categoryNames: Array.from(new Set(names)),
    categoryLinks: links,
  };
}

export function getProductBasePrice(item: ProductItem) {
  return item.price ?? item.min_price ?? item.max_price ?? null;
}

export function getProductDisplayPrice(product: Product) {
  const variants = getProductVariants(product);

  if (variants.length) {
    const prices = variants
      .map((variant) => {
        const discount = parseNumericPrice(variant.discount_price);
        const price = parseNumericPrice(variant.price);

        if (discount !== null && discount > 0) return discount;
        if (price !== null && price > 0) return price;
        return null;
      })
      .filter((price): price is number => price !== null);

    if (prices.length) return Math.min(...prices);
  }

  return (
    parseNumericPrice(
      product.display_price ??
        product.min_price ??
        product.price ??
        product.max_price ??
        null,
    ) ?? 0
  );
}

function getRawScentFamily(item: ProductItem) {
  if (typeof item.scent_family === "object" && item.scent_family !== null) {
    return item.scent_family;
  }

  return null;
}

export function mapApiProducts(items: ProductItem[]): MappedProduct[] {
  return items.map((item, index) => {
    const apiVariants = getProductVariants(item);
    const categoryMeta = extractProductCategoryMeta(item);

    const rawScentFamily = getRawScentFamily(item);

    const scentFamilyId = item.scent_family_id ?? rawScentFamily?.id ?? null;

    const scentFamilyName =
      item.scent_family_name ??
      rawScentFamily?.name ??
      (typeof item.scent_family === "string" ? item.scent_family : null) ??
      item.scent_family_slug ??
      "Fragrance";

    const scentFamilyImage =
      item.scent_family_image ?? rawScentFamily?.image_url ?? null;

    const scentFamilyDescription =
      item.scent_family_description ?? rawScentFamily?.description ?? null;

    const mappedVariants: MappedProductVariant[] = apiVariants.map(
      (variant) => {
        const hasVolume =
          variant.volume_ml !== undefined &&
          variant.volume_ml !== null &&
          String(variant.volume_ml).trim() !== "";

        const volumeValue = hasVolume ? String(variant.volume_ml).trim() : "";
        const volumeLabel = hasVolume ? `${volumeValue} میل` : "";

        const sizeLabel = cleanVariantSize(variant.label);

        const rawPrice = parseNumericPrice(variant.price);
        const rawDiscountPrice = parseNumericPrice(variant.discount_price);
        const rawCompareAtPrice = parseNumericPrice(variant.compare_at_price);

        const displayNumeric =
          rawDiscountPrice !== null && rawDiscountPrice > 0
            ? rawDiscountPrice
            : rawPrice !== null && rawPrice > 0
              ? rawPrice
              : rawCompareAtPrice !== null && rawCompareAtPrice > 0
                ? rawCompareAtPrice
                : null;

        let originalNumeric: number | null = null;

        if (displayNumeric !== null) {
          if (rawPrice !== null && rawPrice > displayNumeric) {
            originalNumeric = rawPrice;
          } else if (
            rawCompareAtPrice !== null &&
            rawCompareAtPrice > displayNumeric
          ) {
            originalNumeric = rawCompareAtPrice;
          }
        }

        const variantImage = variant.images?.[0]?.image_url
          ? getSafeImageSrc(variant.images[0].image_url)
          : null;

        return {
          id: Number(variant.id),
          price: formatPrice(displayNumeric),
          originalPrice:
            originalNumeric !== null ? formatPrice(originalNumeric) : null,
          rawPrice,
          rawDiscountPrice,
          rawCompareAtPrice,
          size: volumeLabel || sizeLabel || "",
          volumeMl: hasVolume ? volumeValue : null,
          image: variantImage,
          images: variant.images ?? [],
          label: volumeLabel || sizeLabel || "واریانت",
          stockQty: Number(variant.stock_qty ?? variant.stock ?? 0),
          isActive: Boolean(variant.is_active),

          // برای سازگاری با UI
          discount_price: rawDiscountPrice,
          compare_at_price: rawCompareAtPrice,
        };
      },
    );

    const basePrice = getProductBasePrice(item);
    const parsedBasePrice = parseNumericPrice(basePrice);
    const productImage = getProductImage(item);

    const finalVariants: MappedProductVariant[] =
      mappedVariants.length > 0
        ? mappedVariants
        : [
            {
              id: item.id,
              price: formatPrice(parsedBasePrice),
              originalPrice: null,
              rawPrice: parsedBasePrice,
              rawDiscountPrice: null,
              rawCompareAtPrice: null,
              size: "",
              volumeMl: null,
              label: "واریانت",
              image: productImage,
              images: [],
              stockQty: Number(item.total_stock ?? 0),
              isActive: Boolean(item.is_active),
              discount_price: null,
              compare_at_price: null,
            },
          ];

    const defaultVariant =
      apiVariants.find((variant) => Boolean(variant.is_default)) ||
      apiVariants.find((variant) => getVariantStock(variant) > 0) ||
      apiVariants[0];

    const layout: "wide" | "standard" = index % 4 === 0 ? "wide" : "standard";
    const tones: MappedProduct["tone"][] = ["light", "soft", "deep"];
    const tone = tones[index % tones.length];

    return {
      id: item.id,
      name: item.name,
      type: item.type || "SINGLE",
      family: scentFamilyName,
      scent_family_id:
        scentFamilyId !== null && scentFamilyId !== undefined
          ? Number(scentFamilyId)
          : null,
      description: item.description || "توضیحاتی برای این محصول ثبت نشده است.",
      scentFamilyDescription,
      scentFamilyImage: scentFamilyImage
        ? getSafeImageSrc(scentFamilyImage)
        : null,
      notes: {
        top: pickFirstNote(item.top_notes, "رایحه ابتدایی"),
        middle: pickFirstNote(item.middle_notes, "رایحه میانی"),
        base: pickFirstNote(item.base_notes, "رایحه پایه"),
      },
      noteDetails: {
        top: {
          title: item.top_notes || "رایحه ابتدایی",
          description: item.top_notes_description ?? null,
          image: item.top_notes_image
            ? getSafeImageSrc(item.top_notes_image)
            : null,
        },
        middle: {
          title: item.middle_notes || "رایحه میانی",
          description: item.middle_notes_description ?? null,
          image: item.middle_notes_image
            ? getSafeImageSrc(item.middle_notes_image)
            : null,
        },
        base: {
          title: item.base_notes || "رایحه پایه",
          description: item.base_notes_description ?? null,
          image: item.base_notes_image
            ? getSafeImageSrc(item.base_notes_image)
            : null,
        },
      },
      image: productImage,
      main_image: item.main_image ? getSafeImageSrc(item.main_image) : null,
      images: item.images ?? [],
      limited: Boolean(item.is_featured),
      isBestSeller: Boolean(item.is_best_seller),
      layout,
      tone,
      variants: finalVariants,
      defaultVariantId: defaultVariant?.id ?? finalVariants[0]?.id ?? null,
      categoryIds: categoryMeta.categoryIds,
      categorySlugs: categoryMeta.categorySlugs,
      categoryNames: categoryMeta.categoryNames,
      categoryLinks: categoryMeta.categoryLinks,
    };
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  const url = createApiUrl(`/api/v1/products/${id}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`);
  }

  const json: ProductDetailsResponse = await res.json();

  if (!json?.data) return null;

  return {
    ...json.data,
    variant_options: json.data.variant_options?.length
      ? json.data.variant_options
      : (json.data.variants ?? []),
  };
}

export async function getProducts(
  params?: ProductQueryParams,
): Promise<ProductsResponse["data"]> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);

  if (params?.is_active !== undefined) {
    searchParams.set("is_active", String(params.is_active));
  }

  if (params?.is_featured !== undefined) {
    searchParams.set("is_featured", String(params.is_featured));
  }

  if (params?.is_best_seller !== undefined) {
    searchParams.set("is_best_seller", String(params.is_best_seller));
  }

  const query = searchParams.toString();
  const url = createApiUrl(`/api/v1/products${query ? `?${query}` : ""}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const json: ProductsResponse = await res.json();

  return json.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(createApiUrl("/api/v1/categories"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  const json: CategoriesResponse = await res.json();

  return Array.isArray(json.data) ? json.data : [];
}

export async function getScentFamilies(): Promise<ScentFamily[]> {
  const res = await fetch(createApiUrl("/api/v1/scent-families?is_active=1"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch scent families");
  }

  const json: ScentFamiliesResponse = await res.json();

  return Array.isArray(json.data) ? json.data : [];
}
