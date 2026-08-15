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

export const productVariantRepository = {
  async findById(id: number, connection?: PoolConnection) {
    const executor = getExecutor(connection);

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM product_variants
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows.length > 0 ? rows[0] : null;
  },

  async findManyByIds(ids: number[], connection?: PoolConnection) {
    if (!ids.length) return [];

    const executor = getExecutor(connection);
    const placeholders = ids.map(() => "?").join(",");

    const [rows] = await executor.execute<RowDataPacket[]>(
      `
      SELECT *
      FROM product_variants
      WHERE id IN (${placeholders})
      `,
      ids,
    );

    return rows;
  },

  async reserveStock(
    id: number,
    quantity: number,
    connection?: PoolConnection,
  ) {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE product_variants
      SET reserved_stock_qty = reserved_stock_qty + ?,
          updated_at = NOW()
      WHERE id = ?
        AND is_active = 1
        AND (stock_qty - reserved_stock_qty) >= ?
      `,
      [quantity, id, quantity],
    );

    return result.affectedRows > 0;
  },

  async commitReservedStock(
    id: number,
    quantity: number,
    connection?: PoolConnection,
  ) {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE product_variants
      SET stock_qty = stock_qty - ?,
          reserved_stock_qty = reserved_stock_qty - ?,
          updated_at = NOW()
      WHERE id = ?
        AND reserved_stock_qty >= ?
        AND stock_qty >= ?
      `,
      [quantity, quantity, id, quantity, quantity],
    );

    return result.affectedRows > 0;
  },

  async releaseReservedStock(
    id: number,
    quantity: number,
    connection?: PoolConnection,
  ) {
    const executor = getExecutor(connection);

    const [result] = await executor.execute<ResultSetHeader>(
      `
      UPDATE product_variants
      SET reserved_stock_qty = reserved_stock_qty - ?,
          updated_at = NOW()
      WHERE id = ?
        AND reserved_stock_qty >= ?
      `,
      [quantity, id, quantity],
    );

    return result.affectedRows > 0;
  },
};
