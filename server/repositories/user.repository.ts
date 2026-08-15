import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const userRepository = {
  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, full_name, email, role, password_hash, status, is_active
       FROM users
       WHERE email = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [normalizedEmail],
    );

    return rows[0] || null;
  },

  async create(data: {
    full_name: string;
    email: string;
    password_hash: string;
  }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [data.full_name.trim(), normalizedEmail, data.password_hash],
    );

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [result.insertId],
    );

    return rows[0];
  },

  async findById(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, full_name, email, role, status, is_active
       FROM users
       WHERE id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
      [id],
    );

    return rows[0] || null;
  },

  async updateLastLoginAt(id: number) {
    await db.execute(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
  },
};
