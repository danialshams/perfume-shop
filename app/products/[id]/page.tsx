
import Link from "next/link";
import { notFound } from "next/navigation";

import LuxuryFooter from "@/components/home-sections/LuxuryFooter";
import LuxuryNavbar from "@/components/home-sections/navbar";
import ProductDetailClient from "@/components/HomeProductsPage/ProductDetailPage";
import { getProductById } from "@/lib/product";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
// فایل: ProductDetailPage.tsx (بخش Server Component)

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F8F8]">
      <LuxuryNavbar />

      <main className="flex flex-1 flex-col text-[#10213f]">
        <ProductDetailClient product={product} />

        <div className="mt-64 pb-4 flex w-full justify-center sm:mt-46">
          <Link
            href="/products"
            dir="rtl"
            className="
            flex w-fit items-center gap-2
            px-8 py-3
            text-[13px] font-light text-[#33383C]
            transition-all duration-300
          "
          >
            <span>صفحه محصولات</span>

            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M5 12l6-6M5 12l6 6" />
            </svg>
          </Link>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  );

}
