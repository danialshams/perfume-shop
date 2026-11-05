import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { cookies } from "next/headers";
import { addCartItem } from "@/server/services/cart.service";
import { addCartItemSchema } from "@/server/validations/cart.validation";

const CART_COOKIE_NAME = "cart_token";

async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

function getStatusByError(message: string) {
  switch (message) {
    case "PRODUCT_VARIANT_NOT_FOUND":
      return 404;
    case "OUT_OF_STOCK":
    case "INSUFFICIENT_STOCK":
      return 409;
    default:
      return 503;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();


    const payload = addCartItemSchema.parse(body);


    const token = await getCartToken();


    const cart = await addCartItem({
      token,
      variant_id: payload.variant_id,
      quantity: payload.quantity,
    });


    const response = NextResponse.json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });

    response.cookies.set(CART_COOKIE_NAME, cart.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {

    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const known = ["PRODUCT_VARIANT_NOT_FOUND", "OUT_OF_STOCK", "INSUFFICIENT_STOCK"].includes(message);
    if (!known && !(error instanceof ZodError)) console.error("Cart item add failed:", error);


    return NextResponse.json(
      {
        success: false,
        message: known ? message : error instanceof ZodError ? "درخواست نامعتبر است." : "افزودن محصول در حال حاضر امکان‌پذیر نیست.",
      },
      {
        status: error instanceof ZodError ? 422 : getStatusByError(message),
      },
    );
  }
}
