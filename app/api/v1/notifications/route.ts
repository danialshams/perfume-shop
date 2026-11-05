import { rejectNonAdminNotificationRequest } from "@/server/middlewares/admin-notification-guard";
import { NextRequest, NextResponse } from "next/server";
import { adminNotificationService } from "@/server/services/admin-notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const denied = await rejectNonAdminNotificationRequest(request);
  if (denied) return denied;

  console.log("[ADMIN_NOTIFICATION_API][GET_INITIAL_START]", {
    at: new Date().toISOString(),
  });

  try {
    const data = await adminNotificationService.getInitialState();

    console.log("[ADMIN_NOTIFICATION_API][GET_INITIAL_SUCCESS]", {
      itemCount: data.items.length,
      unreadCount: data.unread_count,
      at: new Date().toISOString(),
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION_API][GET_INITIAL_ERROR]", {
      error,
      at: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "خطا در دریافت اعلان‌ها" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await rejectNonAdminNotificationRequest(request);
  if (denied) return denied;

  console.log("[ADMIN_NOTIFICATION_API][DELETE_ALL_START]", {
    at: new Date().toISOString(),
  });

  try {
    const result = await adminNotificationService.deleteAll();

    console.log("[ADMIN_NOTIFICATION_API][DELETE_ALL_SUCCESS]", {
      result,
      at: new Date().toISOString(),
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION_API][DELETE_ALL_ERROR]", {
      error,
      at: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "خطا در حذف همه اعلان‌ها" },
      { status: 500 },
    );
  }
}
