"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "./cart.utils";
import type { SummaryProps } from "./cart.types";

export default function MobileCheckoutBar({ subtotal, totalQuantity }: SummaryProps) {
  return (
    <aside className="maison-mobile-cart-bar lg:hidden" aria-label="خلاصه و ادامهٔ سبد خرید">
      <div>
        <span className="maison-mobile-cart-bar__caption">مبلغ سبد · {Number(totalQuantity || 0).toLocaleString("fa-IR")} کالا</span>
        <strong dir="ltr">{formatPrice(subtotal)} <small>تومان</small></strong>
      </div>
      <Link href="/checkout" aria-label="بررسی جزئیات و ادامهٔ سفارش">
        ادامهٔ سفارش <ArrowLeft size={16} strokeWidth={1.3} />
      </Link>
    </aside>
  );
}
