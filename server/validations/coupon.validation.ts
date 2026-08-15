import { z } from "zod";

const nullableDateString = z
  .union([z.string().datetime(), z.null()])
  .optional();

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3).max(100),
    description: z.string().trim().max(1000).nullable().optional(),
    discount_type: z.enum(["PERCENT", "FIXED"]),
    discount_value: z.number().positive(),
    min_order_amount: z.number().min(0).optional(),
    max_discount_amount: z.number().positive().nullable().optional(),
    usage_limit: z.number().int().positive().nullable().optional(),
    starts_at: nullableDateString,
    expires_at: nullableDateString,
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "PERCENT" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "discount_value for PERCENT must not exceed 100",
      });
    }

    if (data.starts_at && data.expires_at) {
      const startsAt = new Date(data.starts_at);
      const expiresAt = new Date(data.expires_at);

      if (startsAt >= expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expires_at"],
          message: "expires_at must be after starts_at",
        });
      }
    }
  });

export const updateCouponSchema = z
  .object({
    code: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    discount_type: z.enum(["PERCENT", "FIXED"]).optional(),
    discount_value: z.number().positive().optional(),
    min_order_amount: z.number().min(0).optional(),
    max_discount_amount: z.number().positive().nullable().optional(),
    usage_limit: z.number().int().positive().nullable().optional(),
    starts_at: nullableDateString,
    expires_at: nullableDateString,
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discount_type === "PERCENT" &&
      data.discount_value !== undefined &&
      data.discount_value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "discount_value for PERCENT must not exceed 100",
      });
    }

    if (data.starts_at && data.expires_at) {
      const startsAt = new Date(data.starts_at);
      const expiresAt = new Date(data.expires_at);

      if (startsAt >= expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expires_at"],
          message: "expires_at must be after starts_at",
        });
      }
    }
  });

export const applyCouponSchema = z.object({
  code: z.string().trim().min(3).max(100),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
