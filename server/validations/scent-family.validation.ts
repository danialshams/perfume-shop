import { z } from "zod";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "Image URL is required")
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\/.+/i.test(value),
    "Image URL must be a valid relative path or absolute URL",
  );

const flagQuery = z
  .union([
    z.literal("1").transform(() => 1 as const),
    z.literal("0").transform(() => 0 as const),
    z.literal(1),
    z.literal(0),
  ])
  .optional();

export const scentFamilyListQuerySchema = z.object({
  is_active: flagQuery,
  search: z.string().trim().max(120).optional(),
});

export const scentFamilyIdParamSchema = z.object({
  id: z.string().trim().regex(/^\d+$/, "Invalid scent family id"),
});

export const createScentFamilySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must not exceed 120 characters"),

  image_url: z.union([imageUrlSchema, z.literal("")]).default(""),

  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateScentFamilySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must not exceed 120 characters")
    .optional(),

  image_url: imageUrlSchema.optional(),

  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});
