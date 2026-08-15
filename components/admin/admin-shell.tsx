"use client";

import { ReactNode, useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import { X } from "lucide-react";

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f6f7fb] to-[#eef2ff] text-neutral-900">
      <div className="hidden lg:block">
        <div className="fixed right-0 top-0 z-40 h-screen w-80 border-l border-white/20 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
          <AdminSidebar />
        </div>
      </div>

      <div className="min-h-screen lg:pr-80">
        <AdminHeader onMenuClick={() => setOpen(true)} />

        <main className="p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"
          }`}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/45 backdrop-blur-[3px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
            }`}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[88%] max-w-sm transform bg-neutral-950 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 text-white">
            <span className="text-sm font-semibold">منوی مدیریت</span>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 transition hover:bg-white/5"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(100%-73px)]">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
