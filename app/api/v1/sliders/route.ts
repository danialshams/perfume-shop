import { NextRequest } from "next/server";
import { productService } from "@/server/services/product.service";
import { sliderService } from "@/server/services/slider.service";
import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { requireAuth } from "@/server/middlewares/auth";

type SliderPlacement = "HOME" | "PRODUCTS";

export async function GET(request: NextRequest) {
  try {
    let isAdmin = false;

    try {
      const user = request.nextUrl.searchParams.get("admin")==="1"
        ? await requireAdmin(request) : await requireAuth(request);
      isAdmin = user?.role === "ADMIN";
    } catch {
      isAdmin = false;
    }

    const placementRaw = request.nextUrl.searchParams.get("placement");

    const placement: SliderPlacement | undefined =
      placementRaw === "HOME" || placementRaw === "PRODUCTS"
        ? placementRaw
        : undefined;

    const result = isAdmin
      ? await sliderService.getAllForAdmin(placement)
      : await sliderService.getAllForUsers(placement);

    return successResponse(result, "Sliders fetched");
  } catch (error: any) {
    console.error("GET /api/v1/sliders error:", error);
    return errorResponse("Failed to fetch sliders", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();

    const productIdRaw = formData.get("product_id");
    const placementRaw = formData.get("placement");
    const isActiveRaw = formData.get("is_active");

    const product_id = Number(productIdRaw);
    const placement: SliderPlacement =
      placementRaw === "PRODUCTS" ? "PRODUCTS" : "HOME";
    const is_active =
      String(isActiveRaw) === "true" || String(isActiveRaw) === "1";

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

    const created = await sliderService.createAuto({
      product,
      placement,
      is_active,
    });

    return successResponse(created, "Slider created successfully");
  } catch (error: any) {
    console.error("POST /api/v1/sliders error:", error);

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

    return errorResponse("Failed to create slider", 500);
  }
}
