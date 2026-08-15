import { z } from "zod";

const iranMobileRegex = /^09\d{9}$/;

export const customerRegisterSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "نام باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
    last_name: z
      .string()
      .trim()
      .min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام خانوادگی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
    mobile: z
      .string()
      .trim()
      .regex(iranMobileRegex, "شماره همراه باید ۱۱ رقم باشد و با 09 شروع شود"),
    password: z
      .string()
      .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
      .max(100, "رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
    confirm_password: z
      .string()
      .min(6, "تکرار رمز عبور الزامی است")
      .max(100, "تکرار رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirm_password"],
  });

export const customerLoginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(iranMobileRegex, "شماره همراه باید ۱۱ رقم باشد و با 09 شروع شود"),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .max(100, "رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
