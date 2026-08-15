import { z } from "zod";

const normalizedString = z.string().trim();

const optionalNullableTrimmedString = z.string().trim().nullable().optional();

const parentIdsSchema = z
  .array(z.coerce.number().int().positive())
  .transform((ids) => [...new Set(ids)])
  .optional();

/**
 * قبلاً url() گذاشته بودی.
 * اما حالا مقدار image_url چیزی مثل /uploads/categories/file.webp است،
 * پس نباید الزاماً URL کامل باشد.
 */
const imageUrlSchema = z
  .union([z.string().trim().max(500), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) return undefined;
    return value;
  });

export const createCategorySchema = z.object({
  name: normalizedString.min(2, "نام دسته‌بندی باید حداقل 2 کاراکتر باشد"),
  parent_ids: parentIdsSchema,
  description: optionalNullableTrimmedString,
  image_url: imageUrlSchema,
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const updateCategorySchema = z
  .object({
    name: normalizedString
      .min(2, "نام دسته‌بندی باید حداقل 2 کاراکتر باشد")
      .optional(),
    parent_ids: parentIdsSchema,
    description: optionalNullableTrimmedString,
    image_url: imageUrlSchema,
    is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "حداقل یک فیلد برای بروزرسانی باید ارسال شود",
  });
