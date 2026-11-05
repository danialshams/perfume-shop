import { errorResponse } from "@/lib/response";

/**
 * There is a separate public customer registration flow.
 * Administrative accounts must be provisioned out-of-band by the owner.
 * Do not issue staff JWTs or create internal users from an open endpoint.
 */
export async function POST() {
  return errorResponse(
    "ثبت‌نام عمومی حساب مدیریتی غیرفعال است.",
    403,
  );
}
