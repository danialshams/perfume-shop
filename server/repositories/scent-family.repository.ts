import { db } from "@/lib/db";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export type ScentFamilyCreateInput = {
  name: string;
  slug: string;
  image_url: string;
  is_active?: boolean;
  sort_order?: number;
};

export type ScentFamilyUpdateInput = Partial<ScentFamilyCreateInput>;

export type ScentFamilyFilters = {
  is_active?: number;
  search?: string;
};

function mapScentFamily(row: RowDataPacket) {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    image_url: row.image_url ?? null,
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listScentFamilies(
  filters: ScentFamilyFilters = {},
) {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.is_active !== undefined) {
    where.push("sf.is_active = ?");
    values.push(filters.is_active);
  }

  if (filters.search?.trim()) {
    where.push("(sf.name LIKE ? OR sf.slug LIKE ?)");
    const keyword = `%${filters.search.trim()}%`;
    values.push(keyword, keyword);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      sf.id,
      sf.name,
      sf.slug,
      sf.image_url,
      sf.is_active,
      sf.sort_order,
      sf.created_at,
      sf.updated_at,

      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.scent_family_id = sf.id
          AND p.deleted_at IS NULL
      ) AS products_count
    FROM scent_families sf
    ${whereSql}
    ORDER BY sf.sort_order ASC, sf.name ASC
    `,
    values,
  );

  return rows.map((row) => ({
    ...mapScentFamily(row),
    products_count: Number(row.products_count ?? 0),
  }));
}

export async function findScentFamilyById(id: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      id,
      name,
      slug,
      image_url,
      is_active,
      sort_order,
      created_at,
      updated_at
    FROM scent_families
    WHERE id = ?
    LIMIT 1
    `,
    [id],
  );

  return rows.length ? mapScentFamily(rows[0]) : null;
}

export async function createScentFamily(data: ScentFamilyCreateInput) {
  const [result] = await db.query<ResultSetHeader>(
    `
    INSERT INTO scent_families
    (
      name,
      slug,
      image_url,
      is_active,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      data.name,
      data.slug,
      data.image_url,
      data.is_active === undefined ? 1 : data.is_active ? 1 : 0,
      data.sort_order ?? 0,
    ],
  );

  return Number(result.insertId);
}

export async function updateScentFamily(
  id: number,
  data: ScentFamilyUpdateInput,
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }

  if (data.slug !== undefined) {
    fields.push("slug = ?");
    values.push(data.slug);
  }

  if (data.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(data.image_url);
  }

  if (data.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(data.is_active ? 1 : 0);
  }

  if (data.sort_order !== undefined) {
    fields.push("sort_order = ?");
    values.push(data.sort_order);
  }

  if (!fields.length) {
    return findScentFamilyById(id);
  }

  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE scent_families
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    [...values, id],
  );

  if (!result.affectedRows) return null;

  return findScentFamilyById(id);
}

/**
 * این تابع فقط برای استفاده داخل Transaction محصول است.
 *
 * اگر نام گروه قبلاً وجود داشته باشد، همان گروه را برمی‌گرداند.
 * اگر وجود نداشته باشد، گروه جدید را می‌سازد.
 */
export async function findOrCreateScentFamilyInTransaction(
  connection: PoolConnection,
  data: {
    name: string;
    slug: string;
    image_url: string;
  },
) {
  const [existingRows] = await connection.query<RowDataPacket[]>(
    `
    SELECT id
    FROM scent_families
    WHERE name = ?
    LIMIT 1
    `,
    [data.name],
  );

  if (existingRows.length) {
    return Number(existingRows[0].id);
  }

  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO scent_families
    (
      name,
      slug,
      image_url,
      is_active,
      sort_order
    )
    VALUES (?, ?, ?, 1, 0)
    `,
    [data.name, data.slug, data.image_url],
  );

  return Number(result.insertId);
}

export async function deleteScentFamily(id: number) {
  const [result] = await db.query<ResultSetHeader>(
    `
    DELETE FROM scent_families
    WHERE id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM products p
        WHERE p.scent_family_id = scent_families.id
      )
    `,
    [id],
  );

  return result.affectedRows > 0;
}
