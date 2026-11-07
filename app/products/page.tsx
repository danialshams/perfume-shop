import type { Metadata } from "next";
import { Suspense } from "react";
import LuxuryProductsView from "@/components/HomeProductsPage/LuxuryProductsView";

export const metadata: Metadata = {
  title: "کالکشن عطرها | FERTINI",
  description: "گالری عطرهای FERTINI؛ کشف رایحه‌های مختلف با فیلترها، معرفی کامل، تصاویر و مشخصات هر محصول.",
  alternates: { canonical: "/products" },
  openGraph: { type: "website", title: "کالکشن عطرها | FERTINI", url: "/products", images: ["/maison/portrait.jpg"] },
};

export default function ProductsPage() {
  const demoMode = !(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10" role="status">در حال آماده‌سازی کالکشن…</main>}>
    <LuxuryProductsView demoMode={demoMode} />
  </Suspense>;
}
