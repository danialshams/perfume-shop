import { z } from "zod";

const iranMobileRegex = /^09\d{9}$/;
const postalCodeRegex = /^\d{10}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

const strongPasswordMessage =
  "رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ، حروف کوچک، عدد و کاراکتر خاص باشد";

export const updateCustomerProfileSchema = z.object({
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
  province: z
    .string()
    .trim()
    .min(2, "استان باید حداقل ۲ کاراکتر باشد")
    .max(100, "استان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  city: z
    .string()
    .trim()
    .min(2, "شهر باید حداقل ۲ کاراکتر باشد")
    .max(100, "شهر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  address: z
    .string()
    .trim()
    .min(10, "آدرس باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "آدرس نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد"),
  plaque: z
    .string()
    .trim()
    .min(1, "پلاک الزامی است")
    .max(20, "پلاک نمی‌تواند بیشتر از ۲۰ کاراکتر باشد"),
  floor: z
    .string()
    .trim()
    .max(20, "طبقه نمی‌تواند بیشتر از ۲۰ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
  unit: z
    .string()
    .trim()
    .max(20, "واحد نمی‌تواند بیشتر از ۲۰ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
  postal_code: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(postalCodeRegex, "کد پستی باید دقیقاً ۱۰ رقم باشد"),
    ])
    .optional(),
  phone: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^0\d{10}$/, "شماره ثابت باید ۱۱ رقم و با ۰ شروع شود"),
    ])
    .optional(),
});

export const updateCustomerPasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, "رمز عبور فعلی الزامی است")
      .max(100, "رمز عبور فعلی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
    password: z.string().regex(strongPasswordRegex, strongPasswordMessage),
    confirm_password: z
      .string()
      .min(1, "تکرار رمز عبور جدید الزامی است")
      .max(100, "تکرار رمز عبور جدید نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "رمز عبور جدید و تکرار آن یکسان نیستند",
    path: ["confirm_password"],
  });
