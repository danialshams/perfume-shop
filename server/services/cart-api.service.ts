import { ApiResponse, Cart } from "../types/cart";

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = { message: rawText || "INVALID_JSON_RESPONSE" };
  }

  if (!response.ok) {
    console.error("[cart-api] request failed", {
      status: response.status,
      statusText: response.statusText,
      body: data,
    });

    throw new Error(
      data?.message ||
        data?.error ||
        data?.code ||
        `REQUEST_FAILED_${response.status}`,
    );
  }

  return data as T;
}

export async function fetchCartApi() {
  const response = await fetch("/api/v1/cart", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const result = await parseResponse<ApiResponse<Cart>>(response);

  return result.data;
}

export async function addCartItemApi(params: {
  variant_id: number;
  quantity: number;
}) {
  const payload = {
    variant_id: Number(params.variant_id),
    quantity: Number(params.quantity),
  };

  console.log("[addCartItemApi] request", payload);

  const response = await fetch("/api/v1/cart/items", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await parseResponse<ApiResponse<Cart>>(response);

  console.log("[addCartItemApi] success", result);

  return result.data;
}

export async function updateCartItemApi(
  itemId: number,
  params: {
    quantity: number;
    variant_id: number;
  },
) {
  const response = await fetch(`/api/v1/cart/items/${itemId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quantity: params.quantity,
      variant_id: params.variant_id,
    }),
  });

  const result = await parseResponse<ApiResponse<Cart>>(response);

  return result.data;
}

export async function removeCartItemApi(itemId: number) {
  const response = await fetch(`/api/v1/cart/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result = await parseResponse<ApiResponse<Cart>>(response);

  return result.data;
}

export async function clearCartApi() {
  const response = await fetch("/api/v1/cart", {
    method: "DELETE",
    credentials: "include",
  });

  const result = await parseResponse<ApiResponse<Cart>>(response);

  return result.data;
}
