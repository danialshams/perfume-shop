import crypto from "crypto";
import { db } from "@/lib/db";
import {
  findActiveCartByToken,
  createCart,
  findCartItems,
  findVariantForCart,
  findCartItemByCartAndVariant,
  upsertCartItem,
  findCartItemForUpdate,
  updateCartItemVariantAndQuantity,
  deleteCartItem,
  clearCartItems,
} from "../repositories/cart.repository";

export type CartSummary = {
  subtotal: number;
  total_quantity: number;
  items_count: number;
};

export type CartItemResponse = {
  id: number;
  cart_id: string;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  original_price: number | null;
  product_name: string;
  variant_label: string | null;
  product_image: string | null;
  line_total: number;
  stock_qty: number;
  product_slug: string;
};

export type CartResponse = {
  id: string;
  token: string;
  status: "ACTIVE" | "ORDERED" | "ABANDONED";
  items: CartItemResponse[];
  summary: CartSummary;
};

function createCartToken() {
  return crypto.randomUUID();
}

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function getVariantLabel(variant: {
  volume_ml?: number | null;
}) {
  if (variant.volume_ml && Number(variant.volume_ml) > 0) {
    return `${Number(variant.volume_ml).toLocaleString("fa-IR")} میل`;
  }
  return "واریانت";
}

export async function getOrCreateCart(token?: string | null) {
  if (token) {
    const existing = await findActiveCartByToken(token);
    if (existing) return existing;
  }

  const newToken = createCartToken();
  return createCart(newToken);
}

export async function getCart(token?: string | null): Promise<CartResponse> {
  const cart = await getOrCreateCart(token);
  const rows = await findCartItems(cart.id);

  const items = rows.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unit_price: toNumber(item.unit_price),
    original_price:
      item.original_price === null || item.original_price === undefined
        ? null
        : toNumber(item.original_price),
    line_total: toNumber(item.line_total),
    stock_qty: Number(item.stock_qty ?? 0),
  }));

  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unit_price;
  }, 0);

  const totalQuantity = items.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);

  return {
    id: cart.id,
    token: cart.id,
    status: cart.status,
    items,
    summary: {
      subtotal,
      total_quantity: totalQuantity,
      items_count: items.length,
    },
  };
}

export async function addCartItem(params: {
  token?: string | null;
  variant_id: number;
  quantity: number;
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let cart;
    if (params.token) {
      cart = await findActiveCartByToken(params.token, connection);
    }

    if (!cart) {
      const token = createCartToken();
      cart = await createCart(token, connection);
    }

    const variant = await findVariantForCart(params.variant_id, connection);

    if (!variant) {
      throw new Error("PRODUCT_VARIANT_NOT_FOUND");
    }

    const stockQty = Number(variant.stock_qty ?? variant.stock ?? 0);

    if (stockQty <= 0) {
      throw new Error("OUT_OF_STOCK");
    }

    const existingItem = await findCartItemByCartAndVariant(
      cart.id,
      params.variant_id,
      connection,
    );

    const existingQuantity = Number(existingItem?.quantity ?? 0);
    const nextQuantity = existingQuantity + params.quantity;

    if (nextQuantity > stockQty) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const unitPrice = toNumber(variant.discount_price ?? variant.price);
    await upsertCartItem(
      {
        cartId: cart.id,
        productId: variant.product_id,
        variantId: variant.variant_id,
        quantity: params.quantity,
        unitPrice,
      },
      connection,
    );

    await connection.commit();

    return getCart(cart.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function updateCartItem(params: {
  token?: string | null;
  itemId: number;
  quantity: number;
  variant_id: number;
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const cart = await getOrCreateCart(params.token);

    const existingItem = await findCartItemForUpdate(
      params.itemId,
      cart.id,
      connection,
    );

    if (!existingItem) {
      throw new Error("CART_ITEM_NOT_FOUND");
    }

    const variant = await findVariantForCart(params.variant_id, connection);

    if (!variant) {
      throw new Error("PRODUCT_VARIANT_NOT_FOUND");
    }

    const stockQty = Number(variant.stock_qty ?? variant.stock ?? 0);

    if (params.quantity > stockQty) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const unitPrice = toNumber(variant.discount_price ?? variant.price);

    await updateCartItemVariantAndQuantity(
      params.itemId,
      cart.id,
      {
        productId: variant.product_id,
        variantId: variant.variant_id,
        quantity: params.quantity,
        unitPrice,
      },
      connection,
    );

    await connection.commit();

    return getCart(cart.id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeCartItem(params: {
  token?: string | null;
  itemId: number;
}) {
  const cart = await getOrCreateCart(params.token);

  await deleteCartItem(params.itemId, cart.id);

  return getCart(cart.id);
}

export async function clearCart(token?: string | null) {
  const cart = await getOrCreateCart(token);

  await clearCartItems(cart.id);

  return getCart(cart.id);
}
