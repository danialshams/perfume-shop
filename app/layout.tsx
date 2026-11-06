import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartCountProvider } from "@/context/CartCountContext";
import MaisonAmbientSound from "@/components/maison/MaisonAmbientSound";
import "./globals.css";
import "./quiet-luxury.css";
import "./maison-experience.css";
import "./maison-v3.css";
import "./maison-home-v3.css";
import "./maison-pages-v3.css";
import "./maison-fonts.css";
import "./maison-commerce-v3.css";
import "./fertini-refinement.css";
import "./fertini-commerce.css";
import "./fertini-skeleton.css";
import "./fertini-nav-v5.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL ||
  "https://perfume-shop-danialshams-projects.vercel.app";
const isPreview = process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "FERTINI | گالری عطر و رایحه", template: "%s" },
  description: "FERTINI؛ تجربه‌ای آرام، سینمایی و شخصی برای کشف دنیای عطرها و آشنایی با رایحه‌های متفاوت.",
  applicationName: "FERTINI",
  keywords: ["عطر", "گالری عطر", "رایحه", "عطر زنانه", "عطر مردانه", "پرفیوم", "FERTINI"],
  alternates: { canonical: "/" },
  robots: { index: !isPreview, follow: !isPreview },
  openGraph: {
    type: "website", locale: "fa_IR", siteName: "FERTINI", title: "FERTINI | گالری عطر و رایحه",
    description: "دنیای عطرها را با نگاه یک گالری سینمایی کشف کنید.",
    url: "/", images: [{ url: "/maison/hero.jpg", alt: "گالری عطر FERTINI" }],
  },
  twitter: { card: "summary_large_image", title: "FERTINI | گالری عطر" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="fa" dir="rtl" className="h-full antialiased">
    <body id="top" className="flex min-h-full flex-col font-sans">
      <MaisonAmbientSound><CartCountProvider>{children}</CartCountProvider></MaisonAmbientSound>
    </body>
  </html>;
}
