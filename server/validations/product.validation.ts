import { z } from "zod";

const numericString = z
  .string()
  .trim()
  .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
    message: "Must be a valid number",
  })
  .transform((value) => Number(value));

const positiveIntegerString = numericString.pipe(
  z.number().int().positive("Must be a positive integer"),
);

const nonNegativeNumberString = numericString.pipe(
  z.number().nonnegative("Must be a non-negative number"),
);

const optionalNumericString = z
  .union([numericString, z.undefined()])
  .optional();

const booleanQuery = z
  .union([
    z.literal("true").transform(() => true),
    z.literal("false").transform(() => false),
    z.boolean(),
    z.undefined(),
  ])
  .optional();

const flagQuery = z
  .union([
    z.literal("1").transform(() => 1 as const),
    z.literal("0").transform(() => 0 as const),
    z.literal(1),
    z.literal(0),
  ])
  .optional();

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .refine((value) => {
    return value.startsWith("/") || /^https?:\/\/.+/i.test(value);
  }, "Image URL must be a valid relative path or absolute URL");

const fileUrlSchema = z
  .string()
  .trim()
  .min(1, "File URL is required")
  .refine((value) => {
    return value.startsWith("/") || /^https?:\/\/.+/i.test(value);
  }, "File URL must be a valid relative path or absolute URL");

const productTypeSchema = z.enum(["SINGLE", "GROUPED"]);

const productImageSchema = z.object({
  image_url: imageUrlSchema,
  is_main: z.boolean().optional(),
});

const productVariantImageSchema = z.object({
  image_url: imageUrlSchema,
  is_main: z.boolean().optional(),
});

const productVariantSchema = z.object({
  volume_ml: z.number().int().positive().nullable().optional(),
  price: z.number().nonnegative("Price must be non-negative"),
  discount_price: z.number().nonnegative().optional().nullable(),
  stock_qty: z.number().int().nonnegative("Stock is required"),
  is_active: z.boolean().optional(),
  images: z.array(productVariantImageSchema).optional().default([]),
});

const categoryLinkSchema = z.object({
  parent_id: z.number().int().positive("Parent category is required"),
  child_id: z.number().int().positive("Child category is required"),
});

const newScentFamilySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Scent family name must be at least 2 characters")
    .max(120, "Scent family name must not exceed 120 characters"),

  // The homepage manages its own three family-card photos; product taxonomy is text-only.
  image_url: z.union([imageUrlSchema, z.literal("")]).default(""),
});

export const productListQuerySchema = z.object({
  page: optionalNumericString,
  limit: optionalNumericString,
  search: z.string().trim().optional(),

  categoryId: optionalNumericString,
  categorySlug: z.string().trim().optional(),

  scentFamilyId: optionalNumericString,
  scentFamilySlug: z.string().trim().optional(),

  type: productTypeSchema.optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),

  is_featured: flagQuery,
  is_best_seller: flagQuery,
  is_active: flagQuery,

  minPrice: optionalNumericString,
  maxPrice: optionalNumericString,
  inStock: booleanQuery,

  sort: z
    .enum([
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
    ])
    .optional(),
});

export const productIdOrSlugParamSchema = z.object({
  id: z.string().trim().min(1, "Product id or slug is required"),
});

export const createProductSchema = z
  .object({
    type: productTypeSchema.default("SINGLE"),

    name: z.string().trim().min(2, "Name must be at least 2 characters"),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .optional(),

    description: z.string().trim().optional().nullable(),

    voice_file: fileUrlSchema.optional().nullable(),

    category_id: z.number().int().positive().optional().nullable(),

    parent_category_id: z.number().int().positive().optional().nullable(),

    category_links: z
      .array(categoryLinkSchema)
      .min(1, "At least one category path is required"),

    scent_family_id: z.number().int().positive().optional().nullable(),

    new_scent_family: newScentFamilySchema.optional().nullable(),

    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_best_seller: z.boolean().optional(),

    status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),

    images: z.array(productImageSchema).optional().default([]),

    variants: z
      .array(productVariantSchema)
      .min(1, "At least one variant is required"),
  })
  .superRefine((data, ctx) => {
    if (
      data.parent_category_id &&
      data.category_id &&
      data.category_links?.length
    ) {
      const exists = data.category_links.some(
        (link) =>
          link.parent_id === data.parent_category_id &&
          link.child_id === data.category_id,
      );

      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category_links"],
          message:
            "category_links must include the pair of parent_category_id and category_id",
        });
      }
    }

    if (data.type === "SINGLE" && data.variants.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Single product must have exactly one variant",
      });
    }

    if (data.type === "SINGLE") {
      data.variants.forEach((variant, index) => {
        if (variant.images && variant.images.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", index, "images"],
            message: "Single product variant cannot have images",
          });
        }
      });
    }

    const hasExistingScentFamily =
      data.scent_family_id !== undefined && data.scent_family_id !== null;

    const hasNewScentFamily = Boolean(data.new_scent_family);

    if (hasExistingScentFamily && hasNewScentFamily) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scent_family_id"],
        message:
          "Choose an existing scent family or create a new one, not both",
      });
    }

    if (!hasExistingScentFamily && !hasNewScentFamily) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scent_family_id"],
        message: "Scent family is required",
      });
    }
  });

export const updateProductSchema = z
  .object({
    type: productTypeSchema.optional(),

    name: z.string().trim().min(2).optional(),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .optional(),

    description: z.string().trim().optional().nullable(),

    voice_file: fileUrlSchema.optional().nullable(),

    category_id: z.number().int().positive().optional().nullable(),

    parent_category_id: z.number().int().positive().optional().nullable(),

    category_links: z.array(categoryLinkSchema).optional(),

    scent_family_id: z.number().int().positive().optional().nullable(),

    new_scent_family: newScentFamilySchema.optional().nullable(),

    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_best_seller: z.boolean().optional(),

    status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),

    images: z.array(productImageSchema).optional(),

    variants: z.array(productVariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.parent_category_id &&
      data.category_id &&
      data.category_links?.length
    ) {
      const exists = data.category_links.some(
        (link) =>
          link.parent_id === data.parent_category_id &&
          link.child_id === data.category_id,
      );

      if (!exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category_links"],
          message:
            "category_links must include the pair of parent_category_id and category_id",
        });
      }
    }

    if (data.type === "SINGLE" && data.variants && data.variants.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Single product must have exactly one variant",
      });
    }

    if (data.type === "SINGLE" && data.variants) {
      data.variants.forEach((variant, index) => {
        if (variant.images && variant.images.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", index, "images"],
            message: "Single product variant cannot have images",
          });
        }
      });
    }

    const hasExistingScentFamily =
      data.scent_family_id !== undefined && data.scent_family_id !== null;

    const hasNewScentFamily = Boolean(data.new_scent_family);

    if (hasExistingScentFamily && hasNewScentFamily) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scent_family_id"],
        message:
          "Choose an existing scent family or create a new one, not both",
      });
    }
  });

export const productSearchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(2, "Search query must be at least 2 characters")
      .max(190, "Search query must not exceed 190 characters"),

    page: positiveIntegerString.optional().default(1),

    limit: positiveIntegerString
      .pipe(z.number().max(100, "Limit cannot be greater than 100"))
      .optional()
      .default(12),

    categoryId: positiveIntegerString.optional(),

    categorySlug: z.string().trim().min(1).max(220).optional(),

    type: productTypeSchema.optional(),

    is_featured: flagQuery,

    is_best_seller: flagQuery,

    minPrice: nonNegativeNumberString.optional(),

    maxPrice: nonNegativeNumberString.optional(),

    inStock: booleanQuery,

    sort: z
      .enum([
        "newest",
        "oldest",
        "price_asc",
        "price_desc",
        "name_asc",
        "name_desc",
      ])
      .optional()
      .default("newest"),
  })
  .superRefine((data, ctx) => {
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "maxPrice must be greater than or equal to minPrice",
      });
    }
  });
