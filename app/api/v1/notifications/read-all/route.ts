import { NextResponse } from "next/server";
import { adminNotificationService } from "@/server/services/admin-notification.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST() {
  console.log("[ADMIN_NOTIFICATION_API][READ_ALL_START]", {
    at: new Date().toISOString(),
  });

  try {
    const result = await adminNotificationService.markAllAsRead();

    console.log("[ADMIN_NOTIFICATION_API][READ_ALL_SUCCESS]", {
      result,
      at: new Date().toISOString(),
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ADMIN_NOTIFICATION_API][READ_ALL_ERROR]", {
      error,
      at: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "خطا در خواندن همه اعلان‌ها" },
      { status: 500 },
    );
  }
}
