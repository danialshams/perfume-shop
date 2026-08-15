"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { fetchCartApi } from "@/server/services/cart-api.service";
import { useCartCount } from "@/context/CartCountContext";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const { setCartCount } = useCartCount();

  const status = searchParams.get("status");
  const orderId = searchParams.get("order_id");
  const message = searchParams.get("message");

  const success = status === "success";

  useEffect(() => {
    if (!success) return;

    async function syncCartCount() {
      try {
        const cart = await fetchCartApi();

        const total = Array.isArray(cart?.items)
          ? cart.items.reduce(
              (sum: number, item: { quantity?: number }) =>
                sum + Number(item.quantity || 0),
              0,
            )
          : 0;

        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    }

    syncCartCount();
  }, [success, setCartCount]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div
        className={`rounded-3xl border p-6 shadow-sm ${
          success
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <h1
          className={`mb-3 text-2xl font-bold ${
            success ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {success ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود"}
        </h1>

        {orderId ? (
          <p className="mb-2 text-sm text-slate-700">شماره سفارش: {orderId}</p>
        ) : null}

        {message ? (
          <p className="mb-4 text-sm text-slate-600">جزئیات: {message}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            بازگشت به خانه
          </Link>

          <Link
            href="/cart"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700"
          >
            بازگشت به سبد خرید
          </Link>
        </div>
      </div>
    </div>
  );
}
