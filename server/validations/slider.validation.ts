import { z } from "zod";

export const sliderPlacementSchema = z.enum(["HOME", "PRODUCTS"]);

export const createSliderSchema = z.object({
  product_id: z.number().int().positive("Product is required"),
  placement: sliderPlacementSchema,

  title: z.string().trim().min(2).max(255).optional(),

  link: z
    .union([
      z.string().trim().url("Link must be a valid URL"),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  is_active: z.boolean().optional(),
});

export const updateSliderSchema = z.object({
  product_id: z.number().int().positive().nullable().optional(),
  placement: sliderPlacementSchema.optional(),

  title: z.string().trim().min(2).max(255).optional(),

  link: z
    .union([
      z.string().trim().url("Link must be a valid URL"),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  is_active: z.boolean().optional(),
});
