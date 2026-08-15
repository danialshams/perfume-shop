import {
  ProductFilters,
  listProducts,
  findProductById,
  findProductBySlug,
  ProductCreateInput,
  createProduct,
  ProductUpdateInput,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  permanentlyDeleteProduct,
  getSelectProducts,
} from "../repositories/product.repository";

import { sliderService } from "@/server/services/slider.service";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProductType(type?: string | null): "SINGLE" | "GROUPED" {
  return type === "GROUPED" ? "GROUPED" : "SINGLE";
}

function normalizeCreatePayload(
  data: Omit<ProductCreateInput, "slug"> & { slug?: string },
): ProductCreateInput {
  const type = normalizeProductType(data.type);
  const slug = data.slug?.trim() || toSlug(data.name);

  const variants = data.variants.map((variant) => ({
    ...variant,
    images: type === "SINGLE" ? [] : (variant.images ?? []),
  }));

  return {
    ...data,
    type,
    slug,
    variants,
  };
}

function normalizeUpdatePayload(
  data: Omit<ProductUpdateInput, "slug"> & { slug?: string },
): ProductUpdateInput {
  const payload: ProductUpdateInput = {
    ...data,
  };

  if (data.slug !== undefined) {
    payload.slug = data.slug?.trim() || undefined;
  } else if (data.name) {
    payload.slug = toSlug(data.name);
  }

  if (data.type !== undefined) {
    payload.type = normalizeProductType(data.type);
  }

  if (data.variants !== undefined && payload.type === "SINGLE") {
    payload.variants = data.variants.map((variant) => ({
      ...variant,
      images: [],
    }));
  }

  return payload;
}

export class ProductService {
  async getList(
    filters: ProductFilters = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    return listProducts(filters, pagination);
  }

  async getAll(
    filters: ProductFilters = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    return this.getList(filters, pagination);
  }

  async search(
    query: string,
    filters: Omit<
      ProductFilters,
      "search" | "status" | "is_active" | "withDeleted" | "onlyDeleted"
    > = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    return this.getList(
      {
        ...filters,
        search: query.trim(),
        status: "ACTIVE",
        is_active: 1,
        withDeleted: false,
        onlyDeleted: false,
      },
      pagination,
    );
  }

  async getById(id: number) {
    return findProductById(id);
  }

  async getByIdOrSlug(idOrSlug: string) {
    const numericId = Number(idOrSlug);

    if (!Number.isNaN(numericId) && String(numericId) === String(idOrSlug)) {
      const byId = await findProductById(numericId);
      if (byId) return byId;
    }

    return findProductBySlug(idOrSlug);
  }

  // اضافه کردن به ابتدای متد create
  async create(data: Omit<ProductCreateInput, "slug"> & { slug?: string }) {
    const payload = normalizeCreatePayload(data);

    const id = await createProduct(payload);

    return this.getById(id);
  }

  async update(
    id: number,
    data: Omit<ProductUpdateInput, "slug"> & { slug?: string },
  ) {
    const currentProduct = await findProductById(id);

    if (!currentProduct) {
      return null;
    }

    const payload = normalizeUpdatePayload(data);
    const effectiveType = normalizeProductType(
      payload.type ?? currentProduct.type,
    );

    if (payload.variants !== undefined && effectiveType === "SINGLE") {
      payload.variants = payload.variants.map((variant) => ({
        ...variant,
        images: [],
      }));
    }

    await updateProduct(id, payload);

    return this.getById(id);
  }

  async softDelete(id: number) {
    return softDeleteProduct(id);
  }

  async restore(id: number) {
    return restoreProduct(id);
  }

  async forceDelete(id: number) {
    return permanentlyDeleteProduct(id);
  }

  async getSelectList(params: {
    search?: string;
    excludeSliderPlacement?: "HOME" | "PRODUCTS";
    excludeSliderExceptId?: number;
  }) {
    let excludeProductIds: number[] = [];

    if (params.excludeSliderPlacement) {
      excludeProductIds = await sliderService.getUsedProductIdsByPlacement(
        params.excludeSliderPlacement,
        params.excludeSliderExceptId,
      );
    }

    return getSelectProducts({
      search: params.search,
      excludeProductIds,
    });
  }
}

export const productService = new ProductService();
