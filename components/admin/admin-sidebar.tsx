"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Shapes,
  ShoppingBag,
  ChevronLeft,
} from "lucide-react";

const items = [
  {
    title: "داشبورد",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "محصولات",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "دسته‌بندی‌ها",
    href: "/admin/categories",
    icon: Shapes,
  },
  {
    title: "اسلایدر",
    href: "/admin/sliders",
    icon: Shapes,
  },
  {
    title: "سفارش‌ها",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
];

export default function AdminSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="flex h-full w-full flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center justify-between gap-3 rounded-3xl bg-white/5 px-4 py-3 transition hover:bg-white/[0.07]"
        >
          <div className="text-right">
            <p className="text-xs text-neutral-400">پنل مدیریت</p>
            <h2 className="mt-1 text-base font-bold text-white">
              Perfume Shop
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-lg">
            <span className="text-lg font-extrabold">P</span>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-5">
        <p className="mb-3 text-right text-xs font-medium text-neutral-500">
          منوی مدیریت
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${active
                ? "bg-white text-neutral-950 shadow-lg shadow-black/10"
                : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <ChevronLeft
                  className={`h-4 w-4 transition-transform duration-200 ${active
                    ? "translate-x-0 text-neutral-700"
                    : "translate-x-1 text-neutral-500 group-hover:translate-x-0 group-hover:text-white"
                    }`}
                />
                <span className="font-medium">{item.title}</span>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${active
                  ? "bg-neutral-100"
                  : "bg-white/5 group-hover:bg-white/10"
                  }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-3xl bg-white/[0.05] p-4 text-right backdrop-blur-sm">
          <p className="text-xs text-neutral-500">نسخه مدیریت</p>
          <p className="mt-1 text-sm font-semibold text-neutral-200">
            Modern Admin UI
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-white" />
          </div>
        </div>
      </div>
    </aside>
  );
}
