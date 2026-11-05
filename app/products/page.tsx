import type { Metadata } from "next";
import { Suspense } from "react";
import LuxuryProductsView from "@/components/HomeProductsPage/LuxuryProductsView";

export const metadata: Metadata = {
  title: "کالکشن عطرها | MAISON",
  description: "گالری عطرهای MAISON؛ کشف رایحه‌های مختلف با فیلترها، معرفی کامل، تصاویر و مشخصات هر محصول.",
  alternates: { canonical: "/products" },
  openGraph: { type: "website", title: "کالکشن عطرها | MAISON", url: "/products", images: ["/maison/portrait.jpg"] },
};

export default function ProductsPage() {
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10" role="status">در حال آماده‌سازی کالکشن…</main>}>
    <LuxuryProductsView />
  </Suspense>;
}
