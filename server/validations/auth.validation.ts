import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(190);

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
});
