import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartCountProvider } from "@/context/CartCountContext";
import "./globals.css";
import "./quiet-luxury.css";
import "./maison-experience.css";
import "./maison-v3.css";
import "./maison-home-v3.css";
import MaisonAmbientSound from "@/components/maison/MaisonAmbientSound";

export const metadata: Metadata = {
  title: "MAISON | هنر انتخاب رایحه",
  description: "MAISON — مجموعه‌ای دست‌چین از عطرها؛ تجربه‌ای ظریف و آرام برای انتخاب رایحه شخصی شما.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <CartCountProvider>{children}<MaisonAmbientSound /></CartCountProvider>
      </body>
    </html>
  );
}
