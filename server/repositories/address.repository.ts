import { db } from "@/lib/db";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@/server/validations/address.validation";

export type AddressEntity = {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  postal_code: string | null;
  plaque: string | null;
  unit: string | null;
  country: string | null;
  is_default: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
};

type DbExecutor = typeof db | PoolConnection;

function mapAddressRow(row: RowDataPacket): AddressEntity {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    full_name: String(row.full_name),
    phone: String(row.phone),
    province: String(row.province),
    city: String(row.city),
    address_line: String(row.address_line),
    postal_code: row.postal_code ?? null,
    plaque: row.plaque ?? null,
    unit: row.unit ?? null,
    country: row.country ?? null,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class AddressRepository {
  async findByUserId(userId: number, connection?: PoolConnection): Promise<AddressEntity[]> {
    const executor: DbExecutor = connection ?? db;

    const [rows] = await executor.query<RowDataPacket[]>(
      `
        SELECT
          id,
          user_id,
          full_name,
          phone,
          province,
          city,
          address_line,
          postal_code,
          plaque,
          unit,
          country,
          is_default,
          created_at,
          updated_at
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, id DESC
      `,
      [userId]
    );

    return rows.map(mapAddressRow);
  }

  async findById(id: number, connection?: PoolConnection): Promise<AddressEntity | null> {
    const executor: DbExecutor = connection ?? db;

    const [rows] = await executor.query<RowDataPacket[]>(
      `
        SELECT
          id,
          user_id,
          full_name,
          phone,
          province,
          city,
          address_line,
          postal_code,
          plaque,
          unit,
          country,
          is_default,
          created_at,
          updated_at
        FROM user_addresses
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return null;
    return mapAddressRow(rows[0]);
  }

  async findByIdForUser(
    id: number,
    userId: number,
    connection?: PoolConnection
  ): Promise<AddressEntity | null> {
    const executor: DbExecutor = connection ?? db;

    const [rows] = await executor.query<RowDataPacket[]>(
      `
        SELECT
          id,
          user_id,
          full_name,
          phone,
          province,
          city,
          address_line,
          postal_code,
          plaque,
          unit,
          country,
          is_default,
          created_at,
          updated_at
        FROM user_addresses
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [id, userId]
    );

    if (!rows.length) return null;
    return mapAddressRow(rows[0]);
  }

  async unsetDefaultForUser(userId: number, connection?: PoolConnection): Promise<void> {
    const executor: DbExecutor = connection ?? db;

    await executor.query(
      `
        UPDATE user_addresses
        SET is_default = 0
        WHERE user_id = ?
      `,
      [userId]
    );
  }

  async create(
    userId: number,
    data: CreateAddressInput,
    connection?: PoolConnection
  ): Promise<AddressEntity> {
    const executor: DbExecutor = connection ?? db;

    const [result] = await executor.query<ResultSetHeader>(
      `
        INSERT INTO user_addresses (
          user_id,
          full_name,
          phone,
          province,
          city,
          address_line,
          postal_code,
          plaque,
          unit,
          country,
          is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        data.full_name,
        data.phone,
        data.province,
        data.city,
        data.address_line,
        data.postal_code ?? null,
        data.plaque ?? null,
        data.unit ?? null,
        data.country ?? "Iran",
        data.is_default ? 1 : 0,
      ]
    );

    const created = await this.findById(Number(result.insertId), connection);
    if (!created) {
      throw new Error("Address was created but could not be fetched");
    }

    return created;
  }

  async update(
    id: number,
    userId: number,
    data: UpdateAddressInput,
    connection?: PoolConnection
  ): Promise<AddressEntity | null> {
    const executor: DbExecutor = connection ?? db;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.full_name !== undefined) {
      fields.push("full_name = ?");
      values.push(data.full_name);
    }

    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }

    if (data.province !== undefined) {
      fields.push("province = ?");
      values.push(data.province);
    }

    if (data.city !== undefined) {
      fields.push("city = ?");
      values.push(data.city);
    }

    if (data.address_line !== undefined) {
      fields.push("address_line = ?");
      values.push(data.address_line);
    }

    if (data.postal_code !== undefined) {
      fields.push("postal_code = ?");
      values.push(data.postal_code);
    }

    if (data.plaque !== undefined) {
      fields.push("plaque = ?");
      values.push(data.plaque);
    }

    if (data.unit !== undefined) {
      fields.push("unit = ?");
      values.push(data.unit);
    }

    if (data.country !== undefined) {
      fields.push("country = ?");
      values.push(data.country);
    }

    if (data.is_default !== undefined) {
      fields.push("is_default = ?");
      values.push(data.is_default ? 1 : 0);
    }

    if (!fields.length) {
      return this.findByIdForUser(id, userId, connection);
    }

    values.push(id, userId);

    const [result] = await executor.query<ResultSetHeader>(
      `
        UPDATE user_addresses
        SET ${fields.join(", ")}
        WHERE id = ? AND user_id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findByIdForUser(id, userId, connection);
  }

  async delete(id: number, userId: number, connection?: PoolConnection): Promise<boolean> {
    const executor: DbExecutor = connection ?? db;

    const [result] = await executor.query<ResultSetHeader>(
      `
        DELETE FROM user_addresses
        WHERE id = ? AND user_id = ?
      `,
      [id, userId]
    );

    return result.affectedRows > 0;
  }
}

export const addressRepository = new AddressRepository();
