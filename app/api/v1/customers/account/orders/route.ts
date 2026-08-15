import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";
import { orderService } from "@/server/services/order.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireCustomerAuth(request);
    const customerId = session.userId || (session as any).id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربری معتبر یافت نشد" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "5", 10));

    const result = await orderService.getCustomerOrders({
      customerId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: result.orders,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Error in customer orders route:", error);

    const message =
      error?.message === "Unauthorized"
        ? "نشست شما منقضی شده است؛ دوباره وارد شوید."
        : error?.message || "خطایی در دریافت سفارش‌ها رخ داد";

    return NextResponse.json(
      { success: false, message },
      { status: error?.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
