import { db } from "@/lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface OrderEntity extends RowDataPacket {
  id: number;
  customer_id: number;
  address_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_landline: string | null;
  customer_email: string | null;
  shipping_province: string;
  shipping_city: string;
  shipping_postal_code: string | null;
  shipping_address: string;
  shipping_plaque: string | null;
  shipping_unit: string | null;
  status: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  payment_intent_id: string | null;
  paid_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemEntity extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_variant_id: number | null;
  product_name: string;
  variant_title: string | null;
  variant_label: string | null;
  volume_ml: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_total: number | null;
  product_snapshot: string | null;
  created_at: Date;
  product_image?: string | null;
}

export interface AdminOrderListRow extends RowDataPacket {
  id: number;
  order_number: string | null;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_landline: string | null;
  customer_email: string | null;
  shipping_city: string;
  shipping_province: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  created_at: Date;
  updated_at: Date;
  items_count: number;
  payment_provider: string | null;
  payment_ref_id: string | null;
  payment_authority: string | null;
  payment_transaction_id: string | null;
  payment_record_status: string | null;
  payment_paid_at: Date | null;
}

export interface AdminOrderDetailsRow extends RowDataPacket {
  id: number;
  order_number: string | null;
  customer_id: number | null;
  address_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_landline: string | null;
  customer_email: string | null;
  shipping_province: string;
  shipping_city: string;
  shipping_postal_code: string | null;
  shipping_address: string;
  shipping_plaque: string | null;
  shipping_floor: string | null;
  shipping_unit: string | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  notes: string | null;
  admin_notes: string | null;
  customer_snapshot: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  paid_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  payment_id: number | null;
  payment_provider: string | null;
  payment_authority: string | null;
  payment_ref_id: string | null;
  payment_amount: number | null;
  payment_record_status: string | null;
  payment_paid_at: Date | null;
  payment_transaction_id: string | null;
  payment_payload: string | null;
  payment_raw_response: string | null;
}

export const orderRepository = {
  async findAll(limit: number, offset: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows;
  },

  async findAdminList(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    payment_status?: string;
  }) {
    const { page, limit, search, status, payment_status } = params;
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const values: Array<string | number> = [];

    if (search?.trim()) {
      where.push(
        `(o.id LIKE ? OR o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)`,
      );
      const s = `%${search.trim()}%`;
      values.push(s, s, s, s, s);
    }

    if (status?.trim()) {
      where.push(`o.status = ?`);
      values.push(status.trim());
    }

    if (payment_status?.trim()) {
      where.push(`o.payment_status = ?`);
      values.push(payment_status.trim());
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await db.execute<AdminOrderListRow[]>(
      `
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_phone,
        o.customer_landline,
        o.customer_email,
        o.shipping_city,
        o.shipping_province,
        o.total_amount,
        o.status,
        o.payment_status,
        o.payment_method,
        o.payment_intent_id,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) AS items_count,
        p.provider AS payment_provider,
        p.ref_id AS payment_ref_id,
        p.authority AS payment_authority,
        p.transaction_id AS payment_transaction_id,
        p.status AS payment_record_status,
        p.paid_at AS payment_paid_at
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN payments p ON p.order_id = o.id
      ${whereClause}
      GROUP BY
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_phone,
        o.customer_landline,
        o.customer_email,
        o.shipping_city,
        o.shipping_province,
        o.total_amount,
        o.status,
        o.payment_status,
        o.payment_method,
        o.payment_intent_id,
        o.created_at,
        o.updated_at,
        p.provider,
        p.ref_id,
        p.authority,
        p.transaction_id,
        p.status,
        p.paid_at
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset],
    );

    const [countRows] = await db.execute<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM orders o
      ${whereClause}
      `,
      values,
    );

    return {
      items: rows,
      total: Number(countRows[0]?.total || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countRows[0]?.total || 0) / limit),
    };
  },
  
  async findAdminById(id: number): Promise<AdminOrderDetailsRow | null> {
    const [rows] = await db.execute<AdminOrderDetailsRow[]>(
      `
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.address_id,
        o.customer_name,
        o.customer_phone,
        o.customer_landline,
        o.customer_email,
        o.shipping_province,
        o.shipping_city,
        o.shipping_postal_code,
        o.shipping_address,
        o.shipping_plaque,
        o.shipping_floor,
        o.shipping_unit,
        o.subtotal_amount,
        o.discount_amount,
        o.shipping_amount,
        o.total_amount,
        o.notes,
        o.admin_notes,
        o.customer_snapshot,
        o.status,
        o.payment_status,
        o.payment_method,
        o.payment_intent_id,
        o.paid_at,
        o.shipped_at,
        o.delivered_at,
        o.cancelled_at,
        o.created_at,
        o.updated_at,
        p.id AS payment_id,
        p.provider AS payment_provider,
        p.authority AS payment_authority,
        p.ref_id AS payment_ref_id,
        p.amount AS payment_amount,
        p.status AS payment_record_status,
        p.paid_at AS payment_paid_at,
        p.transaction_id AS payment_transaction_id,
        p.payload AS payment_payload,
        p.raw_response AS payment_raw_response
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  },

  async findAdminItemsByOrderId(orderId: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `
      SELECT
        oi.*,
        COALESCE(pi.image_url, p.image) AS product_image,
        p.slug AS product_slug
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_images pi 
        ON pi.product_id = oi.product_id AND pi.is_main = 1
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
      `,
      [orderId],
    );

    return rows;
  },

  async findById(
    id: number,
    connection?: PoolConnection,
  ): Promise<OrderEntity | null> {
    const conn = connection || db;
    const [rows] = await conn.execute<OrderEntity[]>(
      connection ? "SELECT * FROM orders WHERE id = ? FOR UPDATE" : "SELECT * FROM orders WHERE id = ?",
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByIdForUser(
    id: number,
    customerId: number,
    connection?: PoolConnection,
  ): Promise<OrderEntity | null> {
    const conn = connection || db;
    const [rows] = await conn.execute<OrderEntity[]>(
      `SELECT * FROM orders WHERE id = ? AND customer_id = ?`,
      [id, customerId],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findItemsByOrderId(
    orderId: number,
    connection?: PoolConnection,
  ): Promise<OrderItemEntity[]> {
    const conn = connection || db;
    const [rows] = await conn.execute<OrderItemEntity[]>(
      `
      SELECT 
        oi.*,
        COALESCE(pi.image_url, p.image) AS product_image
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_images pi 
        ON pi.product_id = oi.product_id AND pi.is_main = 1
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
      `,
      [orderId],
    );
    return rows;
  },

  async createOrder(
    data: {
      customer_id: number;
      address_id?: number | null;
      subtotal_amount: number;
      discount_amount?: number;
      shipping_amount?: number;
      total_amount: number;
      notes?: string | null;
      customer_name: string;
      customer_phone: string;
      customer_landline?: string | null;
      customer_email?: string | null;
      shipping_province: string;
      shipping_city: string;
      shipping_postal_code?: string | null;
      shipping_address: string;
      shipping_plaque?: string | null;
      shipping_unit?: string | null;
      payment_method: string;
      status?: string;
      payment_status?: string;
      payment_intent_id?: string | null;
    },
    connection?: PoolConnection,
  ): Promise<number> {
    const conn = connection || db;
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO orders
       (
         customer_id,
         address_id,
         customer_name,
         customer_phone,
         customer_landline,
         customer_email,
         shipping_province,
         shipping_city,
         shipping_postal_code,
         shipping_address,
         shipping_plaque,
         shipping_unit,
         subtotal_amount,
         discount_amount,
         shipping_amount,
         total_amount,
         notes,
         payment_method,
         status,
         payment_status,
         payment_intent_id,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.customer_id,
        data.address_id ?? null,
        data.customer_name,
        data.customer_phone,
        data.customer_landline ?? null,
        data.customer_email ?? null,
        data.shipping_province,
        data.shipping_city,
        data.shipping_postal_code ?? null,
        data.shipping_address,
        data.shipping_plaque ?? null,
        data.shipping_unit ?? null,
        data.subtotal_amount,
        data.discount_amount ?? 0,
        data.shipping_amount ?? 0,
        data.total_amount,
        data.notes ?? null,
        data.payment_method,
        data.status ?? "PENDING_PAYMENT",
        data.payment_status ?? "UNPAID",
        data.payment_intent_id ?? null,
      ],
    );

    return result.insertId;
  },

  async createOrderItem(
    data: {
      order_id: number;
      product_id: number;
      variant_id?: number | null;
      product_name: string;
      variant_title?: string | null;
      volume_ml?: number | null;
      unit_price: number;
      quantity: number;
      total_price: number;
    },
    connection?: PoolConnection,
  ): Promise<void> {
    const conn = connection || db;
    await conn.execute<ResultSetHeader>(
      `INSERT INTO order_items
       (
         order_id,
         product_id,
         variant_id,
         product_name,
         variant_title,
         volume_ml,
         quantity,
         unit_price,
         total_price
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_id,
        data.product_id,
        data.variant_id ?? null,
        data.product_name,
        data.variant_title ?? null,
        data.volume_ml ?? null,
        data.quantity,
        data.unit_price,
        data.total_price,
      ],
    );
  },

  async updatePaymentFields(
    orderId: number,
    data: {
      status?: string;
      payment_status?: string;
      payment_intent_id?: string | null;
    },
    connection?: PoolConnection,
  ): Promise<void> {
    const conn = connection || db;

    await conn.execute(
      `
      UPDATE orders
      SET
        status = COALESCE(?, status),
        payment_status = COALESCE(?, payment_status),
        payment_intent_id = COALESCE(?, payment_intent_id),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        data.status ?? null,
        data.payment_status ?? null,
        data.payment_intent_id ?? null,
        orderId,
      ],
    );
  },

  async updateAdminOrder(
    orderId: number,
    data: {
      status?: string;
      payment_status?: string;
      admin_notes?: string | null;
    },
    connection?: PoolConnection,
  ) {
    const conn = connection || db;

    const sets: string[] = ["updated_at = NOW()"];
    const values: Array<string | number | null> = [];

    if (data.status !== undefined) {
      sets.push("status = ?");
      values.push(data.status);

      if (data.status === "SHIPPED") {
        sets.push("shipped_at = COALESCE(shipped_at, NOW())");
      }

      if (data.status === "DELIVERED") {
        sets.push("delivered_at = COALESCE(delivered_at, NOW())");
      }

      if (data.status === "CANCELLED") {
        sets.push("cancelled_at = COALESCE(cancelled_at, NOW())");
      }
    }

    if (data.payment_status !== undefined) {
      sets.push("payment_status = ?");
      values.push(data.payment_status);

      if (data.payment_status === "PAID") {
        sets.push("paid_at = COALESCE(paid_at, NOW())");
      }
    }

    if (data.admin_notes !== undefined) {
      sets.push("admin_notes = ?");
      values.push(data.admin_notes);
    }

    values.push(orderId);

    await conn.execute(
      `
      UPDATE orders
      SET ${sets.join(", ")}
      WHERE id = ?
      `,
      values,
    );
  },

  async deleteOrder(orderId: number, connection?: PoolConnection) {
    const conn = connection || db;

    await conn.execute(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
    await conn.execute(`DELETE FROM payments WHERE order_id = ?`, [orderId]);
    await conn.execute(`DELETE FROM orders WHERE id = ?`, [orderId]);
  },

  async updateStatus(
    orderId: number,
    status: string,
    connection?: PoolConnection,
  ) {
    const conn = connection || db;

    await conn.execute(
      `
      UPDATE orders
      SET status = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [status, orderId],
    );
  },
};
