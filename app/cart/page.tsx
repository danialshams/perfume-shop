import { Suspense } from "react";
import CartClient from "./CartClient";

export const metadata = {
  title: "سبد خرید | FERTINI",
  description: "مرور عطرهای انتخاب‌شده و ادامه خرید از FERTINI",
};

export default function CartPage() {
  return <main className="ql-shop maison-cart min-h-screen">
    <Suspense fallback={<div className="ql-container py-20 text-center text-[#8a8176]" role="status">در حال آماده‌سازی سبد خرید…</div>}>
      <CartClient />
    </Suspense>
  </main>;
}
