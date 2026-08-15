import { NextRequest } from "next/server";
import {
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/response";
import { couponService } from "@/server/services/coupon.service";
import { createCouponSchema } from "@/server/validations/coupon.validation";
import { requireAdmin } from "@/server/middlewares/admin";

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return unauthorizedResponse("Unauthorized");
    }

    const body = await request.json();
    const parsed = createCouponSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const coupon = await couponService.createCoupon(parsed.data);
    return createdResponse(coupon, "Coupon created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
