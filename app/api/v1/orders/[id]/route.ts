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
    const body = await request.json() as Record<string,unknown>;
    if("payment_status" in body)
      return errorResponse("وضعیت پرداخت فقط از مسیر تأیید درگاه تغییر می‌کند.",422);
    if(body.status!==undefined&&!["PROCESSING","SHIPPED","DELIVERED"].includes(String(body.status)))
      return errorResponse("وضعیت سفارش نامعتبر است.",422);
    if(body.admin_notes!==undefined&&(typeof body.admin_notes!=="string"||body.admin_notes.length>1000))
      return errorResponse("حداکثر طول یادداشت داخلی ۱۰۰۰ کاراکتر است.",422);
    if(body.status===undefined&&body.admin_notes===undefined)
      return errorResponse("اطلاعاتی برای ذخیره ارسال نشده است.",422);
    const updated = await orderService.updateByAdmin(orderId, {
      status: body.status as string|undefined,
      admin_notes: body.admin_notes as string|undefined,
    });

    return successResponse(updated, "Order updated successfully");
  } catch (error: unknown) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update order",
      400,
    );
  }
}

export async function DELETE(request:NextRequest){
 try{await requireAdmin(request)}catch{return errorResponse("دسترسی مدیر لازم است.",403)}
 return errorResponse("حذف دائمی سفارش و تراکنش‌ها برای حفظ سوابق مالی غیرفعال است.",405);
}
