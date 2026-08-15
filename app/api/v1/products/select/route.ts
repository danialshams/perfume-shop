import { NextRequest } from "next/server";

import { productService } from "@/server/services/product.service";
import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const search = request.nextUrl.searchParams.get("search") || undefined;
    const placementRaw =
      request.nextUrl.searchParams.get("exclude_slider_placement") || undefined;
    const exceptSliderIdRaw =
      request.nextUrl.searchParams.get("exclude_slider_except_id") || undefined;

    const excludeSliderPlacement =
      placementRaw === "HOME" || placementRaw === "PRODUCTS"
        ? placementRaw
        : undefined;

    const excludeSliderExceptId = exceptSliderIdRaw
      ? Number(exceptSliderIdRaw)
      : undefined;

    const items = await productService.getSelectList({
      search,
      excludeSliderPlacement,
      excludeSliderExceptId,
    });

    return successResponse(items, "Products fetched");
  } catch (error: any) {
    console.error("GET /api/v1/products/select error:", error);

    if (error?.message === "Forbidden") {
      return errorResponse("Forbidden", 403);
    }

    return errorResponse("Failed to fetch products", 500);
  }
}
