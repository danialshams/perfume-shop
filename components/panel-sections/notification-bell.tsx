"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Bell,
  CheckCheck,
  CircleX,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminNotifications } from "../hooks/use-admin-notifications";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
  confirmText = "حذف",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmText?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <div className="rounded-full bg-red-100 p-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
        </div>

        <p className="mb-6 text-sm leading-7 text-neutral-600">{message}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isLoading ? "در حال حذف..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatRelativeFa(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getNotificationIcon(type: string) {
  if (type === "payment_success") {
    return <BadgeCheck className="h-4 w-4 text-emerald-600" />;
  }

  if (type === "payment_failed") {
    return <CircleX className="h-4 w-4 text-red-600" />;
  }

  if (type === "payment_cancelled") {
    return <Ban className="h-4 w-4 text-amber-600" />;
  }

  return <ShoppingBag className="h-4 w-4" />;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [modalState, setModalState] = useState<{
    type: "one" | "all" | null;
    id?: number;
  }>({ type: null });

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items,
    unreadCount,
    hasNewEffect,
    connection,
    markAllAsRead,
    markOneAsRead,
    deleteOne,
    deleteAll,
  } = useAdminNotifications();

  const badgeLabel = useMemo(() => {
    return unreadCount > 99 ? "99+" : String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  async function executeDeleteOne() {
    if (!modalState.id) return;

    try {
      setDeletingId(modalState.id);
      await deleteOne(modalState.id);
      setModalState({ type: null });
    } finally {
      setDeletingId(null);
    }
  }

  async function executeDeleteAll() {
    try {
      setClearingAll(true);
      await deleteAll();
      setModalState({ type: null });
      setOpen(false);
    } finally {
      setClearingAll(false);
    }
  }

  async function handleNotificationClick(item: {
    id: number;
    is_read: 0 | 1;
    entity_type: string | null;
    entity_id: number | null;
  }) {
    try {
      setNavigatingId(item.id);

      if (item.is_read === 0) {
        await markOneAsRead(item.id);
      }

      setOpen(false);

      if (item.entity_type === "order" && item.entity_id) {
        router.push(`/admin/orders?openOrder=${item.entity_id}`);
        return;
      }

      router.push("/admin/orders");
    } finally {
      setNavigatingId(null);
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <ConfirmModal
        isOpen={modalState.type === "one"}
        onClose={() => setModalState({ type: null })}
        onConfirm={executeDeleteOne}
        title="حذف اعلان"
        message="آیا مطمئن هستید که می‌خواهید این اعلان حذف شود؟ این عملیات قابل بازگشت نیست."
        isLoading={!!deletingId}
      />

      <ConfirmModal
        isOpen={modalState.type === "all"}
        onClose={() => setModalState({ type: null })}
        onConfirm={executeDeleteAll}
        title="حذف همه اعلان‌ها"
        message="آیا مطمئن هستید که می‌خواهید همه اعلان‌ها حذف شوند؟ این عملیات قابل بازگشت نیست."
        isLoading={clearingAll}
        confirmText="حذف همه"
      />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-black/[0.03] active:scale-[0.98] ${
          hasNewEffect ? "animate-bounce" : ""
        }`}
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-lg ring-4 ring-white animate-pulse">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      <div
        className={`absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(22rem,calc(100vw-1rem))] -translate-x-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl transition-all duration-200 ease-out sm:w-[22rem] ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="absolute left-10 top-0 h-3 w-3 -translate-y-1/2 rotate-45 border-l border-t border-black/10 bg-white" />

        <div className="relative flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-900">اعلان‌ها</h3>
            <small className="text-[10px] text-neutral-500">{connection==="live"?"دریافت زنده فعال":connection==="polling"?"همگام‌سازی هر ۱۰ ثانیه":connection==="offline"?"اتصال اعلان‌ها برقرار نیست":"در حال اتصال…"}</small>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-xs font-medium text-neutral-700 hover:text-emerald-600"
              >
                <CheckCheck className="inline h-4 w-4" /> خواندن همه
              </button>
            ) : null}

            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setModalState({ type: "all" })}
                disabled={clearingAll}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="حذف همه"
                aria-label="حذف همه"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              اعلان جدیدی وجود ندارد
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-2 border-b border-black/5 px-3 py-3 transition hover:bg-neutral-50 ${
                  item.is_read === 0 ? "bg-red-50/50" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void handleNotificationClick(item)}
                  disabled={navigatingId === item.id}
                  className="block min-w-0 flex-1 rounded-xl px-1 text-right disabled:opacity-70"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-neutral-100 p-2">
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>

                      {item.message ? (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                          {item.message}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-neutral-400">
                        {formatRelativeFa(item.created_at)}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setModalState({ type: "one", id: item.id });
                  }}
                  disabled={deletingId === item.id}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 text-neutral-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  title="حذف اعلان"
                  aria-label="حذف اعلان"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
