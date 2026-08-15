import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { orderService } from "@/server/services/order.service";

export async function GET(request: NextRequest) {
  try {
    // احراز هویت ادمین
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 10));
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const payment_status = searchParams.get("payment_status") || undefined;

    const result = await orderService.getAll({
      page,
      limit,
      search,
      status,
      payment_status,
    });

    return successResponse(result, "Orders fetched successfully");
  } catch (error: unknown) {
    console.error("[ORDERS_GET_ALL_ERROR]:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch orders",
      error instanceof Error && error.message.includes("unauthorized") ? 401 : 400
    );
  }
}
