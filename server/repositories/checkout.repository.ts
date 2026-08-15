import { db } from "@/lib/db";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

type DbExecutor = Pool | PoolConnection;

function getExecutor(connection?: PoolConnection): DbExecutor {
  return connection ?? db;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderPaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export type CustomerRow = RowDataPacket & {
  id: number;
  mobile: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  is_active: number;
};

export type CreateCustomerInput = {
  mobile: string;
  password_hash: string;
  first_name: string;
  last_name: string;
};

export type CreateCustomerAddressInput = {
  customer_id: number;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor?: string | null;
  unit?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  is_default?: number;
};

export type CreateOrderInput = {
  order_number: string;
  customer_id: number | null;
  cart_id?: string | null;

  status?: OrderStatus;
  payment_status?: OrderPaymentStatus;

  customer_name: string;
  customer_phone: string;
  customer_landline?: string | null;
  customer_email?: string | null;

  shipping_province: string;

  shipping_city: string;
  shipping_postal_code?: string | null;
  shipping_address: string;
  shipping_plaque?: string | null;
  shipping_floor?: string | null;
  shipping_unit?: string | null;

  subtotal_amount: number;
  discount_amount?: number;
  shipping_amount?: number;
  total_amount: number;

  notes?: string | null;
};

export type CreateOrderItemInput = {
  order_id: number;
  product_id: number;
  variant_id: number;

  product_name: string;
  variant_title?: string | null;
  volume_ml?: number | null;

  quantity: number;
  unit_price: number;
  total_price: number;
};

export type ProductForCheckoutRow = RowDataPacket & {
  id: number;
  name: string;

  variant_id: number;
  volume_ml: number | null;

  price: number | string;
  stock: number;

  is_default: number;
};

export const checkoutRepository = {
  async findCustomerByMobile(
    mobile: string,
    connection?: PoolConnection,
  ): Promise<CustomerRow | null> {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<CustomerRow[]>(
      `
      SELECT
        id,
        mobile,
        first_name,
        last_name,
        password_hash,
        is_active
      FROM customers
      WHERE mobile = ?
      LIMIT 1
      `,
      [mobile],
    );

    return rows[0] ?? null;
  },
  async createCustomer(
    data: CreateCustomerInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      INSERT INTO customers
      (
        mobile,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'USER', 1, NOW(), NOW())
      `,
      [data.mobile, data.password_hash, data.first_name, data.last_name],
    );

    return result.insertId;
  },

  async createCustomerAddress(
    data: CreateCustomerAddressInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      INSERT INTO customer_addresses
      (
        customer_id,
        province,
        city,
        address,
        plaque,
        floor,
        unit,
        postal_code,
        is_default,
        created_at,
        updated_at
      )
      VALUES
      (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        NOW(),
        NOW()
      )
      `,
      [
        data.customer_id,
        data.province,
        data.city,
        data.address,
        data.plaque,
        data.floor ?? null,
        data.unit ?? null,
        data.postal_code,
        data.is_default ?? 1,
      ],
    );

    return result.insertId;
  },

  /**
   * محصول و Variant را داخل Transaction قفل می‌کند تا دو سفارش
   * به‌صورت هم‌زمان نتوانند موجودی یکسانی را مصرف کنند.
   *
   * اگر variantId ارسال نشده باشد، Variant پیش‌فرض انتخاب می‌شود.
   */
  async findProductForCheckout(
    productId: number,
    variantId: number | null,
    connection?: PoolConnection,
  ): Promise<ProductForCheckoutRow | null> {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<ProductForCheckoutRow[]>(
      `
      SELECT
        p.id,
        p.name,

        pv.id AS variant_id,
        pv.volume_ml,

        COALESCE(pv.discount_price, pv.price) AS price,
        pv.stock_qty AS stock,
        pv.is_default

      FROM products p

      INNER JOIN product_variants pv
        ON pv.product_id = p.id

      WHERE p.id = ?
        AND (? IS NULL OR pv.id = ?)

        AND p.deleted_at IS NULL
        AND p.is_active = 1
        AND p.status = 'ACTIVE'

        AND pv.deleted_at IS NULL
        AND pv.is_active = 1
        AND pv.status = 'ACTIVE'

      ORDER BY
        CASE WHEN ? IS NOT NULL AND pv.id = ? THEN 0 ELSE 1 END,
        pv.is_default DESC,
        pv.id ASC

      LIMIT 1
      FOR UPDATE
      `,
      [productId, variantId, variantId, variantId, variantId],
    );

    return rows[0] ?? null;
  },

  async createOrder(
    data: CreateOrderInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      INSERT INTO orders
      (
        order_number,
        customer_id,
        cart_id,

        status,
        payment_status,

        customer_name,
customer_phone,
customer_landline,
customer_email,

shipping_province,
shipping_city,

        shipping_postal_code,
        shipping_address,
        shipping_plaque,
        shipping_floor,
        shipping_unit,

        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,

        notes,
        created_at,
        updated_at
      )
      VALUES
      (
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,

?, ?, ?, ?, ?, ?, ?,

        ?, ?, ?, ?,
        ?,
        NOW(),
        NOW()
      )
      `,
      [
        data.order_number,
        data.customer_id,
        data.cart_id ?? null,

        data.status ?? "PENDING_PAYMENT",
        data.payment_status ?? "UNPAID",

        data.customer_name,
        data.customer_phone,
        data.customer_landline ?? null,
        data.customer_email ?? null,

        data.shipping_province,

        data.shipping_city,
        data.shipping_postal_code ?? null,
        data.shipping_address,
        data.shipping_plaque ?? null,
        data.shipping_floor ?? null,
        data.shipping_unit ?? null,

        data.subtotal_amount,
        data.discount_amount ?? 0,
        data.shipping_amount ?? 0,
        data.total_amount,

        data.notes ?? null,
      ],
    );

    return result.insertId;
  },

  async createOrderItem(
    data: CreateOrderItemInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      INSERT INTO order_items
      (
        order_id,
        product_id,

        variant_id,
        product_variant_id,

        product_name,
        variant_title,
        variant_label,

        volume_ml,

        quantity,
        unit_price,
        total_price,
        line_total,

        created_at
      )
      VALUES
      (
        ?, ?,
        ?, ?,
        ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        NOW()
      )
      `,
      [
        data.order_id,
        data.product_id,

        data.variant_id,
        data.variant_id,

        data.product_name,
        data.variant_title ?? null,
        data.variant_title ?? null,

        data.volume_ml ?? null,

        data.quantity,
        data.unit_price,
        data.total_price,
        data.total_price,
      ],
    );

    return result.insertId;
  },

  /**
   * موجودی دقیق همان Variant انتخاب‌شده را کم می‌کند.
   */
  async decreaseVariantStock(
    variantId: number,
    quantity: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE product_variants
      SET
        stock_qty = stock_qty - ?,
        updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
        AND is_active = 1
        AND status = 'ACTIVE'
        AND stock_qty >= ?
      `,
      [quantity, variantId, quantity],
    );

    return result.affectedRows > 0;
  },

  async findOrderById(orderId: number, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [orderId],
    );

    return rows[0] ?? null;
  },

  async updateOrderPaymentStatus(
    orderId: number,
    paymentStatus: OrderPaymentStatus,
    status?: OrderStatus,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET
        payment_status = ?,
        status = COALESCE(?, status),
        paid_at = CASE
          WHEN ? = 'PAID' THEN COALESCE(paid_at, NOW())
          ELSE paid_at
        END,
        updated_at = NOW()
      WHERE id = ?
      `,
      [paymentStatus, status ?? null, paymentStatus, orderId],
    );

    return result.affectedRows > 0;
  },

    async updateOrderPaymentIntent(
    orderId: number,
    paymentIntentId: string | null,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET
        payment_intent_id = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [paymentIntentId, orderId],
    );

    return result.affectedRows > 0;
  },

  async attachGuestOrdersToCustomerByMobile(
    customerId: number,
    mobile: string,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET
        customer_id = ?,
        updated_at = NOW()
      WHERE customer_id IS NULL
        AND customer_phone = ?
      `,
      [customerId, mobile],
    );

    return result.affectedRows;
  },
};

