import { db } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

type CreateCustomerInput = {
  first_name: string;
  last_name: string;
  mobile: string;
  password_hash: string;
};

type CreateCustomerAddressInput = {
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

type UpdateCustomerProfileInput = {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
};

type UpsertCustomerAddressInput = {
  customer_id: number;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor?: string | null;
  unit?: string | null;
  postal_code?: string | null;
  phone?: string | null;
};

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

export const customerRepository = {
  isDuplicateEntryError,

  async findByMobile(mobile: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, mobile, password_hash, role, is_active, last_login_at
       FROM customers
       WHERE mobile = ?
       LIMIT 1`,
      [mobile.trim()],
    );

    return rows[0] || null;
  },

  async findById(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, mobile, role, is_active, last_login_at, created_at, updated_at
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] || null;
  },

  async findByIdWithPassword(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, mobile, password_hash, role, is_active
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] || null;
  },

  async create(data: CreateCustomerInput) {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO customers (
         first_name,
         last_name,
         mobile,
         password_hash,
         role,
         is_active
       ) VALUES (?, ?, ?, ?, 'USER', 1)`,
      [
        data.first_name.trim(),
        data.last_name.trim(),
        data.mobile.trim(),
        data.password_hash,
      ],
    );

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, mobile, role, is_active
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [result.insertId],
    );

    return rows[0];
  },

  async createAddress(data: CreateCustomerAddressInput) {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO customer_addresses (
         customer_id,
         province,
         city,
         address,
         plaque,
         floor,
         unit,
         postal_code,
         phone,
         is_default
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_id,
        data.province.trim(),
        data.city.trim(),
        data.address.trim(),
        data.plaque.trim(),
        data.floor?.trim() || null,
        data.unit?.trim() || null,
        data.postal_code?.trim() || null,
        data.phone?.trim() || null,
        data.is_default ?? 1,
      ],
    );

    return result.insertId;
  },

  async createWithDefaultAddress(
    customerData: CreateCustomerInput,
    addressData: Omit<CreateCustomerAddressInput, "customer_id">,
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [customerResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO customers (
           first_name,
           last_name,
           mobile,
           password_hash,
           role,
           is_active
         ) VALUES (?, ?, ?, ?, 'USER', 1)`,
        [
          customerData.first_name.trim(),
          customerData.last_name.trim(),
          customerData.mobile.trim(),
          customerData.password_hash,
        ],
      );

      const customerId = customerResult.insertId;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO customer_addresses (
           customer_id,
           province,
           city,
           address,
           plaque,
           floor,
           unit,
           postal_code,
           phone,
           is_default
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          addressData.province.trim(),
          addressData.city.trim(),
          addressData.address.trim(),
          addressData.plaque.trim(),
          addressData.floor?.trim() || null,
          addressData.unit?.trim() || null,
          addressData.postal_code?.trim() || null,
          addressData.phone?.trim() || null,
          addressData.is_default ?? 1,
        ],
      );

      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, mobile, role, is_active
         FROM customers
         WHERE id = ?
         LIMIT 1`,
        [customerId],
      );

      await connection.commit();

      return rows[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateLastLoginAt(id: number) {
    await db.execute(
      `UPDATE customers
       SET last_login_at = NOW()
       WHERE id = ?`,
      [id],
    );
  },

  async getDefaultAddress(customerId: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, customer_id, province, city, address, plaque, floor, unit, postal_code, phone, is_default
       FROM customer_addresses
       WHERE customer_id = ?
       ORDER BY is_default DESC, id ASC
       LIMIT 1`,
      [customerId],
    );

    return rows[0] || null;
  },

  async updateProfile(data: UpdateCustomerProfileInput) {
    await db.execute(
      `UPDATE customers
       SET first_name = ?, last_name = ?, mobile = ?
       WHERE id = ?`,
      [
        data.first_name.trim(),
        data.last_name.trim(),
        data.mobile.trim(),
        data.id,
      ],
    );
  },

  async upsertDefaultAddress(data: UpsertCustomerAddressInput) {
    const currentAddress = await this.getDefaultAddress(data.customer_id);

    if (currentAddress) {
      await db.execute(
        `UPDATE customer_addresses
         SET province = ?,
             city = ?,
             address = ?,
             plaque = ?,
             floor = ?,
             unit = ?,
             postal_code = ?,
             phone = ?,
             is_default = 1
         WHERE id = ?
         LIMIT 1`,
        [
          data.province.trim(),
          data.city.trim(),
          data.address.trim(),
          data.plaque.trim(),
          data.floor?.trim() || null,
          data.unit?.trim() || null,
          data.postal_code?.trim() || null,
          data.phone?.trim() || null,
          currentAddress.id,
        ],
      );

      return currentAddress.id;
    }

    return this.createAddress({
      customer_id: data.customer_id,
      province: data.province,
      city: data.city,
      address: data.address,
      plaque: data.plaque,
      floor: data.floor || null,
      unit: data.unit || null,
      postal_code: data.postal_code || null,
      phone: data.phone || null,
      is_default: 1,
    });
  },

  async updatePassword(id: number, passwordHash: string) {
    await db.execute(
      `UPDATE customers
       SET password_hash = ?
       WHERE id = ?`,
      [passwordHash, id],
    );
  },

  async attachGuestOrdersByMobile(customerId: number, mobile: string) {
    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET
        customer_id = ?,
        updated_at = NOW()
      WHERE customer_id IS NULL
        AND customer_phone = ?
      `,
      [customerId, mobile.trim()],
    );

    return result.affectedRows;
  },
};
