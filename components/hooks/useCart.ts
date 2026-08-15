"use client";

import {
  fetchCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "@/server/services/cart-api.service";
import { Cart } from "@/server/types/cart";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCartCount } from "@/context/CartCountContext"; // ۱. اضافه کردن این لاین

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<
    number | "clear" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const { setCartCount } = useCartCount(); // ۲. گرفتن تابع آپدیت از کانتکست

  // تابع کمکی برای محاسبه تعداد کل و آپدیت کانتکست
  const updateGlobalCount = useCallback(
    (cartData: Cart | null) => {
      if (!cartData) {
        setCartCount(0);
        return;
      }
      const total = cartData.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );
      setCartCount(total);
    },
    [setCartCount],
  );

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCartApi();
      setCart(data);
      updateGlobalCount(data); // ۳. آپدیت عدد سراسری
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت سبد خرید");
    } finally {
      setLoading(false);
    }
  }, [updateGlobalCount]);

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (quantity < 1) return;
      try {
        setActionLoadingId(itemId);
        setError(null);
        const data = await updateCartItemApi(itemId, quantity);
        setCart(data);
        updateGlobalCount(data); // ۴. آپدیت عدد سراسری
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "خطا در تغییر تعداد محصول",
        );
      } finally {
        setActionLoadingId(null);
      }
    },
    [updateGlobalCount],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      try {
        setActionLoadingId(itemId);
        setError(null);
        const data = await removeCartItemApi(itemId);
        setCart(data);
        updateGlobalCount(data); // ۵. آپدیت عدد سراسری
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در حذف محصول");
      } finally {
        setActionLoadingId(null);
      }
    },
    [updateGlobalCount],
  );

  const clear = useCallback(async () => {
    try {
      setActionLoadingId("clear");
      setError(null);
      const data = await clearCartApi();
      setCart(data);
      updateGlobalCount(data); // ۶. آپدیت عدد سراسری
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در خالی کردن سبد خرید",
      );
    } finally {
      setActionLoadingId(null);
    }
  }, [updateGlobalCount]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const isEmpty = useMemo(() => {
    return !cart || cart.items.length === 0;
  }, [cart]);

  return {
    cart,
    loading,
    error,
    actionLoadingId,
    isEmpty,
    reload: loadCart,
    updateQuantity,
    removeItem,
    clear,
  };
}
