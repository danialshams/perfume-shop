import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { db } from "@/lib/db";

export type CartStatus = "ACTIVE" | "ORDERED" | "ABANDONED";

export type CartRow = RowDataPacket & {
  id: string;
  status: CartStatus;
};

export async function findActiveCartByCustomerId(
  customerId: number,
  connection?: PoolConnection,
): Promise<CartRow | null> {
  const conn = connection ?? db;
  const [rows] = await conn.execute<CartRow[]>(
    "SELECT * FROM carts WHERE customer_id = ? AND status = 'ACTIVE' LIMIT 1",
    [customerId],
  );
  return rows[0] ?? null;
}

export type CartItemRow = RowDataPacket & {
  id: number;
  cart_id: string;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number | string;

  original_price: number | string | null;
  product_name: string;
  variant_label: string | null;
  product_image: string | null;
  product_slug: string;
  stock_qty: number;
  line_total: number | string;
};

export type ProductVariantCartRow = RowDataPacket & {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_id: number;
  volume_ml: number | null;
  price: number | string;
  discount_price: number | string | null;
  compare_at_price: number | string | null;
  stock_qty: number;
  stock: number;
};

export type ExistingCartItemRow = RowDataPacket & {
  id: number;
  quantity: number;
};

export type CartItemStockRow = RowDataPacket & {
  id: number;
  variant_id: number;
  stock_qty: number;
  stock: number;
};

type Executor = PoolConnection | typeof db;

export async function findActiveCartByToken(
  token: string,
  executor: Executor = db,
) {
  const [rows] = await executor.execute<CartRow[]>(
    `
    SELECT id, status
    FROM carts
    WHERE id = :token
      AND status = 'ACTIVE'
    LIMIT 1
    `,
    { token },
  );

  return rows[0] ?? null;
}

export async function createCart(token: string, executor: Executor = db) {
  await executor.execute<ResultSetHeader>(
    `
    INSERT INTO carts (id, status)
    VALUES (:token, 'ACTIVE')
    `,
    { token },
  );

  return {
    id: token,
    status: "ACTIVE" as const,
  };
}

export async function findVariantForCart(
  variantId: number,
  executor: Executor = db,
) {
  const [rows] = await executor.execute<ProductVariantCartRow[]>(
    `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      COALESCE(
        (SELECT pvi.image_url FROM product_variant_images pvi WHERE pvi.product_variant_id = pv.id ORDER BY pvi.is_main DESC, pvi.sort_order ASC LIMIT 1),
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1),
        p.image
      ) AS product_image,
      pv.id AS variant_id,
      pv.volume_ml,
      pv.price,
      pv.discount_price,
      pv.compare_at_price,
      pv.stock_qty,
      pv.stock
    FROM product_variants pv
    INNER JOIN products p ON p.id = pv.product_id
    WHERE pv.id = :variantId
      AND pv.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND pv.status = 'ACTIVE'
      AND p.status = 'ACTIVE'
      AND pv.is_active = 1
      AND p.is_active = 1
    LIMIT 1
    `,
    { variantId },
  );

  return rows[0] ?? null;
}

export async function findCartItemByCartAndVariant(
  cartId: string,
  variantId: number,
  executor: Executor = db,
) {
  const [rows] = await executor.execute<ExistingCartItemRow[]>(
    `
    SELECT id, quantity
    FROM cart_items
    WHERE cart_id = :cartId
      AND variant_id = :variantId
    LIMIT 1
    `,
    {
      cartId,
      variantId,
    },
  );

  return rows[0] ?? null;
}

export async function upsertCartItem(
  params: {
    cartId: string;
    productId: number;
    variantId: number;
    quantity: number;
    unitPrice: number;
  },
  executor: Executor = db,
) {
  await executor.execute(
    `
    INSERT INTO cart_items (
      cart_id,
      product_id,
      variant_id,
      quantity,
      unit_price
    )
    VALUES (
      :cartId,
      :productId,
      :variantId,
      :quantity,
      :unitPrice
    )
    ON CONFLICT (cart_id, variant_id) DO UPDATE SET
      quantity = cart_items.quantity + EXCLUDED.quantity,
      unit_price = EXCLUDED.unit_price,
      updated_at = CURRENT_TIMESTAMP
    `,
    {
      cartId: params.cartId,
      productId: params.productId,
      variantId: params.variantId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
    },
  );
}

export async function findCartItems(cartId: string, executor: Executor = db) {
  const [rows] = await executor.execute<CartItemRow[]>(
    `
    SELECT
      ci.id,
      ci.cart_id,
      ci.product_id,
      ci.variant_id,
      ci.quantity,
      ci.unit_price,
      pv.compare_at_price AS original_price,
      p.name AS product_name,
      CASE
        WHEN pv.volume_ml IS NOT NULL THEN CONCAT(pv.volume_ml, ' ml')
        ELSE NULL
      END AS variant_label,
      COALESCE(
        (SELECT pvi.image_url FROM product_variant_images pvi WHERE pvi.product_variant_id = pv.id ORDER BY pvi.is_main DESC, pvi.sort_order ASC LIMIT 1),
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1),
        p.image
      ) AS product_image,
      p.slug AS product_slug,
      COALESCE(pv.stock_qty, pv.stock, 0) AS stock_qty,
      CAST((ci.quantity * ci.unit_price) AS DECIMAL(12,2)) AS line_total
    FROM cart_items ci
    INNER JOIN products p ON p.id = ci.product_id
    INNER JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = :cartId
    ORDER BY ci.id DESC
    `,
    { cartId },
  );

  return rows;
}

export async function findCartItemForUpdate(
  itemId: number,
  cartId: string,
  executor: Executor = db,
) {
  const [rows] = await executor.execute<CartItemStockRow[]>(
    `
    SELECT
      ci.id,
      ci.variant_id,
      pv.stock_qty,
      pv.stock
    FROM cart_items ci
    INNER JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.id = :itemId
      AND ci.cart_id = :cartId
    LIMIT 1
    `,
    {
      itemId,
      cartId,
    },
  );

  return rows[0] ?? null;
}

export async function updateCartItemQuantity(
  itemId: number,
  cartId: string,
  quantity: number,
  executor: Executor = db,
) {
  await executor.execute(
    `
    UPDATE cart_items
    SET quantity = :quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :itemId
      AND cart_id = :cartId
    `,
    {
      itemId,
      cartId,
      quantity,
    },
  );
}

export async function deleteCartItem(
  itemId: number,
  cartId: string,
  executor: Executor = db,
) {
  await executor.execute(
    `
    DELETE FROM cart_items
    WHERE id = :itemId
      AND cart_id = :cartId
    `,
    {
      itemId,
      cartId,
    },
  );
}

export async function clearCartItems(cartId: string, executor: Executor = db) {
  await executor.execute(
    `
    DELETE FROM cart_items
    WHERE cart_id = :cartId
    `,
    { cartId },
  );
}

export async function updateCartItemVariantAndQuantity(
  itemId: number,
  cartId: string,
  params: {
    productId: number;
    variantId: number;
    quantity: number;
    unitPrice: number;
  },
  executor: Executor = db,
) {
  await executor.execute(
    `
    UPDATE cart_items
    SET
      product_id = :productId,
      variant_id = :variantId,
      quantity = :quantity,
      unit_price = :unitPrice,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = :itemId
      AND cart_id = :cartId
    `,
    {
      itemId,
      cartId,
      productId: params.productId,
      variantId: params.variantId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
    },
  );
}

export const cartRepository = {
  findActiveCartByCustomerId,
  findByCustomerId: findActiveCartByCustomerId,
  findActiveCartByToken,
  createCart,
  findVariantForCart,
  findCartItemByCartAndVariant,
  upsertCartItem,
  findCartItems,
  findCartItemForUpdate,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItems,
  clearCart: clearCartItems,
  updateCartItemVariantAndQuantity,
};
