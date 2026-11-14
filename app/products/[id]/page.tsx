
import type { Metadata } from "next";
import {currentSeo,seoMetadata,productSeoJsonLd} from "@/server/seo-metadata";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import LuxuryNavbar from "@/components/home-sections/navbar";
import ProductDetailClient from "@/components/HomeProductsPage/ProductDetailPage";
import type { Product } from "@/lib/product";
import { productService } from "@/server/services/product.service";
import { isPublicProduct, visiblePublicVariants } from "@/server/utils/product-visibility";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) return { robots: { index: false, follow: false } };
  try {
    const product = await productService.getById(numericId);
    if (!product || !isPublicProduct(product)) return { robots: { index: false, follow: false } };
    const config=await currentSeo();
    return seoMetadata(config,"/products/"+numericId,{
      title:product.name,
      description:product.description || "معرفی ویژگی‌ها، قیمت و مشخصات عطر " + product.name + " در FERTINI.",
      image:product.images[0]?.image_url,
      imageAlt:product.name,
    });
  } catch {
    return { robots: { index: false, follow: false } };
  }
}


export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  // Server components query the repository directly; localhost fetches fail on Vercel.
  const result = await productService.getById(productId);
  if (result && !isPublicProduct(result)) notFound();
  const product = result ? (JSON.parse(JSON.stringify({
    ...result,
    variants: visiblePublicVariants(result.variants),
  })) as Product) : null;

  if (!product) {
    notFound();
  }

  const config=await currentSeo();
  const jsonLd=config.structuredDataEnabled?productSeoJsonLd(config,product):null;

  return (
    <div className="ql-detail maison-detail flex min-h-screen flex-col bg-[#F5F2ED]">
      <LuxuryNavbar />
      {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}

      <main className="flex flex-1 flex-col text-[#302d29]">
        <ProductDetailClient product={product} />

        <div className="mt-20 pb-16 flex w-full justify-center sm:mt-28">
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

      <CinematicFooter />
    </div>
  );

}
