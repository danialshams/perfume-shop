import { couponRepository } from "@/server/repositories/coupon.repository";
import { cartRepository } from "@/server/repositories/cart.repository";
import {
  ApplyCouponInput,
  CreateCouponInput,
  UpdateCouponInput,
} from "@/server/validations/coupon.validation";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function roundAmount(value: number) {
  return Math.max(0, Math.round(value));
}

export const couponService = {
  async listCoupons() {
    return couponRepository.findAll();
  },

  async createCoupon(input: CreateCouponInput) {
    const normalizedCode = normalizeCode(input.code);

    const existing = await couponRepository.findByCode(normalizedCode);
    if (existing) {
      throw new Error("Coupon code already exists");
    }

    const id = await couponRepository.create({
      ...input,
      code: normalizedCode,
    });

    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw new Error("Failed to create coupon");
    }

    return coupon;
  },

  async updateCoupon(id: number, input: UpdateCouponInput) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new Error("Coupon not found");
    }

    const normalizedCode = input.code ? normalizeCode(input.code) : undefined;

    if (normalizedCode && normalizedCode !== existing.code) {
      const duplicate = await couponRepository.findByCode(normalizedCode);
      if (duplicate && duplicate.id !== id) {
        throw new Error("Coupon code already exists");
      }
    }

    const updated = await couponRepository.updateById(id, {
      ...input,
      code: normalizedCode,
    });

    if (!updated) {
      throw new Error("No changes applied");
    }

    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw new Error("Coupon not found after update");
    }

    return coupon;
  },

  async deleteCoupon(id: number) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new Error("Coupon not found");
    }

    const deleted = await couponRepository.deleteById(id);
    if (!deleted) {
      throw new Error("Failed to delete coupon");
    }

    return true;
  },

  async applyCoupon(userId: number, input: ApplyCouponInput) {
    const code = normalizeCode(input.code);
    const coupon = await couponRepository.findByCode(code);

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    if (coupon.status !== "ACTIVE") {
      throw new Error("Coupon is inactive");
    }

    const now = new Date();

    if (coupon.starts_at && now < coupon.starts_at) {
      throw new Error("Coupon is not active yet");
    }

    if (coupon.expires_at && now > coupon.expires_at) {
      throw new Error("Coupon has expired");
    }

    if (
      coupon.usage_limit !== null &&
      coupon.used_count >= coupon.usage_limit
    ) {
      throw new Error("Coupon usage limit reached");
    }

    const cart = await cartRepository.findActiveCartByCustomerId(userId);
    if (!cart) throw new Error("Cart is empty");
    const cartItems = await cartRepository.findCartItems(cart.id);

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const subtotal = roundAmount(
      cartItems.reduce((sum, item) => sum + Number(item.line_total), 0),
    );

    if (subtotal < Number(coupon.min_order_amount)) {
      throw new Error("Minimum order amount not reached");
    }

    let discountAmount = 0;

    if (coupon.discount_type === "PERCENT") {
      discountAmount = roundAmount(
        (subtotal * Number(coupon.discount_value)) / 100,
      );

      if (coupon.max_discount_amount !== null) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.max_discount_amount),
        );
      }
    } else if (coupon.discount_type === "FIXED") {
      discountAmount = roundAmount(Number(coupon.discount_value));
    }

    discountAmount = Math.min(discountAmount, subtotal);

    const finalAmount = roundAmount(subtotal - discountAmount);

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      subtotal,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    };
  },
};
