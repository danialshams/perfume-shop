import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";

import { successResponse, errorResponse } from "@/lib/response";
import { checkoutSchema } from "@/server/validations/checkout.validation";
import { checkoutService } from "@/server/services/checkout.service";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";

const CART_COOKIE_NAME = "cart_token";
const DUPLICATE_MOBILE_MESSAGE = "این شماره همراه قبلاً ثبت شده است";

async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

async function getOptionalCustomerSession(request: NextRequest) {
  try {
    const session = await requireCustomerAuth(request);
    return session;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const validated = checkoutSchema.parse(body);
    const cartToken = await getCartToken();
    const session = await getOptionalCustomerSession(request);
    const customerId = session?.userId ?? null;

    const result = await checkoutService.checkout(validated, {
      cartToken,
      customerId,
    });

    return successResponse(result, "سفارش با موفقیت ثبت شد", 201);
  } catch (error: unknown) {
    console.error("Checkout API error:", error);

    if (error instanceof ZodError) {
      return errorResponse(
        error.issues[0]?.message ?? "اطلاعات ارسالی معتبر نیست",
        422,
        error.issues,
      );
    }

    if (error instanceof SyntaxError) {
      return errorResponse("بدنه درخواست JSON معتبر نیست", 400);
    }

    if (error instanceof Error) {
      if (error.message === DUPLICATE_MOBILE_MESSAGE) {
        return errorResponse(error.message, 409, [
          {
            path: ["mobile"],
            message: error.message,
          },
        ]);
      }

      return errorResponse(error.message, 400);
    }

    return errorResponse("خطای ناشناخته‌ای هنگام ثبت سفارش رخ داد", 500);
  }
}
