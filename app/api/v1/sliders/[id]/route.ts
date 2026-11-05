import { NextRequest } from "next/server";
import { productService } from "@/server/services/product.service";
import { sliderService } from "@/server/services/slider.service";
import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { requireAuth } from "@/server/middlewares/auth";

type Context = {
  params: Promise<{ id: string }>;
};

type SliderPlacement = "HOME" | "PRODUCTS";

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const sliderId = Number(id);

    if (!sliderId) {
      return errorResponse("Invalid slider id", 400);
    }

    const slider = await sliderService.getById(sliderId);

    if (!slider) {
      return errorResponse("Slider not found", 404);
    }

    let isAdmin = false;

    try {
      const user = await requireAuth(request);
      isAdmin = user?.role === "ADMIN";
    } catch {
      isAdmin = false;
    }

    if (!isAdmin && !slider.is_active) {
      return errorResponse("Slider not found", 404);
    }

    return successResponse(slider, "Slider fetched");
  } catch {
    return errorResponse("Failed to fetch slider", 500);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const sliderId = Number(id);

    if (!sliderId) {
      return errorResponse("Invalid slider id", 400);
    }

    const existing = await sliderService.getById(sliderId);

    if (!existing) {
      return errorResponse("Slider not found", 404);
    }

    const formData = await request.formData();

    const productIdRaw = formData.get("product_id");
    const placementRaw = formData.get("placement");
    const isActiveRaw = formData.get("is_active");

    const product_id =
      productIdRaw === null ? existing.product_id : Number(productIdRaw);

    const placement: SliderPlacement =
      placementRaw === "PRODUCTS" || placementRaw === "HOME"
        ? placementRaw
        : existing.placement;

    const is_active =
      isActiveRaw === null
        ? Boolean(existing.is_active)
        : String(isActiveRaw) === "true" || String(isActiveRaw) === "1";

    if (!product_id || !Number.isInteger(product_id)) {
      return errorResponse("Product is required", 400);
    }

    const product = await productService.getById(product_id);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    // اعتبارسنجی اصلاح‌شده بر اساس is_active
    const isProductActive = Number(product.is_active ?? 1) === 1;

    if (!isProductActive) {
      return errorResponse("Selected product is not active", 400);
    }

    const image_url = product.images?.[0]?.image_url ?? null;

    if (!image_url) {
      return errorResponse("Selected product has no image", 400);
    }

    const updated = await sliderService.updateAuto(sliderId, {
      product,
      placement,
      is_active,
    });

    return successResponse(updated, "Slider updated successfully");
  } catch (error: any) {
    if (error?.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }

    if (error?.message === "PRODUCT_HAS_NO_IMAGE") {
      return errorResponse("Selected product has no image", 400);
    }

    if (error?.message === "DUPLICATE_PRODUCT_PLACEMENT") {
      return errorResponse(
        "این محصول قبلاً برای این بخش به عنوان اسلایدر ثبت شده است",
        400,
      );
    }

    return errorResponse("Failed to update slider", 500);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const sliderId = Number(id);

    if (!sliderId) {
      return errorResponse("Invalid slider id", 400);
    }

    const deleted = await sliderService.delete(sliderId);

    if (!deleted) {
      return errorResponse("Slider not found", 404);
    }

    return successResponse({ id: sliderId }, "Slider deleted");
  } catch (error: any) {
    if (error?.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }

    return errorResponse("Failed to delete slider", 500);
  }
}
