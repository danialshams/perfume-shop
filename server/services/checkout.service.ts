import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getConnection } from "@/lib/db";
import { checkoutRepository } from "@/server/repositories/checkout.repository";
import {readSiteContent} from "@/server/site-content";
import {campaignDiscountPercent} from "@/lib/fertini-site-content";

const DUPLICATE_MOBILE_MESSAGE = "این شماره همراه قبلاً ثبت شده است";

function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

type CheckoutItemInput = {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
};

type CheckoutInput = {
  first_name: string;
  last_name: string;

  mobile: string;
  phone?: string | null;

  province: string;
  city: string;
  address: string;
  plaque: string;

  floor?: string | null;
  unit?: string | null;

  postal_code: string;
  notes?: string | null;

  wants_register: boolean;
  password?: string;
  confirm_password?: string;

  items: CheckoutItemInput[];
};

type CheckoutOptions = {
  customerId?: number | null;
  cartToken?: string | null;
};

type ResolvedCheckoutItem = {
  product_id: number;
  variant_id: number;

  product_name: string;
  variant_title: string | null;
  volume_ml: number | null;

  quantity: number;
  unit_price: number;
  total_price: number;
};

function getJalaliShortDatePart(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  if (!year || !month || !day) {
    throw new Error("تولید تاریخ شمسی برای شماره سفارش ناموفق بود");
  }

  return `${year}${month}${day}`;
}

function generateReadableRandomCode(length = 5): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const source = randomUUID().replace(/-/g, "").toUpperCase();

  let result = "";

  for (const char of source) {
    if (charset.includes(char)) {
      result += char;
    }

    if (result.length >= length) {
      break;
    }
  }

  if (result.length < length) {
    while (result.length < length) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  return result;
}

function createOrderNumber(): string {
  const datePart = getJalaliShortDatePart();
  const randomPart = generateReadableRandomCode(6);

  return `F-${datePart}-${randomPart}`;
}

class CheckoutService {
  async checkout(input: CheckoutInput, options?: CheckoutOptions) {
    // Fix the active campaign snapshot before the checkout transaction.
    const storefront=await readSiteContent();
    const checkoutTime=Date.now();
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      if (!input.items.length) {
        throw new Error("سبد خرید خالی است");
      }

      const cartId = options?.cartToken?.trim() || null;

      const normalizedFirstName = input.first_name.trim();
      const normalizedLastName = input.last_name.trim();
      const normalizedMobile = input.mobile.trim();
      const normalizedPhone = input.phone?.trim() || null;
      const normalizedProvince = input.province.trim();
      const normalizedCity = input.city.trim();
      const normalizedAddress = input.address.trim();
      const normalizedPlaque = input.plaque.trim();
      const normalizedFloor = input.floor?.trim() || null;
      const normalizedUnit = input.unit?.trim() || null;
      const normalizedPostalCode = input.postal_code.trim();
      const normalizedNotes = input.notes?.trim() || null;
      const normalizedPassword = input.password?.trim();
      const normalizedConfirmPassword = input.confirm_password?.trim();

      let customerId: number | null = options?.customerId ?? null;
      let userCreated = false;

      if (input.wants_register) {
        const existingCustomer = await checkoutRepository.findCustomerByMobile(
          normalizedMobile,
          connection,
        );

        if (existingCustomer) {
          throw new Error(DUPLICATE_MOBILE_MESSAGE);
        }

        if (!normalizedPassword) {
          throw new Error("رمز عبور برای ثبت‌نام الزامی است");
        }

        if (!normalizedConfirmPassword) {
          throw new Error("تکرار رمز عبور برای ثبت‌نام الزامی است");
        }

        if (normalizedPassword !== normalizedConfirmPassword) {
          throw new Error("رمز عبور و تکرار آن یکسان نیستند");
        }

        if (normalizedPassword.length < 6) {
          throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد");
        }

        if (normalizedPassword.length > 72) {
          throw new Error("رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد");
        }

        const passwordHash = await bcrypt.hash(normalizedPassword, 10);

        try {
          customerId = await checkoutRepository.createCustomer(
            {
              mobile: normalizedMobile,
              password_hash: passwordHash,
              first_name: normalizedFirstName,
              last_name: normalizedLastName,
            },
            connection,
          );
        } catch (error: unknown) {
          if (isDuplicateEntryError(error)) {
            throw new Error(DUPLICATE_MOBILE_MESSAGE);
          }

          throw error;
        }

        await checkoutRepository.createCustomerAddress(
          {
            customer_id: customerId,
            province: normalizedProvince,
            city: normalizedCity,
            address: normalizedAddress,
            plaque: normalizedPlaque,
            floor: normalizedFloor,
            unit: normalizedUnit,
            postal_code: normalizedPostalCode,
            is_default: 1,
          },
          connection,
        );

        userCreated = true;
      }

      let subtotalAmount = 0;
      let discountAmount = 0;
      const resolvedItems: ResolvedCheckoutItem[] = [];

      for (const item of input.items) {
        const product = await checkoutRepository.findProductForCheckout(
          item.product_id,
          item.variant_id ?? null,
          connection,
        );

        if (!product) {
          if (item.variant_id) {
            throw new Error(
              `تنوع انتخاب‌شده برای محصول ${item.product_id} پیدا نشد یا غیرفعال است`,
            );
          }

          throw new Error(
            `محصول با شناسه ${item.product_id} پیدا نشد یا Variant فعالی ندارد`,
          );
        }

        const availableStock = Number(product.stock);

        if (!Number.isFinite(availableStock)) {
          throw new Error(`موجودی محصول "${product.name}" معتبر نیست`);
        }

        if (availableStock < item.quantity) {
          throw new Error(
            `موجودی محصول "${product.name}" کافی نیست. موجودی فعلی: ${availableStock}`,
          );
        }

        const regularUnitPrice = Number(product.price);
        const campaignPercent=campaignDiscountPercent(storefront,Number(product.id),checkoutTime);
        const unitPrice=Math.round(regularUnitPrice*(100-campaignPercent)/100);

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(`قیمت محصول "${product.name}" معتبر نیست`);
        }

        const totalPrice = unitPrice * item.quantity;
        subtotalAmount += regularUnitPrice*item.quantity;
        discountAmount += (regularUnitPrice-unitPrice)*item.quantity;

        const variantTitle = product.volume_ml
          ? `${product.volume_ml} میلی‌لیتر`
          : null;

        resolvedItems.push({
          product_id: Number(product.id),
          variant_id: Number(product.variant_id),
          product_name: product.name,
          variant_title: variantTitle,
          volume_ml:
            product.volume_ml === null ? null : Number(product.volume_ml),
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
      }

      const shippingAmount = 0;
      const totalAmount = subtotalAmount - discountAmount + shippingAmount;

      const orderNumber = createOrderNumber();

      const orderId = await checkoutRepository.createOrder(
        {
          order_number: orderNumber,
          customer_id: customerId,
          cart_id: cartId,

          status: "PENDING_PAYMENT",
          payment_status: "UNPAID",

          customer_name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
          customer_phone: normalizedMobile,
          customer_landline: normalizedPhone,
          customer_email: null,

          shipping_province: normalizedProvince,

          shipping_city: normalizedCity,
          shipping_postal_code: normalizedPostalCode,
          shipping_address: normalizedAddress,
          shipping_plaque: normalizedPlaque,
          shipping_floor: normalizedFloor,
          shipping_unit: normalizedUnit,

          subtotal_amount: subtotalAmount,
          discount_amount: discountAmount,
          shipping_amount: shippingAmount,
          total_amount: totalAmount,

          notes: normalizedNotes,
        },
        connection,
      );

      for (const item of resolvedItems) {
        await checkoutRepository.createOrderItem(
          {
            order_id: orderId,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_title: item.variant_title,
            volume_ml: item.volume_ml,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          },
          connection,
        );

        const stockUpdated = await checkoutRepository.decreaseVariantStock(
          item.variant_id,
          item.quantity,
          connection,
        );

        if (!stockUpdated) {
          throw new Error(`کسر موجودی محصول "${item.product_name}" ناموفق بود`);
        }
      }

      await connection.commit();

      return {
        order_id: orderId,
        order_number: orderNumber,
        customer_id: customerId,
        cart_id: cartId,

        subtotal_amount: subtotalAmount,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,

        status: "PENDING_PAYMENT" as const,
        payment_status: "UNPAID" as const,
        user_created: userCreated,
      };
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Checkout transaction rollback failed:", rollbackError);
      }

      throw error;
    } finally {
      connection.release();
    }
  }
}

export const checkoutService = new CheckoutService();
