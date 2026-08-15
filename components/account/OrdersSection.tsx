"use client";

import { useEffect, useState } from "react";
import React from "react";
import Image from "next/image";
import { T } from "./utils";

type OrderItem = {
    id: number;
    product_id: number;
    product_name: string;
    variant_title: string | null;
    volume_ml: number | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_image?: string | null;
};

type Order = {
    id: number;
    order_number: string;
    status:
        | "PENDING_PAYMENT"
        | "PAID"
        | "PROCESSING"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED";
    payment_status: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
    total_amount: string;
    created_at: string;
    items: OrderItem[];
};

type Pagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

/* ------------------------------------------------------------------ */
/*  Status meta — رنگ‌ها از همان توکن‌های فرم                          */
/* ------------------------------------------------------------------ */

type StatusIcon = "check" | "clock" | "x" | "dot";

const orderStatusLabelMap: Record<Order["status"], string> = {
    PENDING_PAYMENT: "در انتظار پرداخت",
    PAID: "موفق",
    PROCESSING: "موفق",
    SHIPPED: "موفق",
    DELIVERED: "موفق",
    CANCELLED: "لغو شده",
};

const PENDING_TONE = "#B58A3A"; // امبر ملایم هم‌خانوادهٔ طیف رمز

function getOrderStatusMeta(
    status: Order["status"],
    paymentStatus?: Order["payment_status"],
): { label: string; icon: StatusIcon; tone: string } {
    if (paymentStatus === "FAILED") {
        return { label: "پرداخت ناموفق", icon: "x", tone: T.danger };
    }

    const successful: Order["status"][] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
    if (successful.includes(status) || paymentStatus === "PAID") {
        return { label: "موفق", icon: "check", tone: T.ok };
    }

    if (status === "PENDING_PAYMENT") {
        return { label: "در انتظار پرداخت", icon: "clock", tone: PENDING_TONE };
    }

    if (status === "CANCELLED") {
        return { label: "لغو شده", icon: "x", tone: T.danger };
    }

    return { label: orderStatusLabelMap[status] || "نامشخص", icon: "dot", tone: T.ink3 };
}

function StatusMark({ icon, tone }: { icon: StatusIcon; tone: string }) {
    if (icon === "check") {
        return (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                    d="M1.5 6.4L4.3 9.2L10.5 2.8"
                    stroke={tone}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    if (icon === "clock") {
        return (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="4.4" stroke={tone} strokeWidth="1" />
                <path
                    d="M6 3.6V6.1L7.6 7.1"
                    stroke={tone}
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    if (icon === "x") {
        return (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                    d="M3.4 3.4L8.6 8.6M8.6 3.4L3.4 8.6"
                    stroke={tone}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }
    return (
        <span
            aria-hidden="true"
            className="inline-block h-[4px] w-[4px] rounded-full"
            style={{ background: tone }}
        />
    );
}

function OrderStatusBadge({
    status,
    paymentStatus,
}: {
    status: Order["status"];
    paymentStatus?: Order["payment_status"];
}) {
    const meta = getOrderStatusMeta(status, paymentStatus);

    return (
        <span className="inline-flex items-center gap-1.5">
            <StatusMark icon={meta.icon} tone={meta.tone} />
            <span
                className="text-[11px] font-normal tracking-[0.04em]"
                style={{ color: meta.tone }}
            >
                {meta.label}
            </span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const faDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("fa-IR") : "نامشخص";

const toman = (v: number | string | null | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toLocaleString("fa-IR")} تومان` : "۰ تومان";
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OrdersSection() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

    const toggleExpand = (orderId: number) => {
        setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            setError("");

            try {
                const res = await fetch(
                    `/api/v1/customers/account/orders?page=${page}&limit=5`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    },
                );

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        json?.message ||
                            (res.status === 401
                                ? "نشست شما منقضی شده است؛ دوباره وارد شوید."
                                : "خطا در ارتباط با سرور"),
                    );
                }

                if (json && json.success) {
                    setOrders(json.data?.items || []);
                    setPagination(json.data?.pagination || null);
                } else {
                    throw new Error(json?.message || "خطا در دریافت لیست سفارش‌ها");
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "خطای ناشناخته رخ داده است",
                );
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [page]);

    /* ── States: loading / error / empty ───────────────────── */

    if (loading) {
        return (
            <div
                className="border-t py-16 text-center text-[12px] font-light tracking-[0.02em]"
                style={{ borderColor: T.hairline, color: T.ink3 }}
            >
                در حال بارگذاری سفارش‌ها …
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="border-r-2 py-4 pl-6 pr-5 text-[12.5px] font-normal leading-[1.9]"
                style={{ borderColor: T.danger, background: T.paper, color: T.ink1 }}
            >
                {error}
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div
                className="border-t py-20 text-center"
                style={{ borderColor: T.hairline }}
            >
                <p
                    className="text-[12.5px] font-light leading-[2]"
                    style={{ color: T.ink3 }}
                >
                    هنوز سفارشی ثبت نکرده‌اید.
                </p>
            </div>
        );
    }

    /* ── List ───────────────────────────────────────────────── */

    return (
        <div >
            <ul>
                {orders.map((order, index) => {
                    const key = order.id ? `order-${order.id}` : `order-fallback-${index}`;
                    const isExpanded = !!expandedOrders[order.id];
                    const count = order.items?.length || 0;

                    return (
                        <li
                            key={key}
                            className="border-t  "
                            style={{ borderColor: T.hairline }}
                        >
                            {/* ── سطر اصلی سفارش ─────────────────────── */}
                            <div className="py-7  ">
                                <div className="flex flex-wrap  items-baseline justify-between gap-x-6 gap-y-3">
                                    {/* شماره سفارش + تاریخ */}
                                    <div className="flex items-baseline gap-4">
                                        <span
                                            className="text-[10px] font-normal tabular-nums tracking-[0.2em]"
                                            style={{ color: T.ink3 }}
                                        >
                                            #{order.order_number || "—"}
                                        </span>
                                        <span
                                            className="text-[11px] font-light tabular-nums tracking-[0.04em]"
                                            style={{ color: T.ink3 }}
                                        >
                                            {faDate(order.created_at)}
                                        </span>
                                    </div>

                                    {/* وضعیت */}
                                    <OrderStatusBadge
                                        status={order.status}
                                        paymentStatus={order.payment_status}
                                    />
                                </div>

                                <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                                    {/* مبلغ */}
                                    <div className="flex items-baseline gap-3">
                                        <span
                                            className="text-[11px] font-light tracking-[0.03em]"
                                            style={{ color: T.ink2 }}
                                        >
                                            مبلغ کل
                                        </span>
                                        <span
                                            className="text-[15px] font-light tabular-nums tracking-[0.01em]"
                                            style={{ color: T.ink1 }}
                                        >
                                            {toman(order.total_amount)}
                                        </span>
                                    </div>

                                    {/* دکمهٔ جزئیات */}
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(order.id)}
                                        className="group inline-flex items-center gap-2 text-[11.5px] font-normal tracking-[0.08em] transition-colors duration-300 hover:text-[#1A1A1A]"
                                        style={{ color: T.ink2 }}
                                        aria-expanded={isExpanded}
                                    >
                                        {isExpanded ? "بستن جزئیات" : `مشاهده اقلام (${count})`}
                                        <svg
                                            width="9"
                                            height="9"
                                            viewBox="0 0 10 10"
                                            fill="none"
                                            aria-hidden="true"
                                            className={[
                                                "transition-transform duration-300",
                                                isExpanded ? "rotate-180" : "rotate-0",
                                            ].join(" ")}
                                        >
                                            <path
                                                d="M1.5 3.2L5 6.6L8.5 3.2"
                                                stroke="currentColor"
                                                strokeWidth="1.1"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* ── اقلام سفارش ────────────────────────── */}
                            {isExpanded && (
                                <div className="pb-9">
                                    <div
                                        className="border-t pt-7"
                                        style={{ borderColor: T.hairline }}
                                    >
                                        <span
                                            className="mb-6 block text-[10px] font-medium tracking-[0.2em]"
                                            style={{ color: T.ink3 }}
                                        >
                                            اقلام سفارش
                                        </span>

                                        {count > 0 ? (
                                            <ul className="space-y-6">
                                                {order.items.map((item, idx) => (
                                                    <li
                                                        key={item.id || idx}
                                                        className="flex items-start gap-4"
                                                    >
                                                        {/* تصویر */}
                                                        <div
                                                            className="h-16 w-16 shrink-0 overflow-hidden"
                                                            style={{ background: T.smoke }}
                                                        >
                                                            {item.product_image ? (
                                                                <Image
                                                                    src={item.product_image}
                                                                    alt={item.product_name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="flex h-full w-full items-center justify-center text-[9px] font-light tracking-[0.04em]"
                                                                    style={{ color: T.ink3 }}
                                                                >
                                                                    بدون عکس
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* مشخصات */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p
                                                                    className="line-clamp-2 text-[13px] font-light leading-[1.7]"
                                                                    style={{ color: T.ink1 }}
                                                                >
                                                                    {item.product_name}
                                                                </p>
                                                                <span
                                                                    className="shrink-0 pt-[2px] text-[11px] font-normal tabular-nums tracking-[0.04em]"
                                                                    style={{ color: T.ink3 }}
                                                                >
                                                                    ×{item.quantity.toLocaleString("fa-IR")}
                                                                </span>
                                                            </div>

                                                            {(item.variant_title || item.volume_ml) && (
                                                                <p
                                                                    className="mt-1.5 text-[10.5px] font-light leading-[1.7] tracking-[0.02em]"
                                                                    style={{ color: T.ink3 }}
                                                                >
                                                                    {item.variant_title}
                                                                    {item.volume_ml
                                                                        ? ` — ${item.volume_ml} میلی‌لیتر`
                                                                        : ""}
                                                                </p>
                                                            )}

                                                            <div className="mt-3 flex items-center gap-6">
                                                                <span
                                                                    className="text-[11px] font-light tabular-nums tracking-[0.02em]"
                                                                    style={{ color: T.ink2 }}
                                                                >
                                                                    واحد {toman(item.unit_price)}
                                                                </span>
                                                                <span
                                                                    className="text-[11.5px] font-normal tabular-nums tracking-[0.02em]"
                                                                    style={{ color: T.ink1 }}
                                                                >
                                                                    کل {toman(item.total_price)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p
                                                className="py-3 text-center text-[11px] font-light tracking-[0.02em]"
                                                style={{ color: T.ink3 }}
                                            >
                                                اطلاعات محصولی ثبت نشده است.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* خط پایانی فهرست */}
            <div className="border-t" style={{ borderColor: T.hairline }} />

            {/* ── صفحه‌بندی ──────────────────────────────────── */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-8">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="text-[11.5px] font-normal tracking-[0.1em] transition-colors duration-300 hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-30"
                        style={{ color: T.ink2 }}
                    >
                        قبلی
                    </button>

                    <span
                        className="text-[11px] font-light tabular-nums tracking-[0.06em]"
                        style={{ color: T.ink3 }}
                    >
                        {page.toLocaleString("fa-IR")} / {pagination.totalPages.toLocaleString("fa-IR")}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={page === pagination.totalPages}
                        className="text-[11.5px] font-normal tracking-[0.1em] transition-colors duration-300 hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-30"
                        style={{ color: T.ink2 }}
                    >
                        بعدی
                    </button>
                </div>
            )}
        </div>
    );
}
