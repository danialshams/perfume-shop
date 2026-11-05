
import type { Metadata } from "next";
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
    const copy = String(product.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const description = (copy || "معرفی ویژگی‌ها و تنوع‌های عطر " + product.name + " در گالری عطر FERTINI.").slice(0, 160);
    const image = product.images[0]?.image_url || "/maison/hero.jpg";
    const photo = image.startsWith("/") || image.startsWith("https://") ? image : "/" + image;
    const title = product.name + " | گالری عطر FERTINI";
    return {
      title, description,
      alternates: { canonical: "/products/" + numericId },
      openGraph: {
        type: "website", title, description, url: "/products/" + numericId,
        images: [{ url: photo, alt: product.name }],
      },
    };
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

  // Escape literal '<' to prevent stored product content from closing the JSON script.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product",
    name: product.name,
    description: String(product.description ?? "").replace(/<[^>]*>/g, " ").slice(0, 300),
    image: (product.images ?? []).map(item => item.image_url).filter(Boolean),
  }).replace(/</g, "\\u003c");

  return (
    <div className="ql-detail maison-detail flex min-h-screen flex-col bg-[#F5F2ED]">
      <LuxuryNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

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
