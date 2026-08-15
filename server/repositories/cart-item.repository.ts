import { db } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface ProductVariantForCartRow extends RowDataPacket {
  id: number;
  product_id: number;
  price: string;
  volume_ml: number | null;
  stock: number;
  is_active: number;
  product_name: string;
  product_slug: string;
  product_is_active: number;
  product_deleted_at: string | null;
}

export interface CartItemRow extends RowDataPacket {
  id: number;
  cart_id: number;
  product_variant_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemDetailRow extends RowDataPacket {
  id: number;
  cart_id: number;
  product_variant_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_id: number;
  product_name: string;
  product_slug: string;
  volume_ml: number | null;
  price: string;
  stock: number;
  is_active: number;
}

export const cartItemRepository = {
  async findVariantById(
    productVariantId: number,
  ): Promise<ProductVariantForCartRow | null> {
    const [rows] = await db.query<ProductVariantForCartRow[]>(
      `
    SELECT
      pv.id,
      pv.product_id,
      pv.price,
      pv.volume_ml,
      pv.stock_qty AS stock,
      pv.is_active,
      p.name AS product_name,
      p.slug AS product_slug,
      p.is_active AS product_is_active,
      p.deleted_at AS product_deleted_at
    FROM product_variants pv
    INNER JOIN products p ON p.id = pv.product_id
    WHERE pv.id = ?
    LIMIT 1
    `,
      [productVariantId],
    );

    return rows[0] ?? null;
  },
  async findCartItem(
    cartId: number,
    productVariantId: number,
  ): Promise<CartItemRow | null> {
    const [rows] = await db.query<CartItemRow[]>(
      `
      SELECT id, cart_id, product_variant_id, quantity, created_at, updated_at
      FROM cart_items
      WHERE cart_id = ? AND product_variant_id = ?
      LIMIT 1
      `,
      [cartId, productVariantId],
    );

    return rows[0] ?? null;
  },

  async findCartItemById(cartItemId: number): Promise<CartItemRow | null> {
    const [rows] = await db.query<CartItemRow[]>(
      `
      SELECT id, cart_id, product_variant_id, quantity, created_at, updated_at
      FROM cart_items
      WHERE id = ?
      LIMIT 1
      `,
      [cartItemId],
    );

    return rows[0] ?? null;
  },

  async getItemsByCartId(cartId: number): Promise<CartItemDetailRow[]> {
    const [rows] = await db.query<CartItemDetailRow[]>(
      `
      SELECT
        ci.id,
        ci.cart_id,
        ci.product_variant_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        pv.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        pv.volume_ml,
        pv.price,
        pv.stock_qty AS stock,
        pv.is_active
      FROM cart_items ci
      INNER JOIN product_variants pv ON pv.id = ci.product_variant_id
      INNER JOIN products p ON p.id = pv.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC
      `,
      [cartId],
    );

    return rows;
  },

  async insert(
    cartId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<number> {
    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT INTO cart_items (cart_id, product_variant_id, quantity)
      VALUES (?, ?, ?)
      `,
      [cartId, productVariantId, quantity],
    );

    return result.insertId;
  },

  async updateQuantity(cartItemId: number, quantity: number): Promise<void> {
    await db.execute(
      `
      UPDATE cart_items
      SET quantity = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [quantity, cartItemId],
    );
  },

  async updateQuantityByComposite(
    cartId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<void> {
    await db.execute(
      `
      UPDATE cart_items
      SET quantity = ?, updated_at = NOW()
      WHERE cart_id = ? AND product_variant_id = ?
      `,
      [quantity, cartId, productVariantId],
    );
  },

  async deleteById(cartItemId: number): Promise<void> {
    await db.execute(
      `
      DELETE FROM cart_items
      WHERE id = ?
      `,
      [cartItemId],
    );
  },

  async getDetailedCartByUserId(userId: number) {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        c.id AS cart_id,
        c.user_id,
        ci.id AS item_id,
        ci.quantity,
        ci.product_variant_id,
        pv.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        pv.volume_ml,
        pv.price,
        pv.stock_qty AS stock,
        pv.is_active AS variant_is_active,
        p.is_active AS product_is_active,
        p.deleted_at AS product_deleted_at
      FROM carts c
      LEFT JOIN cart_items ci ON ci.cart_id = c.id
      LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE c.user_id = ?
      ORDER BY ci.id DESC
      `,
      [userId],
    );

    return rows;
  },
};
