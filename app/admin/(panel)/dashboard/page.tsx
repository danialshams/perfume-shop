import Link from "next/link";
import { ArrowUpLeft, LayoutGrid, Package, Shapes, ShoppingBag } from "lucide-react";

const actions = [
  { href: "/admin/products", title: "محصولات", description: "مدیریت عکس‌ها، تنوع‌ها، قیمت و موجودی", icon: Package },
  { href: "/admin/categories", title: "دسته‌بندی‌ها", description: "چیدمان و ارتباط گروه‌های عطر", icon: Shapes },
  { href: "/admin/sliders", title: "اسلایدرها", description: "مدیریت تصاویر و مقصد اسلایدها", icon: LayoutGrid },
  { href: "/admin/orders", title: "سفارش‌ها", description: "بررسی جزئیات مشتری و وضعیت سفارش", icon: ShoppingBag },
] as const;

const preview = [
  { label: "هدر و منو", grid: "sm:col-span-2", height: "h-12", href: null },
  { label: "تصویر اصلی / هیرو", grid: "sm:col-span-1", height: "h-48", href: "/admin/sliders" },
  { label: "متن اصلی", grid: "sm:col-span-1", height: "h-48", href: null },
  { label: "دسته‌بندی رایحه‌ها", grid: "sm:col-span-2", height: "h-28", href: "/admin/categories" },
  { label: "محصولات منتخب", grid: "sm:col-span-2", height: "h-32", href: "/admin/products" },
  { label: "فوتر", grid: "sm:col-span-2", height: "h-14", href: null },
] as const;

export default function AdminDashboardPage() {
  return (
    <main className="min-h-[75svh] bg-[#f7f5f0] px-4 pb-24 pt-8 text-[#302d29] sm:px-8 sm:pt-12">
      <div className="mx-auto max-w-[1250px]">
        <p className="mb-3 text-[11px] tracking-[0.15em] text-[#a38a6d]" dir="ltr">MAISON / STUDIO</p>
        <h1 className="text-3xl font-light leading-[1.6] sm:text-4xl">مدیریت فروشگاه</h1>
        <p className="mt-3 max-w-xl text-[13px] leading-8 text-[#7b7165]">
          بخش‌های اصلی فروشگاه از اینجا در دسترس هستند. نمای چیدمان پایین، راهنمای ساختاری است؛
          ویرایش مستقیمِ بخش‌های سایت هنوز به پنل متصل نشده است.
        </p>
        <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} href={href}
              className="group flex min-h-36 flex-col justify-between border border-[#e1d9cd] bg-[#fffdf9] p-5 transition-colors hover:bg-[#eee9df]">
              <span className="flex items-center justify-between"><Icon size={21} strokeWidth={1.2} /><ArrowUpLeft size={16} strokeWidth={1.3} className="transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" /></span>
              <span><strong className="block text-[15px] font-normal">{title}</strong><small className="mt-2 block text-[11px] leading-6 text-[#877b70]">{description}</small></span>
            </Link>
          ))}
        </div>
        <section className="mt-12 border-t border-[#d8cfc3] pt-9" aria-label="شمای صفحه اصلی">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[11px] text-[#a38a6d]" lang="en">STOREFRONT BLUEPRINT</p><h2 className="mt-2 text-[22px] font-light">شمای صفحهٔ اصلی</h2></div>
            <Link className="border-b border-[#a38a6d] pb-2 text-xs" href="/" target="_blank" rel="noopener noreferrer">مشاهدهٔ سایت</Link>
          </div>
          <div className="mx-auto grid max-w-[680px] grid-cols-1 gap-3 bg-[#e9e3da] p-3 sm:grid-cols-2">
            {preview.map(item => (
              <div key={item.label} className={item.grid}>
                {item.href ? (
                  <Link href={item.href} className={item.height + " flex items-center justify-center border border-[#d4c9b9] bg-[#fbfaf7] text-xs text-[#574d44] transition-colors hover:bg-white"}>{item.label}</Link>
                ) : (
                  <div className={item.height + " flex items-center justify-center border border-dashed border-[#d4c9b9] bg-[#f4f0e9] text-xs text-[#817566]"}>{item.label}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
