import { db } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const brandRepository = {
  async findAll() {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
          id,
          name,
          slug,
          description,
          logo_url,
          country,
          is_active,
          created_at,
          updated_at
       FROM brands
       WHERE deleted_at IS NULL
       ORDER BY id DESC`,
    );

    return rows;
  },

  async findById(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
          id,
          name,
          slug,
          description,
          logo_url,
          country,
          is_active,
          created_at,
          updated_at
       FROM brands
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [id],
    );

    return rows[0] || null;
  },

  async findByName(name: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name
       FROM brands
       WHERE name = ? AND deleted_at IS NULL
       LIMIT 1`,
      [name],
    );

    return rows[0] || null;
  },

  async findBySlug(slug: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, slug
       FROM brands
       WHERE slug = ? AND deleted_at IS NULL
       LIMIT 1`,
      [slug],
    );

    return rows[0] || null;
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    country?: string | null;
    is_active?: 0 | 1;
  }) {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO brands (name, slug, description, logo_url, country, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.logo_url ?? null,
        data.country ?? null,
        data.is_active ?? 1,
      ],
    );

    return result.insertId;
  },

  async update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      logo_url?: string | null;
      country?: string | null;
      is_active?: 0 | 1;
    },
  ) {
    const fields: string[] = [];
    const values: Array<string | number | boolean | null> = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }

    if (data.slug !== undefined) {
      fields.push("slug = ?");
      values.push(data.slug);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }

    if (data.logo_url !== undefined) {
      fields.push("logo_url = ?");
      values.push(data.logo_url);
    }

    if (data.country !== undefined) {
      fields.push("country = ?");
      values.push(data.country);
    }

    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id);

    await db.execute(
      `UPDATE brands
       SET ${fields.join(", ")}
       WHERE id = ? AND deleted_at IS NULL`,
      values,
    );

    return true;
  },

  async softDelete(id: number) {
    await db.execute(
      `UPDATE brands
       SET deleted_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    return true;
  },
};
