import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { orderService } from "@/server/services/order.service";

type Context = {
  params: Promise<{ id: string }>;
};

function parseId(id: string) {
  const num = Number(id);
  // بررسی اینکه ID حتماً عدد صحیح و مثبت باشد
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    throw new Error("Invalid order id format");
  }
  return num;
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin(request);

    // در Next.js 15 پارامترها Promise هستند
    const resolvedParams = await params;
    const orderId = parseId(resolvedParams.id);

    const order = await orderService.getAdminById(orderId);

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return successResponse(order, "Order fetched successfully");
  } catch (error: unknown) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch order",
      400,
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin(request);

    const resolvedParams = await params;
    const orderId = parseId(resolvedParams.id);
    const body = await request.json();

    const updated = await orderService.updateByAdmin(orderId, {
      status: body?.status,
      payment_status: body?.payment_status,
      admin_notes:
        body?.admin_notes !== undefined ? String(body.admin_notes) : undefined,
    });

    return successResponse(updated, "Order updated successfully");
  } catch (error: unknown) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update order",
      400,
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin(request);

    const resolvedParams = await params;
    const orderId = parseId(resolvedParams.id);

    const deleted = await orderService.deleteByAdmin(orderId);

    return successResponse(deleted, "Order deleted successfully");
  } catch (error: unknown) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete order",
      400,
    );
  }
}
