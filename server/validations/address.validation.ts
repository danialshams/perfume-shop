import { z } from "zod";

const nullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    })
    .refine((value) => value === null || value.length <= max, {
      message: `Must be at most ${max} characters`,
    });

const requiredTrimmedString = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length >= min, {
      message: `Must be at least ${min} characters`,
    })
    .refine((value) => value.length <= max, {
      message: `Must be at most ${max} characters`,
    });

export const createAddressSchema = z.object({
  full_name: requiredTrimmedString(1, 120),
  phone: requiredTrimmedString(1, 30),
  province: requiredTrimmedString(1, 120),
  city: requiredTrimmedString(1, 120),
  address_line: requiredTrimmedString(1, 500),
  postal_code: nullableTrimmedString(30),
  plaque: nullableTrimmedString(30),
  unit: nullableTrimmedString(30),
  country: nullableTrimmedString(120).default("Iran"),
  is_default: z.boolean().optional().default(false),
});

export const updateAddressSchema = z
  .object({
    full_name: requiredTrimmedString(1, 120).optional(),
    phone: requiredTrimmedString(1, 30).optional(),
    province: requiredTrimmedString(1, 120).optional(),
    city: requiredTrimmedString(1, 120).optional(),
    address_line: requiredTrimmedString(1, 500).optional(),
    postal_code: nullableTrimmedString(30).optional(),
    plaque: nullableTrimmedString(30).optional(),
    unit: nullableTrimmedString(30).optional(),
    country: nullableTrimmedString(120).optional(),
    is_default: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const addressIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParamInput = z.infer<typeof addressIdParamSchema>;
