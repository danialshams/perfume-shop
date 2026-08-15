import { NextRequest, NextResponse } from "next/server";
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
      return 400;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("CART_POST_BODY:", body);

    const payload = addCartItemSchema.parse(body);

    console.log("CART_POST_PAYLOAD:", payload);

    const token = await getCartToken();

    console.log("CART_POST_COOKIE_TOKEN:", token);

    const cart = await addCartItem({
      token,
      variant_id: payload.variant_id,
      quantity: payload.quantity,
    });

    console.log("CART_POST_RESULT:", cart);

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
    console.error("CART_POST_ERROR_FULL:", error);

    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    console.error("CART_POST_ERROR_MESSAGE:", message);

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: getStatusByError(message),
      },
    );
  }
}
