"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

function PaymentStatusContent() {
  const params = useSearchParams();
  const unsuccessful = ["failed", "cancelled", "canceled"].includes(
    (params.get("status") || "").toLowerCase(),
  );
  const id = Number(params.get("order_id") || 0);
  const hasId = Number.isSafeInteger(id) && id > 0;

  return (
    <div className="ql-shop flex min-h-screen flex-col">
      <LuxuryNavbar />
      <main className="ql-container flex min-h-[70svh] flex-1 items-center justify-center py-20 sm:py-28">
        <section className="mx-auto w-full max-w-[680px] border-y border-[#d8cfc3] py-12 text-center sm:py-20" aria-labelledby="payment-state-title">
          <span className="ql-overline" dir="ltr" lang="en">FERTINI — YOUR ORDER</span>
          <div className="mx-auto my-9 h-px w-16 bg-[#a48b6d]" aria-hidden="true" />
          <h1 id="payment-state-title" className="text-[clamp(30px,5vw,52px)] font-light leading-[1.6] text-[#302d29]">
            {unsuccessful ? "پرداخت تکمیل نشد." : "نتیجهٔ پرداخت در حال بررسی است."}
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-[13px] font-light leading-[2.65] text-[#7c7165] sm:text-[15px]">
            {unsuccessful
              ? "پرداخت نهایی نشده است. برای ادامه، وضعیت سفارش خود را از حساب کاربری بررسی کنید."
              : "نمایش این صفحه به معنی تأیید پرداخت نیست. نتیجهٔ قطعی تنها پس از تأیید تراکنش توسط سرور و درگاه پرداخت در حساب کاربری ثبت می‌شود."}
          </p>
          {hasId && <p className="mt-6 text-[12px] text-[#978874]">شناسه سفارش: {id.toLocaleString("fa-IR")}</p>}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-9 gap-y-5 text-[13px]">
            <Link href="/account" className="border-b border-[#9b8263] py-3 text-[#302d29]">پیگیری در حساب کاربری</Link>
            <Link href="/products" className="border-b border-[#d7cab9] py-3 text-[#75685b]">بازگشت به مجموعه عطرها</Link>
          </div>
        </section>
      </main>
      <CinematicFooter />
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<main className="ql-shop min-h-screen px-5 py-28 text-center">در حال آماده‌سازی وضعیت سفارش…</main>}>
      <PaymentStatusContent />
    </Suspense>
  );
}
