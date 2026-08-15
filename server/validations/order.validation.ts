import { z } from "zod";

export const createOrderItemSchema = z.object({
  product_id: z.number().int().positive(),
  product_variant_id: z.number().int().positive().nullable().optional(),
  product_name: z.string().min(1).max(180),
  variant_label: z.string().max(120).nullable().optional(),
  volume_ml: z.number().int().positive().nullable().optional(),
  unit_price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  line_total: z.number().nonnegative(),
});

export const createOrderSchema = z.object({
  address_id: z.number().int().positive().nullable().optional(),

  customer_name: z.string().min(1).max(120),
  customer_phone: z.string().min(1).max(30),
  customer_landline: z.string().max(30).nullable().optional(),
  customer_email: z.string().email().max(180).nullable().optional(),

  shipping_address: z.string().min(1).max(500),
  shipping_city: z.string().min(1).max(120),
  shipping_province: z.string().min(1).max(120),
  shipping_postal_code: z.string().max(30).nullable().optional(),
  shipping_country: z.string().max(120).nullable().optional(),
  shipping_plaque: z.string().max(50).nullable().optional(),
  shipping_unit: z.string().max(50).nullable().optional(),

  payment_method: z.string().min(1).max(50),

  subtotal_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().optional(),
  shipping_amount: z.number().nonnegative().optional(),
  total_amount: z.number().nonnegative(),

  notes: z.string().nullable().optional(),

  items: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
