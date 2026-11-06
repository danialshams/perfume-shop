"use client";

import {
  fetchCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "@/server/services/cart-api.service";
import { Cart } from "@/server/types/cart";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCartCount } from "@/context/CartCountContext";

export function useCart({enabled=true}:{enabled?:boolean}={}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<
    number | "clear" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const { setCartCount } = useCartCount();

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
      updateGlobalCount(data);
    } catch (err) {
      setCart(null);
      setCartCount(0);
      console.error("Cart loading failed:", err);
      setError("در دریافت سبد خرید مشکلی پیش آمد.");
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
        const data = await updateCartItemApi(itemId, { quantity, variant_id: Number(cart?.items.find(item => item.id === itemId)?.variant_id ?? 0) });
        setCart(data);
        updateGlobalCount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در تغییر تعداد محصول");
        throw err;
      } finally {
        setActionLoadingId(null);
      }
    },
    [cart, updateGlobalCount],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      try {
        setActionLoadingId(itemId);
        setError(null);
        const data = await removeCartItemApi(itemId);
        setCart(data);
        updateGlobalCount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در حذف محصول");
        throw err;
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
      updateGlobalCount(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در خالی کردن سبد خرید",
      );
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  }, [updateGlobalCount]);

  useEffect(() => {
    if(enabled) void loadCart();
  }, [enabled,loadCart]);

  const isEmpty = useMemo(() => {
    return cart !== null && cart.items.length === 0;
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
