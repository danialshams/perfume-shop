import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { productService } from "@/server/services/product.service";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/server/validations/product.validation";
import { NextRequest } from "next/server";

function getQueryObject(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return Object.fromEntries(searchParams.entries());
}

function normalizeBoolean(value: any, defaultValue = true) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();

    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return Boolean(value);
}

function toPersianSafeSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCategoryLinks(body: any) {
  if (!Array.isArray(body?.category_links)) {
    return [];
  }

  return body.category_links
    .map((link: any) => ({
      parent_id:
        link.parent_id === null ||
        link.parent_id === undefined ||
        link.parent_id === ""
          ? null
          : Number(link.parent_id),

      child_id:
        link.child_id === null ||
        link.child_id === undefined ||
        link.child_id === ""
          ? null
          : Number(link.child_id),
    }))
    .filter((link: any) => link.parent_id && link.child_id);
}

function normalizeImages(images: any[] | undefined) {
  if (!Array.isArray(images)) return undefined;

  return images
    .map((image: any, index: number) => ({
      image_url: String(image.image_url || "").trim(),
      is_main:
        image.is_main === undefined
          ? index === 0
          : normalizeBoolean(image.is_main, false),
    }))
    .filter((image) => image.image_url);
}

function normalizeVariants(
  variants: any[] | undefined,
  isSingleProduct: boolean,
) {
  if (!Array.isArray(variants)) return undefined;

  return variants.map((variant: any) => {
    const baseVariant: any = {
      volume_ml:
        variant.volume_ml === null ||
        variant.volume_ml === undefined ||
        variant.volume_ml === ""
          ? null
          : Number(variant.volume_ml),

      price: Number(variant.price || 0),

      discount_price:
        variant.discount_price === null ||
        variant.discount_price === undefined ||
        variant.discount_price === ""
          ? null
          : Number(variant.discount_price),

      stock_qty: Number(variant.stock_qty || 0),

      is_active: normalizeBoolean(variant.is_active, true),
    };

    if (isSingleProduct) {
      baseVariant.images = [];
    } else {
      baseVariant.images = Array.isArray(variant.images)
        ? variant.images
            .map((image: any, index: number) => ({
              image_url: String(image.image_url || "").trim(),
              is_main:
                image.is_main === undefined
                  ? index === 0
                  : normalizeBoolean(image.is_main, false),
            }))
            .filter((image: any) => image.image_url)
        : [];
    }

    return baseVariant;
  });
}

function normalizeNewScentFamily(body: any) {
  if (!body?.new_scent_family) {
    return undefined;
  }

  return {
    name: String(body.new_scent_family.name || "").trim(),
    image_url: String(body.new_scent_family.image_url || "").trim(),
  };
}

function normalizeProductBody(body: any) {
  const type = body.type || "SINGLE";
  const isSingleProduct = type === "SINGLE";

  const slug =
    body.slug?.trim() ||
    (body.name ? toPersianSafeSlug(body.name) : undefined);

  return {
    ...body,

    slug,
    type,

    is_active: normalizeBoolean(body.is_active, true),
    is_featured: normalizeBoolean(body.is_featured, false),
    is_best_seller: normalizeBoolean(body.is_best_seller, false),

    category_id:
      body.category_id === null ||
      body.category_id === undefined ||
      body.category_id === ""
        ? null
        : Number(body.category_id),

    parent_category_id:
      body.parent_category_id === null ||
      body.parent_category_id === undefined ||
      body.parent_category_id === ""
        ? null
        : Number(body.parent_category_id),

    category_links: normalizeCategoryLinks(body),

    images: normalizeImages(body.images),

    variants: normalizeVariants(body.variants, isSingleProduct),

    scent_family_id:
      body.scent_family_id === null ||
      body.scent_family_id === undefined ||
      body.scent_family_id === ""
        ? null
        : Number(body.scent_family_id),

    new_scent_family: normalizeNewScentFamily(body),
  };
}

export async function GET(request: NextRequest) {
  try {
    const queryObject = getQueryObject(request);
    const parsed = productListQuerySchema.safeParse(queryObject);

    if (!parsed.success) {
      return errorResponse(
        "Invalid query parameters",
        400,
        parsed.error.flatten(),
      );
    }

    const { page, limit, ...filters } = parsed.data;

    const result = await productService.getAll(filters, { page, limit });

    return successResponse(result, "Products fetched successfully");
  } catch (error: any) {
    return errorResponse("Failed to fetch products", 500, {
      message: error?.message ?? null,
      code: error?.code ?? null,
      stack:
        process.env.NODE_ENV === "development" ? (error?.stack ?? null) : null,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const normalizedBody = normalizeProductBody(body);

    const parsed = createProductSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      console.error(
        "CREATE PRODUCT VALIDATION ERROR:",
        JSON.stringify(parsed.error.issues, null, 2),
      );

      return errorResponse("Invalid product data", 400, {
        flatten: parsed.error.flatten(),
        issues: parsed.error.issues,
      });
    }

    const product = await productService.create(parsed.data);

    return successResponse(product, "Product created successfully", 201);
  } catch (error: any) {
    console.error("POST /api/v1/products error:", error);

    return errorResponse("Failed to create product", 500, {
      message: error?.message ?? null,
      code: error?.code ?? null,
      stack:
        process.env.NODE_ENV === "development" ? (error?.stack ?? null) : null,
    });
  }
}
