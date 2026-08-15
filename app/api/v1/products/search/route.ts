import { errorResponse, successResponse } from "@/lib/response";
import { productService } from "@/server/services/product.service";
import { productSearchQuerySchema } from "@/server/validations/product.validation";
import { NextRequest } from "next/server";

function getQueryObject(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

export async function GET(request: NextRequest) {
  try {
    const queryObject = getQueryObject(request);

    const parsed = productSearchQuerySchema.safeParse(queryObject);

    if (!parsed.success) {
      return errorResponse(
        "Invalid search parameters",
        400,
        parsed.error.flatten(),
      );
    }

    const {
      q,
      page,
      limit,
      categoryId,
      categorySlug,
      type,
      is_featured,
      minPrice,
      maxPrice,
      inStock,
      sort,
    } = parsed.data;

    const result = await productService.search(
      q,
      {
        categoryId,
        categorySlug,
        type,
        is_featured,
        minPrice,
        maxPrice,
        inStock,
        sort,
      },
      {
        page,
        limit,
      },
    );

    return successResponse(result, "Products searched successfully");
  } catch (error: unknown) {
    console.error("GET /api/v1/products/search error:", error);

    return errorResponse("Failed to search products", 500, {
      message: error instanceof Error ? error.message : null,
      code:
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : null,
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : null,
    });
  }
}
