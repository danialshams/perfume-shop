import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/middlewares/admin";

/** All administrative notification operations require an admin session. */
export async function rejectNonAdminNotificationRequest(request: NextRequest) {
  try {
    await requireAdmin(request);
    return null;
  } catch {
    return NextResponse.json(
      { message: "دسترسی به اعلان‌های مدیریت مجاز نیست." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }
}
