import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { cookies } from "next/headers";
import { updateCartItemSchema } from "@/server/validations/cart.validation";
import { updateCartItem, removeCartItem } from "@/server/services/cart.service";

const CART_COOKIE_NAME = "cart_token";

async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

function getStatusByError(message: string) {
  switch (message) {
    case "CART_ITEM_NOT_FOUND":
      return 404;
    case "INSUFFICIENT_STOCK":
      return 409;
    default:
      return 503;
  }
}
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {

    const { itemId } = await context.params;

    const numericItemId = Number(itemId);

    if (!Number.isInteger(numericItemId) || numericItemId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "INVALID_ITEM_ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const payload = updateCartItemSchema.parse(body);

    const token = await getCartToken();

    const cart = await updateCartItem({
      token,
      itemId: numericItemId,
      quantity: payload.quantity,
      variant_id: payload.variant_id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Cart item updated successfully",
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
    const known = ["CART_ITEM_NOT_FOUND", "INSUFFICIENT_STOCK", "OUT_OF_STOCK"].includes(message);
    if (!known && !(error instanceof ZodError)) console.error("Cart item mutation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: known ? message : error instanceof ZodError ? "درخواست نامعتبر است." : "امکان بروزرسانی سبد خرید وجود ندارد.",
      },
      {
        status: error instanceof ZodError ? 422 : getStatusByError(message),
      },
    );
  }
}


export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;

    const numericItemId = Number(itemId);

    if (!Number.isInteger(numericItemId) || numericItemId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "INVALID_ITEM_ID",
        },
        {
          status: 400,
        },
      );
    }

    const token = await getCartToken();

    const cart = await removeCartItem({
      token,
      itemId: numericItemId,
    });

    const response = NextResponse.json({
      success: true,
      message: "Cart item removed successfully",
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
    const known = ["CART_ITEM_NOT_FOUND", "INSUFFICIENT_STOCK", "OUT_OF_STOCK"].includes(message);
    if (!known && !(error instanceof ZodError)) console.error("Cart item mutation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: known ? message : error instanceof ZodError ? "درخواست نامعتبر است." : "امکان بروزرسانی سبد خرید وجود ندارد.",
      },
      {
        status: error instanceof ZodError ? 422 : getStatusByError(message),
      },
    );
  }
}
