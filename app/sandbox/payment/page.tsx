"use client";

import Link from "next/link";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SandboxPaymentContent() {
  const searchParams = useSearchParams();
  const authority = searchParams.get("authority");

  if (!authority) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          authority پیدا نشد
        </div>
      </div>
    );
  }

  const successUrl = `/api/v1/payment/callback?authority=${encodeURIComponent(authority)}&status=OK`;
  const failedUrl = `/api/v1/payment/callback?authority=${encodeURIComponent(authority)}&status=FAILED`;
  const cancelUrl = `/api/v1/payment/callback?authority=${encodeURIComponent(authority)}&status=CANCELLED`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          درگاه پرداخت آزمایشی
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          این صفحه فقط برای تست است و پرداخت واقعی انجام نمی‌شود.
        </p>

        <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="mb-2">
            <span className="font-medium">Authority:</span> {authority}
          </div>
        </div>

        <div className="grid gap-3">
          <Link
            href={successUrl}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-center font-medium text-white hover:bg-emerald-700"
          >
            پرداخت موفق
          </Link>

          <Link
            href={failedUrl}
            className="rounded-2xl bg-amber-500 px-4 py-3 text-center font-medium text-white hover:bg-amber-600"
          >
            پرداخت ناموفق
          </Link>

          <Link
            href={cancelUrl}
            className="rounded-2xl bg-rose-600 px-4 py-3 text-center font-medium text-white hover:bg-rose-700"
          >
            انصراف از پرداخت
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SandboxPaymentPage() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return (
      <div className="maison-page min-h-screen">
        <LuxuryNavbar />
        <main className="maison-wide flex min-h-[65svh] flex-col items-center justify-center py-24 text-center">
          <span className="maison-kicker" lang="en" dir="ltr">MAISON — COMMERCE</span>
          <h1 className="mt-8 text-4xl font-light">درگاه آزمایشی غیرفعال است.</h1>
          <p className="mt-6 max-w-xl text-sm leading-9 text-[#818a85]">
            این صفحه صرفاً برای آزمایش توسعه است. سفارش و پرداخت واقعی تا اتصال درگاه تأییدشده فعال نخواهد شد.
          </p>
          <Link href="/products" className="maison-link mt-10">بازگشت به گالری عطرها</Link>
        </main>
        <CinematicFooter />
      </div>
    );
  }
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10" role="status">در حال بارگذاری نتیجه…</main>}><SandboxPaymentContent/></Suspense>;
}
