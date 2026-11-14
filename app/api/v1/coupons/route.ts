import { NextRequest } from "next/server";
import {
  badRequestResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/response";
import { couponService } from "@/server/services/coupon.service";
import { updateCouponSchema } from "@/server/validations/coupon.validation";
import { requireAdmin } from "@/server/middlewares/admin";

function getIdFromRequest(request: NextRequest): number | null {
  const idParam = request.nextUrl.searchParams.get("id");
  if (!idParam) return null;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;

  return id;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return unauthorizedResponse("Unauthorized");
    }

    const coupons = await couponService.listCoupons();
    return successResponse(coupons, "Coupons fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return unauthorizedResponse("Unauthorized");
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return badRequestResponse("Valid coupon id is required");
    }

    const body = await request.json();
    const parsed = updateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten());
    }

    const coupon = await couponService.updateCoupon(id, parsed.data);
    return successResponse(coupon, "Coupon updated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return unauthorizedResponse("Unauthorized");
    }

    const id = getIdFromRequest(request);
    if (!id) {
      return badRequestResponse("Valid coupon id is required");
    }

    await couponService.deleteCoupon(id);
    return successResponse(null, "Coupon deleted successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
