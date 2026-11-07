import { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";

type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  parent_ids: string | null;
  parent_names: string | null;
  children_count: number;
  has_children: number;
};

type SimpleIdRow = RowDataPacket & {
  id: number;
};

type ParentLinkRow = RowDataPacket & {
  parent_id: number;
};

async function getAllAncestorIds(
  categoryId: number,
  visited = new Set<number>(),
): Promise<Set<number>> {
  const stack = [categoryId];
  const ancestors = new Set<number>();

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const [rows] = await db.query<ParentLinkRow[]>(
      `
      SELECT parent_id
      FROM category_parents
      WHERE category_id = ?
      `,
      [currentId],
    );

    for (const row of rows) {
      const parentId = Number(row.parent_id);

      if (!ancestors.has(parentId)) {
        ancestors.add(parentId);
        stack.push(parentId);
      }
    }
  }

  return ancestors;
}

function mapCategoryRow(row: CategoryRow) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    image_url: row.image_url,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    parent_ids: row.parent_ids
      ? row.parent_ids
          .split(",")
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [],
    parent_names: row.parent_names
      ? row.parent_names
          .split("|||")
          .map((name) => name.trim())
          .filter(Boolean)
      : [],
    children_count: Number(row.children_count ?? 0),
    has_children: Number(row.children_count ?? 0) > 0,
  };
}

export const categoryRepository = {
  async findAll() {
    const [rows] = await db.query<CategoryRow[]>(
      `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at,
      STRING_AGG(DISTINCT CAST(p.id AS TEXT), ',' ORDER BY CAST(p.id AS TEXT)) AS parent_ids,
      STRING_AGG(DISTINCT p.name, '|||' ORDER BY p.name) AS parent_names,
      COUNT(DISTINCT child.id) AS children_count,
      CASE WHEN COUNT(DISTINCT child.id) > 0 THEN 1 ELSE 0 END AS has_children
    FROM categories c
    LEFT JOIN category_parents cp_parent
      ON cp_parent.category_id = c.id
    LEFT JOIN categories p
      ON p.id = cp_parent.parent_id
      AND p.deleted_at IS NULL
    LEFT JOIN category_parents cp_child
      ON cp_child.parent_id = c.id
    LEFT JOIN categories child
      ON child.id = cp_child.category_id
      AND child.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    GROUP BY
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at
    ORDER BY c.created_at DESC
    `,
    );

    return rows.map(mapCategoryRow);
  },

  async findRoots() {
    const [rows] = await db.query<CategoryRow[]>(
      `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at,
      NULL AS parent_ids,
      NULL AS parent_names,
      COUNT(DISTINCT child.id) AS children_count,
      CASE WHEN COUNT(DISTINCT child.id) > 0 THEN 1 ELSE 0 END AS has_children
    FROM categories c
    LEFT JOIN category_parents cp_check
      ON cp_check.category_id = c.id
    LEFT JOIN category_parents cp_child
      ON cp_child.parent_id = c.id
    LEFT JOIN categories child
      ON child.id = cp_child.category_id
      AND child.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
      AND cp_check.category_id IS NULL
    GROUP BY
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at
    ORDER BY c.name ASC
    `,
    );

    return rows.map(mapCategoryRow);
  },

  async findChildrenByParentId(parentId: number) {
    const [rows] = await db.query<CategoryRow[]>(
      `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at,
      STRING_AGG(DISTINCT CAST(p.id AS TEXT), ',' ORDER BY CAST(p.id AS TEXT)) AS parent_ids,
      STRING_AGG(DISTINCT p.name, '|||' ORDER BY p.name) AS parent_names,
      COUNT(DISTINCT child.id) AS children_count,
      CASE WHEN COUNT(DISTINCT child.id) > 0 THEN 1 ELSE 0 END AS has_children
    FROM category_parents cp_target
    INNER JOIN categories c
      ON c.id = cp_target.category_id
      AND c.deleted_at IS NULL
    LEFT JOIN category_parents cp_parent
      ON cp_parent.category_id = c.id
    LEFT JOIN categories p
      ON p.id = cp_parent.parent_id
      AND p.deleted_at IS NULL
    LEFT JOIN category_parents cp_child
      ON cp_child.parent_id = c.id
    LEFT JOIN categories child
      ON child.id = cp_child.category_id
      AND child.deleted_at IS NULL
    WHERE cp_target.parent_id = ?
    GROUP BY
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at
    ORDER BY c.name ASC
    `,
      [parentId],
    );

    return rows.map(mapCategoryRow);
  },

  async findById(id: number) {
    const [rows] = await db.query<CategoryRow[]>(
      `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at,
      STRING_AGG(DISTINCT CAST(p.id AS TEXT), ',' ORDER BY CAST(p.id AS TEXT)) AS parent_ids,
      STRING_AGG(DISTINCT p.name, '|||' ORDER BY p.name) AS parent_names,
      COUNT(DISTINCT child.id) AS children_count,
      CASE WHEN COUNT(DISTINCT child.id) > 0 THEN 1 ELSE 0 END AS has_children
    FROM categories c
    LEFT JOIN category_parents cp_parent
      ON cp_parent.category_id = c.id
    LEFT JOIN categories p
      ON p.id = cp_parent.parent_id
      AND p.deleted_at IS NULL
    LEFT JOIN category_parents cp_child
      ON cp_child.parent_id = c.id
    LEFT JOIN categories child
      ON child.id = cp_child.category_id
      AND child.deleted_at IS NULL
    WHERE c.id = ?
      AND c.deleted_at IS NULL
    GROUP BY
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.is_active,
      c.created_at,
      c.updated_at,
      c.deleted_at
    LIMIT 1
    `,
      [id],
    );

    if (!rows.length) return null;

    return mapCategoryRow(rows[0]);
  },

  async findBySlug(slug: string) {
    const [rows] = await db.query<CategoryRow[]>(
      `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        NULL AS parent_ids,
        NULL AS parent_names,
        0 AS children_count,
        0 AS has_children
      FROM categories c
      WHERE c.slug = ?
        AND c.deleted_at IS NULL
      LIMIT 1
      `,
      [slug],
    );

    if (!rows.length) return null;

    return mapCategoryRow(rows[0]);
  },

  async findBySlugIncludingDeleted(slug: string) {
    const [rows] = await db.query<CategoryRow[]>(
      `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        NULL AS parent_ids,
        NULL AS parent_names,
        0 AS children_count,
        0 AS has_children
      FROM categories c
      WHERE c.slug = ?
      LIMIT 1
      `,
      [slug],
    );

    if (!rows.length) return null;

    return mapCategoryRow(rows[0]);
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    is_active?: boolean | number;
  }) {
    const [result] = await db.query<ResultSetHeader>(
      `
    INSERT INTO categories (
      name,
      slug,
      description,
      image_url,
      is_active,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.image_url ?? null,
        data.is_active === undefined ? 1 : data.is_active ? 1 : 0,
      ],
    );

    return Number(result.insertId);
  },

  async update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      image_url?: string | null;
      is_active?: boolean | number;
    },
  ) {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      params.push(data.name);
    }

    if (data.slug !== undefined) {
      fields.push("slug = ?");
      params.push(data.slug);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      params.push(data.description ?? null);
    }

    if (data.image_url !== undefined) {
      fields.push("image_url = ?");
      params.push(data.image_url ?? null);
    }

    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(data.is_active ? 1 : 0);
    }

    if (!fields.length) return;

    fields.push("updated_at = NOW()");

    await db.query(
      `
    UPDATE categories
    SET ${fields.join(", ")}
    WHERE id = ?
      AND deleted_at IS NULL
    `,
      [...params, id],
    );
  },

  async softDelete(id: number) {
    await db.query(
      `
      UPDATE categories
      SET deleted_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [id],
    );
  },

  async setParents(categoryId: number, parentIds: number[]) {
    const normalizedParentIds = [...new Set(parentIds.map(Number))].filter(
      (id) =>
        Number.isInteger(id) && id > 0 && Number(id) !== Number(categoryId),
    );

    await db.query(
      `
    DELETE FROM category_parents
    WHERE category_id = ?
    `,
      [categoryId],
    );

    if (!normalizedParentIds.length) return;

    const values = normalizedParentIds.map(() => "(?, ?)").join(", ");
    const params = normalizedParentIds.flatMap((parentId) => [
      categoryId,
      parentId,
    ]);

    await db.query(
      `
    INSERT INTO category_parents (category_id, parent_id)
    VALUES ${values}
    ON CONFLICT (category_id, parent_id) DO NOTHING
    `,
      params,
    );
  },
  async removeRelations(id: number) {
    await db.query(
      `
    DELETE FROM category_parents
    WHERE category_id = ?
       OR parent_id = ?
    `,
      [id, id],
    );
  },

  async existsByIds(ids: number[]) {
    if (!ids.length) return true;

    const placeholders = ids.map(() => "?").join(", ");

    const [rows] = await db.query<SimpleIdRow[]>(
      `
      SELECT id
      FROM categories
      WHERE id IN (${placeholders})
        AND deleted_at IS NULL
      `,
      ids,
    );

    return rows.length === ids.length;
  },

  async findInvalidIds(ids: number[]) {
    if (!ids.length) return [];

    const placeholders = ids.map(() => "?").join(", ");

    const [rows] = await db.query<SimpleIdRow[]>(
      `
      SELECT id
      FROM categories
      WHERE id IN (${placeholders})
        AND deleted_at IS NULL
      `,
      ids,
    );

    const validIds = new Set(rows.map((row) => Number(row.id)));

    return ids.filter((id) => !validIds.has(id));
  },

  async hasChildren(id: number) {
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT 1
      FROM category_parents cp
      INNER JOIN categories child
        ON child.id = cp.category_id
        AND child.deleted_at IS NULL
      WHERE cp.parent_id = ?
      LIMIT 1
      `,
      [id],
    );

    return rows.length > 0;
  },

  async findIdsThatHaveChildren(ids: number[]) {
    if (!ids.length) return [];

    const placeholders = ids.map(() => "?").join(", ");

    const [rows] = await db.query<SimpleIdRow[]>(
      `
      SELECT DISTINCT cp.parent_id AS id
      FROM category_parents cp
      INNER JOIN categories child
        ON child.id = cp.category_id
        AND child.deleted_at IS NULL
      WHERE cp.parent_id IN (${placeholders})
      `,
      ids,
    );

    return rows.map((row) => Number(row.id));
  },

  async wouldCreateCycle(categoryId: number, parentIds: number[]) {
    if (!parentIds.length) return false;

    if (parentIds.includes(categoryId)) {
      return true;
    }

    for (const parentId of parentIds) {
      const ancestors = await getAllAncestorIds(parentId);

      if (ancestors.has(categoryId)) {
        return true;
      }
    }

    return false;
  },
};
