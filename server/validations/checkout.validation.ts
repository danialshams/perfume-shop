import { z } from "zod";

const iranMobileRegex = /^09\d{9}$/;
const postalCodeRegex = /^\d{10}$/;

const optionalNullableString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `مقدار واردشده نباید بیشتر از ${maxLength} کاراکتر باشد`)
    .nullable()
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      return value;
    });

const optionalPasswordString = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (value === undefined || value === "") {
      return undefined;
    }

    return value;
  });

const checkoutItemSchema = z.object({
  product_id: z.coerce
    .number()
    .int("شناسه محصول باید عدد صحیح باشد")
    .positive("شناسه محصول نامعتبر است"),

  variant_id: z.coerce
    .number()
    .int("شناسه تنوع باید عدد صحیح باشد")
    .positive("شناسه تنوع نامعتبر است")
    .nullable()
    .optional()
    .transform((value) => value ?? null),

  quantity: z.coerce
    .number()
    .int("تعداد محصول باید عدد صحیح باشد")
    .min(1, "تعداد محصول باید حداقل ۱ باشد")
    .max(100, "تعداد محصول نمی‌تواند بیشتر از ۱۰۰ باشد"),
});

export const checkoutSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "نام باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام نباید بیشتر از ۱۰۰ کاراکتر باشد"),

    last_name: z
      .string()
      .trim()
      .min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام خانوادگی نباید بیشتر از ۱۰۰ کاراکتر باشد"),

    mobile: z
      .string()
      .trim()
      .regex(
        iranMobileRegex,
        "شماره همراه باید ۱۱ رقم باشد و با 09 شروع شود",
      ),

    phone: optionalNullableString(20),

    province: z
      .string()
      .trim()
      .min(2, "استان الزامی است")
      .max(100, "نام استان نباید بیشتر از ۱۰۰ کاراکتر باشد"),

    city: z
      .string()
      .trim()
      .min(2, "شهر الزامی است")
      .max(100, "نام شهر نباید بیشتر از ۱۰۰ کاراکتر باشد"),

    address: z
      .string()
      .trim()
      .min(10, "آدرس باید حداقل ۱۰ کاراکتر باشد")
      .max(1000, "آدرس نباید بیشتر از ۱۰۰۰ کاراکتر باشد"),

    plaque: z
      .string()
      .trim()
      .min(1, "پلاک الزامی است")
      .max(20, "پلاک نباید بیشتر از ۲۰ کاراکتر باشد"),

    floor: optionalNullableString(20),

    unit: optionalNullableString(20),

    postal_code: z
      .string()
      .trim()
      .regex(postalCodeRegex, "کد پستی باید دقیقاً ۱۰ رقم باشد"),

    notes: optionalNullableString(1000),

    wants_register: z.boolean().default(false),

    password: optionalPasswordString,
    confirm_password: optionalPasswordString,

    items: z
      .array(checkoutItemSchema)
      .min(1, "حداقل یک آیتم باید در سفارش باشد")
      .max(100, "تعداد آیتم‌های سفارش بیش از حد مجاز است"),
  })
  .superRefine((data, ctx) => {
    if (!data.wants_register) {
      return;
    }

    if (!data.password) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "رمز عبور الزامی است",
      });
    } else {
      if (data.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        });
      }

      if (data.password.length > 72) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد",
        });
      }
    }

    if (!data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "تکرار رمز عبور الزامی است",
      });
    }

    if (
      data.password &&
      data.confirm_password &&
      data.password !== data.confirm_password
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "رمز عبور و تکرار آن یکسان نیستند",
      });
    }
  });

export type CheckoutSchemaType = z.infer<typeof checkoutSchema>;
