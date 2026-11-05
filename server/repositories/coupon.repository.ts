import { db } from "@/lib/db";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type CouponStatus = "ACTIVE" | "INACTIVE";
export type CouponDiscountType = "PERCENT" | "FIXED";

export interface CouponRow {
  id: number;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: Date | null;
  expires_at: Date | null;
  status: CouponStatus;
  created_at: Date;
  updated_at: Date;
}

type DbExecutor = Pool | PoolConnection;

function getExecutor(connection?: PoolConnection): DbExecutor {
  return connection ?? db;
}

function mapCoupon(row: RowDataPacket): CouponRow {
  return {
    id: Number(row.id),
    code: String(row.code),
    description: row.description !== null ? String(row.description) : null,
    discount_type: row.discount_type as CouponDiscountType,
    discount_value: Number(row.discount_value),
    min_order_amount: Number(row.min_order_amount),
    max_discount_amount:
      row.max_discount_amount !== null ? Number(row.max_discount_amount) : null,
    usage_limit: row.usage_limit !== null ? Number(row.usage_limit) : null,
    used_count: Number(row.used_count),
    starts_at: row.starts_at ? new Date(row.starts_at) : null,
    expires_at: row.expires_at ? new Date(row.expires_at) : null,
    status: row.status as CouponStatus,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export interface CreateCouponInput {
  code: string;
  description?: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  status: CouponStatus;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string | null;
  discount_type?: CouponDiscountType;
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  status?: CouponStatus;
}

export const couponRepository = {
  async findAll(connection?: PoolConnection): Promise<CouponRow[]> {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `SELECT *
       FROM coupons
       ORDER BY id DESC`,
    );

    return rows.map(mapCoupon);
  },

  async findById(
    id: number,
    connection?: PoolConnection,
  ): Promise<CouponRow | null> {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `SELECT *
       FROM coupons
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;
    return mapCoupon(rows[0]);
  },

  async findByCode(
    code: string,
    connection?: PoolConnection,
  ): Promise<CouponRow | null> {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `SELECT *
       FROM coupons
       WHERE code = ?
       LIMIT 1`,
      [code],
    );

    if (rows.length === 0) return null;
    return mapCoupon(rows[0]);
  },

  async create(
    input: CreateCouponInput,
    connection?: PoolConnection,
  ): Promise<number> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `INSERT INTO coupons (
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        used_count,
        starts_at,
        expires_at,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW(), NOW())`,
      [
        input.code,
        input.description ?? null,
        input.discount_type,
        input.discount_value,
        input.min_order_amount ?? 0,
        input.max_discount_amount ?? null,
        input.usage_limit ?? null,
        input.starts_at ?? null,
        input.expires_at ?? null,
        input.status,
      ],
    );

    return result.insertId;
  },

  async updateById(
    id: number,
    input: UpdateCouponInput,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = getExecutor(connection);

    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    if (input.code !== undefined) {
      fields.push("code = ?");
      values.push(input.code);
    }

    if (input.description !== undefined) {
      fields.push("description = ?");
      values.push(input.description);
    }

    if (input.discount_type !== undefined) {
      fields.push("discount_type = ?");
      values.push(input.discount_type);
    }

    if (input.discount_value !== undefined) {
      fields.push("discount_value = ?");
      values.push(input.discount_value);
    }

    if (input.min_order_amount !== undefined) {
      fields.push("min_order_amount = ?");
      values.push(input.min_order_amount);
    }

    if (input.max_discount_amount !== undefined) {
      fields.push("max_discount_amount = ?");
      values.push(input.max_discount_amount);
    }

    if (input.usage_limit !== undefined) {
      fields.push("usage_limit = ?");
      values.push(input.usage_limit);
    }

    if (input.starts_at !== undefined) {
      fields.push("starts_at = ?");
      values.push(input.starts_at);
    }

    if (input.expires_at !== undefined) {
      fields.push("expires_at = ?");
      values.push(input.expires_at);
    }

    if (input.status !== undefined) {
      fields.push("status = ?");
      values.push(input.status);
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const [result] = await executor.execute<ResultSetHeader>(
      `UPDATE coupons
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  },

  async deleteById(id: number, connection?: PoolConnection): Promise<boolean> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `DELETE FROM coupons WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  },

  async incrementUsedCount(
    id: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `UPDATE coupons
       SET used_count = used_count + 1,
           updated_at = NOW()
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  },
};
