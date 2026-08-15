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

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type CreatePaymentInput = {
  order_id: number;
  provider: string;
  amount: number;
  authority?: string | null;
  ref_id?: string | null;
  status?: PaymentStatus;
  transaction_id?: string | null;
  payment_intent_id?: string | null;
  payload?: unknown;
  raw_response?: unknown;
  paid_at?: string | null;
};

export const paymentRepository = {
  async create(data: CreatePaymentInput, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      INSERT INTO payments
      (
        order_id,
        provider,
        authority,
        ref_id,
        transaction_id,
        payment_intent_id,
        amount,
        status,
        payload,
        raw_response,
        paid_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        data.order_id,
        data.provider,
        data.authority ?? null,
        data.ref_id ?? null,
        data.transaction_id ?? null,
        data.payment_intent_id ?? null,
        data.amount,
        data.status ?? "PENDING",
        data.payload !== undefined ? JSON.stringify(data.payload) : null,
        data.raw_response !== undefined ? JSON.stringify(data.raw_response) : null,
        data.paid_at ?? null,
      ],
    );

    return result.insertId;
  },

  async findById(id: number, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM payments
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  },

  async findByOrderId(orderId: number, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM payments
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [orderId],
    );

    return rows[0] ?? null;
  },

  async findByAuthority(authority: string, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM payments
      WHERE authority = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [authority],
    );

    return rows[0] ?? null;
  },

  async findByPaymentIntentId(
    paymentIntentId: string,
    connection?: PoolConnection,
  ) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM payments
      WHERE payment_intent_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [paymentIntentId],
    );

    return rows[0] ?? null;
  },

  async updateStatus(
    id: number,
    data: {
      status: PaymentStatus;
      authority?: string | null;
      ref_id?: string | null;
      transaction_id?: string | null;
      payload?: unknown;
      raw_response?: unknown;
      paid_at?: string | null;
    },
    connection?: PoolConnection,
  ) {
    const executor = getExecutor(connection);

    const existing = await this.findById(id, connection);
    if (!existing) return false;

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE payments
      SET status = ?,
          authority = ?,
          ref_id = ?,
          transaction_id = ?,
          payload = ?,
          raw_response = ?,
          paid_at = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [
        data.status,
        data.authority ?? existing.authority ?? null,
        data.ref_id ?? existing.ref_id ?? null,
        data.transaction_id ?? existing.transaction_id ?? null,
        data.payload !== undefined
          ? JSON.stringify(data.payload)
          : (existing.payload ?? null),
        data.raw_response !== undefined
          ? JSON.stringify(data.raw_response)
          : (existing.raw_response ?? null),
        data.paid_at ?? existing.paid_at ?? null,
        id,
      ],
    );

    return result.affectedRows > 0;
  },
};
