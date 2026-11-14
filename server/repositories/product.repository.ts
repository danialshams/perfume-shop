import { db } from "@/lib/db";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { findOrCreateScentFamilyInTransaction } from "./scent-family.repository";

export type ProductType = "SINGLE" | "GROUPED";

export type ProductCategoryLink = {
  parent_id: number;
  child_id: number;
};

export type ProductImageCreateInput = {
  image_url: string;
  is_main?: boolean;
};

export type ProductVariantImageCreateInput = {
  image_url: string;
  is_main?: boolean;
};

export type ProductVariantCreateInput = {
  volume_ml?: number | null;
  price: number;
  discount_price?: number | null;
  stock_qty: number;
  is_active?: boolean;
  images?: ProductVariantImageCreateInput[];
};

export type NewScentFamilyInput = {
  name: string;
  image_url: string;
};

export type ProductCreateInput = {
  type: ProductType;
  name: string;
  slug: string;
  description?: string | null;
  voice_file?: string | null;

  category_id?: number | null;
  parent_category_id?: number | null;
  category_links?: ProductCategoryLink[];

  /**
   * شناسه گروه بویایی قبلاً ساخته‌شده.
   *
   * اگر null ارسال شود، محصول هیچ گروه بویایی نخواهد داشت.
   */
  scent_family_id?: number | null;

  /**
   * فقط زمانی ارسال می‌شود که ادمین در فرم گزینه
   * «ایجاد گروه بویایی جدید» را انتخاب کند.
   */
  new_scent_family?: NewScentFamilyInput | null;

  is_active?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE";

  images?: ProductImageCreateInput[];
  variants: ProductVariantCreateInput[];
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export type ProductFilters = {
  search?: string;

  categoryId?: number;
  categorySlug?: string;

  /**
   * فیلتر محصولات بر اساس شناسه گروه بویایی.
   */
  scentFamilyId?: number;

  /**
   * فیلتر محصولات بر اساس slug گروه بویایی.
   */
  scentFamilySlug?: string;

  type?: ProductType;
  status?: "ACTIVE" | "DRAFT" | "INACTIVE";

  is_featured?: number;
  is_best_seller?: number;
  is_active?: number;

  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;

  withDeleted?: boolean;
  onlyDeleted?: boolean;

  sort?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "name_asc"
    | "name_desc";
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

/**
 * یکسان‌سازی نام فارسی گروه بویایی.
 *
 * مثال:
 * - چوبی
 * - چوبي
 * - " چوبی "
 *
 * تا جای ممکن به یک مقدار استاندارد نزدیک می‌شوند.
 */
function normalizeScentFamilyName(value: string) {
  return value
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

/**
 * slug مورد استفاده برای گروه‌هایی که هنگام ایجاد محصول ساخته می‌شوند.
 *
 * Service مستقل scent family هم slug خودش را تولید می‌کند؛
 * این تابع برای حالتی است که گروه مستقیماً در Transaction محصول ساخته شود.
 */
function createScentFamilySlug(name: string) {
  const normalized = normalizeScentFamilyName(name);

  const slug = normalized
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `scent-family-${Date.now()}`;
}

/**
 * تشخیص و دریافت گروه بویایی مناسب محصول.
 *
 * اولویت:
 * 1. اگر scent_family_id موجود باشد، صحت آن بررسی می‌شود.
 * 2. اگر new_scent_family موجود باشد، گروه جدید ایجاد یا گروه هم‌نام موجود استفاده می‌شود.
 * 3. اگر scent_family_id صراحتاً null باشد، ارتباط محصول با گروه حذف می‌شود.
 * 4. اگر هیچ‌کدام ارسال نشده باشند، در Update مقدار قبلی دست‌نخورده می‌ماند.
 */
async function resolveScentFamilyId(
  connection: PoolConnection,
  data: Pick<ProductUpdateInput, "scent_family_id" | "new_scent_family">,
): Promise<number | null> {
  /**
   * انتخاب یک گروه قبلی.
   */
  if (data.scent_family_id !== undefined && data.scent_family_id !== null) {
    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT id
      FROM scent_families
      WHERE id = ?
      LIMIT 1
      `,
      [data.scent_family_id],
    );

    if (!rows.length) {
      throw new Error("Selected scent family does not exist");
    }

    return Number(rows[0].id);
  }

  /**
   * ساخت یک گروه جدید در Transaction محصول.
   *
   * تابع findOrCreate... ابتدا نام را بررسی می‌کند؛
   * اگر قبلاً گروهی با همین نام موجود باشد، همان id را بازمی‌گرداند.
   */
  if (data.new_scent_family) {
    const name = normalizeScentFamilyName(data.new_scent_family.name);

    if (!name) {
      throw new Error("Scent family name is required");
    }

    return findOrCreateScentFamilyInTransaction(connection, {
      name,
      slug: createScentFamilySlug(name),
      image_url: data.new_scent_family.image_url?.trim() || "",
    });
  }

  /**
   * scent_family_id: null یعنی ادمین خواسته گروه بویایی پاک شود.
   */
  if (data.scent_family_id === null) {
    return null;
  }

  return null;
}

function buildProductWhere(filters: ProductFilters = {}) {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.onlyDeleted) {
    where.push("p.deleted_at IS NOT NULL");
  } else if (!filters.withDeleted) {
    where.push("p.deleted_at IS NULL");
  }

  if (filters.search?.trim()) {
    where.push(`
      (
        p.name LIKE ?
        OR p.slug LIKE ?
        OR p.description LIKE ?
        OR sf.name LIKE ?
      )
    `);

    const keyword = `%${filters.search.trim()}%`;
    values.push(keyword, keyword, keyword, keyword);
  }

  if (filters.categoryId) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_category_links pcl
        WHERE pcl.product_id = p.id
          AND pcl.child_id = ?
      )
    `);

    values.push(filters.categoryId);
  }

  if (filters.categorySlug) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_category_links pcl
        INNER JOIN categories c2 ON c2.id = pcl.child_id
        WHERE pcl.product_id = p.id
          AND c2.slug = ?
      )
    `);

    values.push(filters.categorySlug);
  }

  if (filters.scentFamilyId) {
    where.push("p.scent_family_id = ?");
    values.push(filters.scentFamilyId);
  }

  if (filters.scentFamilySlug?.trim()) {
    where.push("sf.slug = ?");
    values.push(filters.scentFamilySlug.trim());
  }

  if (filters.type) {
    where.push("p.type = ?");
    values.push(filters.type);
  }

  if (filters.status) {
    where.push("p.status = ?");
    values.push(filters.status);
  }

  if (filters.is_featured !== undefined) {
    where.push("COALESCE(p.is_featured, 0) = ?");
    values.push(filters.is_featured);
  }

  if (filters.is_best_seller !== undefined) {
    where.push("COALESCE(p.is_best_seller, 0) = ?");
    values.push(filters.is_best_seller);
  }

  if (filters.is_active !== undefined) {
    where.push("COALESCE(p.is_active, 1) = ?");
    values.push(filters.is_active);
  }

  if (filters.minPrice !== undefined) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_variants pvf
        WHERE pvf.product_id = p.id
          AND pvf.price >= ?
      )
    `);

    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_variants pvf
        WHERE pvf.product_id = p.id
          AND pvf.price <= ?
      )
    `);

    values.push(filters.maxPrice);
  }

  if (filters.inStock === true) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM product_variants pvf
        WHERE pvf.product_id = p.id
          AND pvf.stock_qty > 0
          AND COALESCE(pvf.is_active, 1) = 1
      )
    `);
  }

  if (filters.inStock === false) {
    where.push(`
      NOT EXISTS (
        SELECT 1
        FROM product_variants pvf
        WHERE pvf.product_id = p.id
          AND pvf.stock_qty > 0
          AND COALESCE(pvf.is_active, 1) = 1
      )
    `);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    values,
  };
}

function buildSort(sort?: ProductFilters["sort"]) {
  switch (sort) {
    case "oldest":
      return "ORDER BY p.created_at ASC";

    case "price_asc":
      return "ORDER BY min_variant_price ASC, p.created_at DESC";

    case "price_desc":
      return "ORDER BY min_variant_price DESC, p.created_at DESC";

    case "name_asc":
      return "ORDER BY p.name ASC";

    case "name_desc":
      return "ORDER BY p.name DESC";

    case "newest":
    default:
      return "ORDER BY p.created_at DESC";
  }
}

async function insertProductImages(
  connection: PoolConnection,
  productId: number,
  images: ProductImageCreateInput[] = [],
) {
  if (!images.length) return;

  for (const image of images) {
    await connection.query(
      `
      INSERT INTO product_images
      (product_id, image_url, is_main)
      VALUES (?, ?, ?)
      `,
      [productId, image.image_url, image.is_main ? 1 : 0],
    );
  }
}

async function insertVariantImages(
  connection: PoolConnection,
  variantId: number,
  images: ProductVariantImageCreateInput[] = [],
) {
  if (!images.length) return;

  for (const image of images) {
    await connection.query(
      `
      INSERT INTO product_variant_images
      (product_variant_id, image_url, is_main)
      VALUES (?, ?, ?)
      `,
      [variantId, image.image_url, image.is_main ? 1 : 0],
    );
  }
}

async function insertProductVariants(
  connection: PoolConnection,
  productId: number,
  productType: ProductType,
  variants: ProductVariantCreateInput[] = [],
) {
  for (const variant of variants) {
    const [result] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO product_variants
      (product_id, volume_ml, price, discount_price, stock_qty, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        variant.volume_ml ?? null,
        variant.price,
        variant.discount_price ?? null,
        variant.stock_qty,
        variant.is_active === undefined ? 1 : variant.is_active ? 1 : 0,
      ],
    );

    const variantId = Number(result.insertId);

    if (productType === "GROUPED") {
      await insertVariantImages(connection, variantId, variant.images ?? []);
    }
  }
}

async function replaceProductCategoryLinks(
  connection: PoolConnection,
  productId: number,
  categoryLinks: ProductCategoryLink[] = [],
) {
  await connection.query(
    `DELETE FROM product_category_links WHERE product_id = ?`,
    [productId],
  );

  if (!categoryLinks.length) return;

  for (const link of categoryLinks) {
    await connection.query(
      `
      INSERT INTO product_category_links
      (product_id, parent_id, child_id)
      VALUES (?, ?, ?)
      `,
      [productId, link.parent_id, link.child_id],
    );
  }
}

export async function createProduct(data: ProductCreateInput) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const primaryLink = data.category_links?.[0];

    const resolvedParentCategoryId =
      data.parent_category_id ?? primaryLink?.parent_id ?? null;

    const resolvedCategoryId =
      data.category_id ?? primaryLink?.child_id ?? null;

    /**
     * اگر گروه جدید باشد، در همین Transaction ساخته می‌شود.
     */
    const resolvedScentFamilyId = await resolveScentFamilyId(connection, data);

    const [result] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO products
      (
        type,
        category_id,
        parent_category_id,
        scent_family_id,
        name,
        slug,
        description,
        voice_file,
        is_active,
        is_featured,
        is_best_seller,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.type,
        resolvedCategoryId,
        resolvedParentCategoryId,
        resolvedScentFamilyId,
        data.name,
        data.slug,
        data.description ?? null,
        data.voice_file ?? null,
        data.is_active === undefined ? 1 : data.is_active ? 1 : 0,
        data.is_featured === undefined ? 0 : data.is_featured ? 1 : 0,
        data.is_best_seller === undefined ? 0 : data.is_best_seller ? 1 : 0,
        data.status ?? "ACTIVE",
      ],
    );

    const productId = Number(result.insertId);

    await replaceProductCategoryLinks(
      connection,
      productId,
      data.category_links ?? [],
    );

    await insertProductImages(connection, productId, data.images ?? []);

    await insertProductVariants(
      connection,
      productId,
      data.type,
      data.variants,
    );

    await connection.commit();

    return productId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateProduct(id: number, data: ProductUpdateInput) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.category_links && data.category_links.length > 0) {
      if (data.parent_category_id === undefined) {
        data.parent_category_id = data.category_links[0].parent_id;
      }

      if (data.category_id === undefined) {
        data.category_id = data.category_links[0].child_id;
      }
    }

    if (data.type !== undefined) {
      fields.push("type = ?");
      values.push(data.type);
    }

    if (data.category_id !== undefined) {
      fields.push("category_id = ?");
      values.push(data.category_id);
    }

    if (data.parent_category_id !== undefined) {
      fields.push("parent_category_id = ?");
      values.push(data.parent_category_id);
    }

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

    /**
     * فقط اگر یکی از این دو فیلد ارسال شده باشد، گروه بویایی تغییر می‌کند.
     *
     * scent_family_id: null
     * یعنی گروه بویایی فعلی محصول حذف شود.
     */
    if (
      data.scent_family_id !== undefined ||
      data.new_scent_family !== undefined
    ) {
      const resolvedScentFamilyId = await resolveScentFamilyId(
        connection,
        data,
      );

      fields.push("scent_family_id = ?");
      values.push(resolvedScentFamilyId);
    }

    if (data.voice_file !== undefined) {
      fields.push("voice_file = ?");
      values.push(data.voice_file);
    }

    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active ? 1 : 0);
    }

    if (data.is_featured !== undefined) {
      fields.push("is_featured = ?");
      values.push(data.is_featured ? 1 : 0);
    }

    if (data.is_best_seller !== undefined) {
      fields.push("is_best_seller = ?");
      values.push(data.is_best_seller ? 1 : 0);
    }

    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }

    if (fields.length) {
      await connection.query(
        `
        UPDATE products
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        [...values, id],
      );
    }

    if (data.category_links !== undefined) {
      await replaceProductCategoryLinks(connection, id, data.category_links);
    }

    if (data.images !== undefined) {
      await connection.query(
        `DELETE FROM product_images WHERE product_id = ?`,
        [id],
      );

      await insertProductImages(connection, id, data.images);
    }

    if (data.variants !== undefined) {
      const [productRows] = await connection.query<RowDataPacket[]>(
        `
        SELECT type
        FROM products
        WHERE id = ?
        LIMIT 1
        `,
        [id],
      );

      const productType = (productRows[0]?.type ?? "SINGLE") as ProductType;

      const [variantRows] = await connection.query<RowDataPacket[]>(
        `
        SELECT id
        FROM product_variants
        WHERE product_id = ?
        `,
        [id],
      );

      for (const row of variantRows) {
        await connection.query(
          `
          DELETE FROM product_variant_images
          WHERE product_variant_id = ?
          `,
          [row.id],
        );
      }

      await connection.query(
        `DELETE FROM product_variants WHERE product_id = ?`,
        [id],
      );

      await insertProductVariants(connection, id, productType, data.variants);
    }

    await connection.commit();

    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export type ProductOrderRow = RowDataPacket & {
  id: number;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  is_active: number | boolean;
};

export async function findManyProductsByIds(
  ids: number[],
  connection?: PoolConnection,
): Promise<ProductOrderRow[]> {
  if (!ids.length) {
    return [];
  }

  const executor = connection ?? db;
  const placeholders = ids.map(() => "?").join(",");

  const [rows] = await executor.query<ProductOrderRow[]>(
    `
    SELECT
      id,
      name,
      slug,
      status,
      is_active
    FROM products
    WHERE id IN (${placeholders})
      AND deleted_at IS NULL
    `,
    ids,
  );

  return rows;
}

export async function findProductById(id: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.*,

      sf.name AS scent_family_name,
      sf.slug AS scent_family_slug,
      sf.image_url AS scent_family_image,

      c.name AS category_name,
      c.slug AS category_slug,

      cp.name AS parent_category_name,
      cp.slug AS parent_category_slug

    FROM products p
    LEFT JOIN scent_families sf ON sf.id = p.scent_family_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories cp ON cp.id = p.parent_category_id
    WHERE p.id = ?
      AND p.deleted_at IS NULL
    LIMIT 1
    `,
    [id],
  );

  if (!rows.length) return null;

  const product = rows[0];
  const productType = (product.type ?? "SINGLE") as ProductType;

  const [images] = await db.query<RowDataPacket[]>(
    `
    SELECT
      id,
      product_id,
      image_url,
      is_main
    FROM product_images
    WHERE product_id = ?
    ORDER BY is_main DESC, id ASC
    `,
    [id],
  );

  const [variants] = await db.query<RowDataPacket[]>(
    `
    SELECT
      id,
      product_id,
      volume_ml,
      price,
      discount_price,
      stock_qty,
      is_active,
      created_at,
      updated_at
    FROM product_variants
    WHERE product_id = ?
    ORDER BY id ASC
    `,
    [id],
  );

  const [variantImages] = await db.query<RowDataPacket[]>(
    `
    SELECT
      id,
      product_variant_id AS variant_id,
      image_url,
      is_main
    FROM product_variant_images
    WHERE product_variant_id IN (
      SELECT id
      FROM product_variants
      WHERE product_id = ?
    )
    ORDER BY is_main DESC, id ASC
    `,
    [id],
  );

  const [linkRows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      pcl.product_id,
      pcl.parent_id,
      pcl.child_id,

      p1.name AS parent_name,
      p1.slug AS parent_slug,

      c1.name AS child_name,
      c1.slug AS child_slug

    FROM product_category_links pcl
    INNER JOIN categories p1 ON p1.id = pcl.parent_id
    INNER JOIN categories c1 ON c1.id = pcl.child_id
    WHERE pcl.product_id = ?
    ORDER BY pcl.id ASC
    `,
    [id],
  );

  const variantImagesMap = new Map<number, any[]>();

  for (const image of variantImages) {
    const variantId = Number(image.variant_id);

    if (!variantImagesMap.has(variantId)) {
      variantImagesMap.set(variantId, []);
    }

    variantImagesMap.get(variantId)!.push({
      id: Number(image.id),
      variant_id: Number(image.variant_id),
      image_url: image.image_url,
      is_main: Boolean(image.is_main),
    });
  }

  return {
    id: Number(product.id),
    type: productType,

    category_id: product.category_id ? Number(product.category_id) : null,

    parent_category_id: product.parent_category_id
      ? Number(product.parent_category_id)
      : null,

    /**
     * شناسه رابطه‌ی واقعی محصول با گروه بویایی.
     */
    scent_family_id: product.scent_family_id
      ? Number(product.scent_family_id)
      : null,

    /**
     * Alias برای سازگاری صفحات قبلی Frontend.
     * نام از جدول scent_families می‌آید، نه از products.
     */
    scent_family: product.scent_family_name ?? null,
    scent_family_slug: product.scent_family_slug ?? null,
    scent_family_image: product.scent_family_image ?? null,

    name: product.name,
    slug: product.slug,
    description: product.description,
    voice_file: product.voice_file,

    is_active: Boolean(product.is_active),
    is_featured: Boolean(product.is_featured),
    is_best_seller: Boolean(product.is_best_seller),
    status: product.status,

    category_name: product.category_name,
    category_slug: product.category_slug,

    parent_category_name: product.parent_category_name,
    parent_category_slug: product.parent_category_slug,

    category_links: linkRows.map((row) => ({
      parent_id: Number(row.parent_id),
      child_id: Number(row.child_id),

      parent_name: row.parent_name,
      parent_slug: row.parent_slug,

      child_name: row.child_name,
      child_slug: row.child_slug,
    })),

    images: images.map((image) => ({
      id: Number(image.id),
      product_id: Number(image.product_id),
      image_url: image.image_url,
      is_main: Boolean(image.is_main),
    })),

    variants: variants.map((variant) => ({
      id: Number(variant.id),
      product_id: Number(variant.product_id),

      volume_ml:
        variant.volume_ml !== null && variant.volume_ml !== undefined
          ? Number(variant.volume_ml)
          : null,

      price: Number(variant.price),

      discount_price:
        variant.discount_price !== null && variant.discount_price !== undefined
          ? Number(variant.discount_price)
          : null,

      stock_qty: Number(variant.stock_qty),
      is_active: Boolean(variant.is_active),

      created_at: variant.created_at,
      updated_at: variant.updated_at,

      images:
        productType === "GROUPED"
          ? (variantImagesMap.get(Number(variant.id)) ?? [])
          : [],
    })),

    created_at: product.created_at,
    updated_at: product.updated_at,
    deleted_at: product.deleted_at,
  };
}

export async function findProductBySlug(slug: string) {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT id
    FROM products
    WHERE slug = ?
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [slug],
  );

  if (!rows.length) return null;

  return findProductById(Number(rows[0].id));
}

export async function listProducts(
  filters: ProductFilters = {},
  pagination: PaginationParams = {},
) {
  const page = Math.max(1, Number(pagination.page ?? 1));
  const limit = Math.max(1, Math.min(100, Number(pagination.limit ?? 12)));
  const offset = (page - 1) * limit;

  const { whereSql, values } = buildProductWhere(filters);
  const sortSql = buildSort(filters.sort);

  /**
   * چون جست‌وجو و scentFamilySlug از sf استفاده می‌کنند،
   * Join باید در Query شمارش هم وجود داشته باشد.
   */
  const [countRows] = await db.query<RowDataPacket[]>(
    `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM products p
    LEFT JOIN scent_families sf ON sf.id = p.scent_family_id
    ${whereSql}
    `,
    values,
  );

  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.type,

      p.category_id,
      p.parent_category_id,

      p.scent_family_id,

      p.name,
      p.slug,
      p.description,
      p.voice_file,

      p.is_active,
      p.is_featured,
      p.is_best_seller,
      p.status,

      p.created_at,
      p.updated_at,

      sf.name AS scent_family_name,
      sf.slug AS scent_family_slug,
      sf.image_url AS scent_family_image,

      c.name AS category_name,
      c.slug AS category_slug,

      cp.name AS parent_category_name,
      cp.slug AS parent_category_slug,

      (
        SELECT MIN(pv.price)
        FROM product_variants pv
        WHERE pv.product_id = p.id
          AND COALESCE(pv.is_active, 1) = 1
      ) AS min_variant_price,

      (
        SELECT MAX(pv.price)
        FROM product_variants pv
        WHERE pv.product_id = p.id
          AND COALESCE(pv.is_active, 1) = 1
      ) AS max_variant_price,

      (
        SELECT COALESCE(SUM(pv.stock_qty), 0)
        FROM product_variants pv
        WHERE pv.product_id = p.id
          AND COALESCE(pv.is_active, 1) = 1
      ) AS total_stock,

      (
        SELECT pi.image_url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.is_main DESC, pi.id ASC
        LIMIT 1
      ) AS main_image

    FROM products p
    LEFT JOIN scent_families sf ON sf.id = p.scent_family_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories cp ON cp.id = p.parent_category_id

    ${whereSql}
    ${sortSql}

    LIMIT ? OFFSET ?
    `,
    [...values, limit, offset],
  );

  const productIds = rows.map((row) => Number(row.id));

  let categoryLinksMap = new Map<number, any[]>();
  let variantsMap = new Map<number, any[]>();
  let productImagesMap = new Map<number, any[]>();

  if (productIds.length) {
    const placeholders = productIds.map(() => "?").join(",");

    const [linkRows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        pcl.product_id,
        pcl.parent_id,
        pcl.child_id,

        p1.name AS parent_name,
        p1.slug AS parent_slug,

        c1.name AS child_name,
        c1.slug AS child_slug

      FROM product_category_links pcl
      INNER JOIN categories p1 ON p1.id = pcl.parent_id
      INNER JOIN categories c1 ON c1.id = pcl.child_id
      WHERE pcl.product_id IN (${placeholders})
      ORDER BY pcl.id ASC
      `,
      productIds,
    );

    for (const row of linkRows) {
      const productId = Number(row.product_id);

      if (!categoryLinksMap.has(productId)) {
        categoryLinksMap.set(productId, []);
      }

      categoryLinksMap.get(productId)!.push({
        parent_id: Number(row.parent_id),
        child_id: Number(row.child_id),

        parent_name: row.parent_name,
        parent_slug: row.parent_slug,

        child_name: row.child_name,
        child_slug: row.child_slug,
      });
    }
  }

  if (productIds.length) {
    const placeholders = productIds.map(() => "?").join(",");

    const [productImageRows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        id,
        product_id,
        image_url,
        is_main
      FROM product_images
      WHERE product_id IN (${placeholders})
      ORDER BY product_id ASC, is_main DESC, id ASC
      `,
      productIds,
    );

    for (const image of productImageRows) {
      const productId = Number(image.product_id);

      if (!productImagesMap.has(productId)) {
        productImagesMap.set(productId, []);
      }

      productImagesMap.get(productId)!.push({
        id: Number(image.id),
        product_id: Number(image.product_id),
        image_url: image.image_url,
        is_main: Boolean(image.is_main),
      });
    }
  }

  if (productIds.length) {
    const placeholders = productIds.map(() => "?").join(",");

    const [variantRows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        id,
        product_id,
        volume_ml,
        price,
        discount_price,
        stock_qty,
        is_active,
        created_at,
        updated_at
      FROM product_variants
      WHERE product_id IN (${placeholders})
        AND COALESCE(is_active, 1) = 1
      ORDER BY product_id ASC, id ASC
      `,
      productIds,
    );

    const variantIds = variantRows.map((row) => Number(row.id));
    const variantImagesMap = new Map<number, any[]>();

    if (variantIds.length) {
      const variantPlaceholders = variantIds.map(() => "?").join(",");

      const [variantImageRows] = await db.query<RowDataPacket[]>(
        `
        SELECT
          id,
          product_variant_id AS variant_id,
          image_url,
          is_main
        FROM product_variant_images
        WHERE product_variant_id IN (${variantPlaceholders})
        ORDER BY product_variant_id ASC, is_main DESC, id ASC
        `,
        variantIds,
      );

      for (const image of variantImageRows) {
        const variantId = Number(image.variant_id);

        if (!variantImagesMap.has(variantId)) {
          variantImagesMap.set(variantId, []);
        }

        variantImagesMap.get(variantId)!.push({
          id: Number(image.id),
          variant_id: Number(image.variant_id),
          image_url: image.image_url,
          is_main: Boolean(image.is_main),
        });
      }
    }

    const productTypeMap = new Map<number, ProductType>(
      rows.map((row) => [
        Number(row.id),
        (row.type ?? "SINGLE") as ProductType,
      ]),
    );

    for (const variant of variantRows) {
      const productId = Number(variant.product_id);
      const variantId = Number(variant.id);

      if (!variantsMap.has(productId)) {
        variantsMap.set(productId, []);
      }

      const productType = productTypeMap.get(productId) ?? "SINGLE";

      variantsMap.get(productId)!.push({
        id: variantId,
        product_id: productId,

        volume_ml:
          variant.volume_ml !== null && variant.volume_ml !== undefined
            ? Number(variant.volume_ml)
            : null,

        price: Number(variant.price),

        discount_price:
          variant.discount_price !== null &&
          variant.discount_price !== undefined
            ? Number(variant.discount_price)
            : null,

        stock_qty: Number(variant.stock_qty ?? 0),
        is_active: Boolean(variant.is_active),

        created_at: variant.created_at,
        updated_at: variant.updated_at,

        images:
          productType === "GROUPED"
            ? (variantImagesMap.get(variantId) ?? [])
            : [],
      });
    }
  }

  return {
    items: rows.map((row) => ({
      id: Number(row.id),
      type: (row.type ?? "SINGLE") as ProductType,

      category_id: row.category_id ? Number(row.category_id) : null,

      parent_category_id: row.parent_category_id
        ? Number(row.parent_category_id)
        : null,

      scent_family_id: row.scent_family_id ? Number(row.scent_family_id) : null,

      /**
       * Alias سازگار با کد قبلی Frontend.
       */
      scent_family: row.scent_family_name ?? null,
      scent_family_slug: row.scent_family_slug ?? null,
      scent_family_image: row.scent_family_image ?? null,

      name: row.name,
      slug: row.slug,
      description: row.description,
      voice_file: row.voice_file,

      is_active: Boolean(row.is_active),
      is_featured: Boolean(row.is_featured),
      is_best_seller: Boolean(row.is_best_seller),
      status: row.status,

      category_name: row.category_name,
      category_slug: row.category_slug,

      parent_category_name: row.parent_category_name,
      parent_category_slug: row.parent_category_slug,

      min_price:
        row.min_variant_price !== null ? Number(row.min_variant_price) : null,

      max_price:
        row.max_variant_price !== null ? Number(row.max_variant_price) : null,

      total_stock: Number(row.total_stock ?? 0),

      main_image: row.main_image,

      images: productImagesMap.get(Number(row.id)) ?? [],
      category_links: categoryLinksMap.get(Number(row.id)) ?? [],
      variants: variantsMap.get(Number(row.id)) ?? [],

      created_at: row.created_at,
      updated_at: row.updated_at,
    })),

    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function softDeleteProduct(id: number) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE products
    SET deleted_at = NOW()
    WHERE id = ?
      AND deleted_at IS NULL
    `,
    [id],
  );

  return result.affectedRows > 0;
}

export async function restoreProduct(id: number) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE products
    SET deleted_at = NULL
    WHERE id = ?
      AND deleted_at IS NOT NULL
    `,
    [id],
  );

  return result.affectedRows > 0;
}

export async function permanentlyDeleteProduct(id: number) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [variantRows] = await connection.query<RowDataPacket[]>(
      `
      SELECT id
      FROM product_variants
      WHERE product_id = ?
      `,
      [id],
    );

    for (const row of variantRows) {
      await connection.query(
        `
        DELETE FROM product_variant_images
        WHERE product_variant_id = ?
        `,
        [row.id],
      );
    }

    await connection.query(
      `DELETE FROM product_variants WHERE product_id = ?`,
      [id],
    );

    await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [
      id,
    ]);

    await connection.query(
      `DELETE FROM product_category_links WHERE product_id = ?`,
      [id],
    );

    await connection.query(`DELETE FROM products WHERE id = ?`, [id]);

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSelectProducts(options: {
  search?: string;
  excludeProductIds?: number[];
}) {
  const where: string[] = [
    "p.deleted_at IS NULL",
    "COALESCE(p.is_active, 1) = 1",
  ];

  const values: unknown[] = [];

  if (options.search?.trim()) {
    where.push("(p.name LIKE ? OR p.slug LIKE ?)");

    const keyword = `%${options.search.trim()}%`;
    values.push(keyword, keyword);
  }

  if (options.excludeProductIds?.length) {
    const placeholders = options.excludeProductIds.map(() => "?").join(",");

    where.push(`p.id NOT IN (${placeholders})`);
    values.push(...options.excludeProductIds);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.name
    FROM products p
    WHERE ${where.join(" AND ")}
    ORDER BY p.id DESC
    LIMIT 100
    `,
    values,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
  }));
}
