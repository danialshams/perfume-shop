import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCart, clearCart } from "@/server/services/cart.service";

const CART_COOKIE_NAME = "cart_token";

function errorResponse(error: unknown) {
  console.error("[CART_API_ERROR]", error);
  return NextResponse.json(
    { success: false, message: "ارتباط با سبد خرید برقرار نشد. لطفاً دوباره تلاش کنید." },
    { status: 503 },
  );
}

async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

async function setCartCookie(response: NextResponse, token: string) {
  response.cookies.set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function GET() {
  try {
    const token = await getCartToken();
    const cart = await getCart(token);

    const response = NextResponse.json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });

    await setCartCookie(response, cart.token);

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const token = await getCartToken();
    const cart = await clearCart(token);

    const response = NextResponse.json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });

    await setCartCookie(response, cart.token);

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
