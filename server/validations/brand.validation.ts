import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const createBrandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام برند باید حداقل 2 کاراکتر باشد")
    .max(120, "نام برند نمی‌تواند بیشتر از 120 کاراکتر باشد"),

  description: z
    .preprocess(emptyToUndefined, z.string().trim().max(2000).optional())
    .optional(),

  logo_url: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().url("آدرس لوگو معتبر نیست").optional(),
    )
    .optional(),

  country: z
    .preprocess(emptyToUndefined, z.string().trim().max(100).optional())
    .optional(),

  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const updateBrandSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام برند باید حداقل 2 کاراکتر باشد")
      .max(120, "نام برند نمی‌تواند بیشتر از 120 کاراکتر باشد")
      .optional(),

    description: z
      .union([z.string().trim().max(2000), z.literal(""), z.null()])
      .optional(),

    logo_url: z
      .union([
        z.string().trim().url("آدرس لوگو معتبر نیست"),
        z.literal(""),
        z.null(),
      ])
      .optional(),

    country: z
      .union([z.string().trim().max(100), z.literal(""), z.null()])
      .optional(),

    is_active: z.union([z.literal(0), z.literal(1)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "حداقل یک فیلد برای ویرایش لازم است",
  });
