import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "پیش‌نمایش جزئیات عطر آزمایشی | FERTINI",
  description: "نمونهٔ نمایشی کامل صفحهٔ محصول فرتینی با تنوع حجم، گالری، نت‌های بویایی و گفتار آزمایشی.",
  robots: { index: false, follow: false },
};
export default function DemoLayout({children}:{children:React.ReactNode}){return children;}
