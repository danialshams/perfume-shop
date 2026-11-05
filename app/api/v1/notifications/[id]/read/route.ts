import { rejectNonAdminNotificationRequest } from "@/server/middlewares/admin-notification-guard";
import { NextRequest, NextResponse } from "next/server";
import { adminNotificationService } from "@/server/services/admin-notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await rejectNonAdminNotificationRequest(request);
  if (denied) return denied;
  console.log("[ADMIN_NOTIFICATION_API][READ_ONE_START]", {
    at: new Date().toISOString(),
  });

  try {
    const { id } = await context.params;
    const notificationId = Number(id);

    console.log("[ADMIN_NOTIFICATION_API][READ_ONE_PARAMS]", {
      id,
      notificationId,
      at: new Date().toISOString(),
    });

    if (!Number.isFinite(notificationId) || notificationId <= 0) {
      console.warn("[ADMIN_NOTIFICATION_API][READ_ONE_INVALID_ID]", {
        id,
        notificationId,
        at: new Date().toISOString(),
      });

      return NextResponse.json(
        { message: "شناسه نوتیفیکیشن نامعتبر است" },
        { status: 400 },
      );
    }

    const result = await adminNotificationService.markAsRead(notificationId);

    console.log("[ADMIN_NOTIFICATION_API][READ_ONE_SUCCESS]", {
      notificationId,
      result,
      at: new Date().toISOString(),
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION_API][READ_ONE_ERROR]", {
      error,
      at: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "خطا در خواندن اعلان" },
      { status: 500 },
    );
  }
}
