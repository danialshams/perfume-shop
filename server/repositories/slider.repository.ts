import { db } from "@/lib/db";

type SliderPlacement = "HOME" | "PRODUCTS";

type CreateSliderRepositoryInput = {
  product_id: number;
  placement: SliderPlacement;
  title: string;
  slug: string;
  image_url: string;
  link?: string | null;
  is_active?: boolean;
};

type UpdateSliderRepositoryInput = {
  product_id?: number;
  placement?: SliderPlacement;
  title?: string;
  slug?: string;
  image_url?: string;
  link?: string | null;
  is_active?: boolean;
};

export const sliderRepository = {
  async findAll(placement?: SliderPlacement) {
    const values: any[] = [];
    let placementSql = "";

    if (placement) {
      placementSql = "AND s.placement = ?";
      values.push(placement);
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        s.id,
        s.product_id,
        s.placement,
        s.title,
        s.slug,
        s.image_url,
        s.link,
        s.is_active,
        s.created_at,
        s.updated_at,
        s.deleted_at,

        p.name AS product_name,
        p.slug AS product_slug,
        p.status AS product_status,
        p.is_active AS product_is_active,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_main DESC, pi.id ASC
          LIMIT 1
        ) AS product_main_image
      FROM sliders s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE s.deleted_at IS NULL
      ${placementSql}
      ORDER BY s.id DESC
      `,
      values,
    );

    return rows;
  },

  async findActive(placement?: SliderPlacement) {
    const values: any[] = [];
    let placementSql = "";

    if (placement) {
      placementSql = "AND s.placement = ?";
      values.push(placement);
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        s.id,
        s.product_id,
        s.placement,
        s.title,
        s.slug,
        s.image_url,
        s.link,
        s.is_active,
        s.created_at,
        s.updated_at,

        p.name AS product_name,
        p.slug AS product_slug,
        p.status AS product_status,
        p.is_active AS product_is_active,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_main DESC, pi.id ASC
          LIMIT 1
        ) AS product_main_image
      FROM sliders s
      INNER JOIN products p ON p.id = s.product_id
      WHERE s.deleted_at IS NULL
        AND s.is_active = 1
        AND p.deleted_at IS NULL
        AND COALESCE(p.is_active, 1) = 1
      ${placementSql}
      ORDER BY s.id DESC
      `,
      values,
    );

    return rows;
  },

  async findById(id: number) {
    const [rows]: any = await db.query(
      `
      SELECT 
        s.id,
        s.product_id,
        s.placement,
        s.title,
        s.slug,
        s.image_url,
        s.link,
        s.is_active,
        s.created_at,
        s.updated_at,
        s.deleted_at,

        p.name AS product_name,
        p.slug AS product_slug,
        p.status AS product_status,
        p.is_active AS product_is_active,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_main DESC, pi.id ASC
          LIMIT 1
        ) AS product_main_image
      FROM sliders s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE s.id = ?
        AND s.deleted_at IS NULL
      LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  },

  async findBySlug(slug: string) {
    const [rows]: any = await db.query(
      `
      SELECT id, slug
      FROM sliders
      WHERE slug = ?
      LIMIT 1
      `,
      [slug],
    );

    return rows[0] ?? null;
  },

  async findBySlugExceptId(slug: string, id: number) {
    const [rows]: any = await db.query(
      `
      SELECT id, slug
      FROM sliders
      WHERE slug = ?
        AND id <> ?
      LIMIT 1
      `,
      [slug, id],
    );

    return rows[0] ?? null;
  },

  async findByProductIdAndPlacement(
    productId: number,
    placement: SliderPlacement,
  ) {
    const [rows]: any = await db.query(
      `
      SELECT id, product_id, placement
      FROM sliders
      WHERE product_id = ?
        AND placement = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [productId, placement],
    );

    return rows[0] ?? null;
  },

  async findByProductIdAndPlacementExceptId(
    productId: number,
    placement: SliderPlacement,
    id: number,
  ) {
    const [rows]: any = await db.query(
      `
      SELECT id, product_id, placement
      FROM sliders
      WHERE product_id = ?
        AND placement = ?
        AND id <> ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [productId, placement, id],
    );

    return rows[0] ?? null;
  },

  async findUsedProductIdsByPlacement(
    placement: SliderPlacement,
    exceptSliderId?: number,
  ) {
    const values: any[] = [placement];
    let exceptSql = "";

    if (exceptSliderId !== undefined) {
      exceptSql = "AND id <> ?";
      values.push(exceptSliderId);
    }

    const [rows]: any = await db.query(
      `
      SELECT DISTINCT product_id
      FROM sliders
      WHERE deleted_at IS NULL
        AND placement = ?
        AND product_id IS NOT NULL
        ${exceptSql}
      `,
      values,
    );

    return rows
      .map((row: any) => Number(row.product_id))
      .filter((id: number) => Number.isFinite(id) && id > 0);
  },

  async create(data: CreateSliderRepositoryInput) {
    const [result]: any = await db.query(
      `
      INSERT INTO sliders
        (product_id, placement, title, slug, image_url, link, is_active)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.product_id,
        data.placement,
        data.title,
        data.slug,
        data.image_url,
        data.link ?? null,
        data.is_active ?? true,
      ],
    );

    return this.findById(result.insertId);
  },

  async update(id: number, data: UpdateSliderRepositoryInput) {
    const existing = await this.findById(id);

    if (!existing) {
      return null;
    }

    const payload = {
      product_id:
        data.product_id === undefined ? existing.product_id : data.product_id,
      placement: data.placement ?? existing.placement,
      title: data.title ?? existing.title,
      slug: data.slug ?? existing.slug,
      image_url: data.image_url ?? existing.image_url,
      link:
        data.link === undefined
          ? existing.link
          : data.link === ""
            ? null
            : data.link,
      is_active:
        data.is_active === undefined
          ? Boolean(existing.is_active)
          : data.is_active,
    };

    await db.query(
      `
      UPDATE sliders
      SET
        product_id = ?,
        placement = ?,
        title = ?,
        slug = ?,
        image_url = ?,
        link = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        payload.product_id,
        payload.placement,
        payload.title,
        payload.slug,
        payload.image_url,
        payload.link,
        payload.is_active,
        id,
      ],
    );

    return this.findById(id);
  },

  async softDelete(id: number) {
    const existing = await this.findById(id);

    if (!existing) {
      return false;
    }

    await db.query(
      `
      UPDATE sliders
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [id],
    );

    return true;
  },

  async restore(id: number) {
    const [result]: any = await db.query(
      `
      UPDATE sliders
      SET
        deleted_at = NULL,
        updated_at = NOW()
      WHERE id = ?
      `,
      [id],
    );

    return result.affectedRows > 0;
  },
};
