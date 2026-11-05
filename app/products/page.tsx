import { Suspense } from "react";
import LuxuryProductsView from "@/components/HomeProductsPage/LuxuryProductsView";

export default function ProductsPage() {
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10" role="status">در حال آماده‌سازی کالکشن…</main>}>
    <LuxuryProductsView />
  </Suspense>;
}
