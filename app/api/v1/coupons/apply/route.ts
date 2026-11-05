import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/response";
import { couponService } from "@/server/services/coupon.service";
import { applyCouponSchema } from "@/server/validations/coupon.validation";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth(request);
    if (!user) {
      return unauthorizedResponse("Unauthorized");
    }

    const body = await request.json();
    const parsed = applyCouponSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const result = await couponService.applyCoupon(user.userId, parsed.data);
    return successResponse(result, "Coupon applied successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
