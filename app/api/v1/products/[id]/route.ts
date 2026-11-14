import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { productService } from "@/server/services/product.service";
import { updateProductSchema } from "@/server/validations/product.validation";
import { NextRequest } from "next/server";
import { isPublicProduct } from "@/server/utils/product-visibility";
import {campaignPublicVariants} from "@/server/campaign-pricing";
import {readSiteContent} from "@/server/site-content";

type Context = {
  params: Promise<{ id: string }>;
};

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
    return undefined;
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
  const type = body.type;
  const isSingleProduct = type === "SINGLE";

  const slug =
    body.slug?.trim() ||
    (body.name ? toPersianSafeSlug(body.name) : undefined);

  return {
    ...body,

    ...(slug ? { slug } : {}),

    ...(type !== undefined ? { type } : {}),
    status: "ACTIVE" as const,

    ...(body.is_active !== undefined ? { is_active: normalizeBoolean(body.is_active, true) } : {}),
    ...(body.is_featured !== undefined ? { is_featured: normalizeBoolean(body.is_featured, false) } : {}),
    ...(body.is_best_seller !== undefined ? { is_best_seller: normalizeBoolean(body.is_best_seller, false) } : {}),

    ...(body.category_id !== undefined ? {
      category_id: body.category_id === null || body.category_id === "" ? null : Number(body.category_id),
    } : {}),

    ...(body.parent_category_id !== undefined ? {
      parent_category_id: body.parent_category_id === null || body.parent_category_id === "" ? null : Number(body.parent_category_id),
    } : {}),

    category_links: normalizeCategoryLinks(body),

    images: normalizeImages(body.images),

    variants: normalizeVariants(body.variants, isSingleProduct),
    ...(body.voice_file === "" ? {voice_file:null} : {}),

    ...(body.scent_family_id !== undefined ? {
      scent_family_id: body.scent_family_id === null || body.scent_family_id === "" ? null : Number(body.scent_family_id),
    } : {}),

    new_scent_family: normalizeNewScentFamily(body),
  };
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return errorResponse("Invalid product id", 400);
    }

    const result = await productService.getById(productId);

    if (!result) {
      return errorResponse("Product not found", 404);
    }

    let isAdmin = false;
    try {
      await requireAdmin(request);
      isAdmin = true;
    } catch {
      // Public visitors cannot inspect an unpublished product.
    }
    if (!isAdmin && !isPublicProduct(result)) {
      return errorResponse("Product not found", 404);
    }
    const content=isAdmin?null:await readSiteContent();
    return successResponse(
      isAdmin ? result : { ...result, variants: campaignPublicVariants(result.variants,content!,productId) },
      "Product fetched"
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/products/[id] error:", error);

    return errorResponse("Failed to fetch product", 500);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return errorResponse("Invalid product id", 400);
    }

    const body = await request.json();
    const normalizedBody = normalizeProductBody(body);

    const parsed = updateProductSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      console.error(
        "UPDATE PRODUCT VALIDATION ERROR:",
        JSON.stringify(parsed.error.issues, null, 2),
      );

      return errorResponse("لطفاً اطلاعات محصول را بررسی کنید؛ بعضی فیلدها معتبر نیستند.", 400, {
        flatten: parsed.error.flatten(),
        issues: parsed.error.issues,
      });
    }

    const updated = await productService.update(productId, parsed.data);

    if (!updated) {
      return errorResponse("Product not found", 404);
    }

    return successResponse(updated, "Product updated successfully");
  } catch (error: any) {
    console.error("PUT /api/v1/products/[id] error:", error);

    return errorResponse("Failed to update product", 500);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return errorResponse("Invalid product id", 400);
    }

    const deleted = await productService.softDelete(productId);

    if (!deleted) {
      return errorResponse("Product not found", 404);
    }

    return successResponse({ id: productId }, "Product deleted successfully");
  } catch (error: any) {
    console.error("DELETE /api/v1/products/[id] error:", error);

    return errorResponse("Failed to delete product", 500);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return errorResponse("Invalid product id", 400);
    }

    const body = await request.json().catch(() => ({}));

    if (body?.action !== "restore") {
      return errorResponse("Invalid action", 400);
    }

    const restored = await productService.restore(productId);

    if (!restored) {
      return errorResponse("Product not found", 404);
    }

    return successResponse({ id: productId }, "Product restored successfully");
  } catch (error: any) {
    console.error("PATCH /api/v1/products/[id] error:", error);

    return errorResponse("Failed to restore product", 500);
  }
}
