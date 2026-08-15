"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "../panel-sections/spinner";
import NotificationBell from "../panel-sections/notification-bell";

export default function AdminHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 overflow-x-clip border-b border-white/60 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-black/[0.03] active:scale-[0.98] lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <NotificationBell />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 sm:px-4 text-sm font-medium text-red-600 transition-all duration-200 hover:scale-[1.02] hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Spinner size="sm" className="text-red-600" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {loading ? "در حال خروج..." : "خروج"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
