"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type OrderListItem = {
  id: number;
  order_number: string | null;
  user_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  customer_landline?: string | null;
  customer_email: string | null;
  shipping_city: string;
  shipping_province: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  payment_provider: string | null;
  payment_ref_id: string | null;
  payment_authority: string | null;
  payment_transaction_id: string | null;
  payment_record_status: string | null;
  payment_paid_at: string | null;
  first_product_name?: string | null;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_variant_id: number | null;
  product_name: string;
  variant_title: string | null;
  variant_label: string | null;
  volume_ml: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_total: number | null;
  product_snapshot: string | null;
  product_slug?: string | null;
  product_image?: string | null;
  main_image?: string | null;
  created_at: string;
};

type OrderDetails = {
  id: number;
  order_number: string | null;
  user_id: number | null;
  address_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  customer_landline: string | null;
  customer_email: string | null;
  shipping_province: string;
  shipping_city: string;
  shipping_postal_code: string | null;
  shipping_address: string;
  shipping_plaque: string | null;
  shipping_floor: string | null;
  shipping_unit: string | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  notes: string | null;
  admin_notes: string | null;
  customer_snapshot: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  payment_id: number | null;
  payment_provider: string | null;
  payment_authority: string | null;
  payment_ref_id: string | null;
  payment_amount: number | null;
  payment_record_status: string | null;
  payment_paid_at: string | null;
  payment_transaction_id: string | null;
  payment_payload: string | null;
  payment_raw_response: string | null;
  items: OrderItem[];
};

type ApiListResponse = {
  success: boolean;
  message: string;
  data: {
    items: OrderListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ApiDetailsResponse = {
  success: boolean;
  message: string;
  data: OrderDetails;
};

const PAYMENT_STATUS_OPTIONS = ["PAID", "FAILED"];
const SHIPPING_STATUS_OPTIONS = ["SHIPPED", "NOT_SHIPPED"];

/* ---------- formatters ---------- */

function formatPrice(value: number | string | null | undefined) {
  return new Intl.NumberFormat("fa-IR").format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toEnglishDigits(value: string) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizePhone(value: string | null | undefined) {
  return toEnglishDigits(String(value || "").trim()).replace(/[^0-9+]/g, "");
}

function getPhoneDigits(value: string | null | undefined) {
  let phone = normalizePhone(value).replace(/\D/g, "");

  if (phone.startsWith("0098")) {
    phone = phone.slice(2);
  }

  return phone;
}

function getComparablePhone(value: string | null | undefined) {
  return getPhoneDigits(value);
}

function isMobileNumber(value: string | null | undefined) {
  const phone = getPhoneDigits(value);

  return (
    /^09\d{9}$/.test(phone) ||
    /^989\d{9}$/.test(phone) ||
    /^9\d{9}$/.test(phone)
  );
}

function formatPhoneForDisplay(value: string | null | undefined) {
  const originalValue = String(value || "").trim();

  if (!originalValue) return "";

  const phone = getPhoneDigits(originalValue);

  if (/^989\d{9}$/.test(phone)) {
    return `0${phone.slice(2)}`;
  }

  if (/^9\d{9}$/.test(phone)) {
    return `0${phone}`;
  }

  return originalValue;
}

function getCustomerMobile(order: {
  customer_phone?: string | null;
  customer_landline?: string | null;
}) {
  const customerPhone = order.customer_phone?.trim() || "";
  const customerLandline = order.customer_landline?.trim() || "";

  if (customerPhone && isMobileNumber(customerPhone)) {
    return formatPhoneForDisplay(customerPhone);
  }

  if (customerLandline && isMobileNumber(customerLandline)) {
    return formatPhoneForDisplay(customerLandline);
  }

  return "";
}

function getCustomerLandline(order: {
  customer_phone?: string | null;
  customer_landline?: string | null;
}) {
  const customerPhone = order.customer_phone?.trim() || "";
  const customerLandline = order.customer_landline?.trim() || "";

  if (customerLandline && !isMobileNumber(customerLandline)) {
    return formatPhoneForDisplay(customerLandline);
  }

  if (customerPhone && !isMobileNumber(customerPhone)) {
    return formatPhoneForDisplay(customerPhone);
  }

  return "";
}

/* ---------- translators ---------- */

function translatePaymentStatus(status: string | null | undefined) {
  switch (status) {
    case "PAID":
      return "موفق";
    case "FAILED":
      return "ناموفق";
    default:
      return status || "—";
  }
}

function translatePaymentRecordStatus(status: string | null | undefined) {
  switch (status) {
    case "SUCCESS":
    case "PAID":
      return "موفق";
    case "FAILED":
      return "ناموفق";
    default:
      return status || "—";
  }
}

function translateShippingStatus(status: string | null | undefined) {
  switch (status) {
    case "SHIPPED":
    case "DELIVERED":
      return "ارسال شده";
    case "NOT_SHIPPED":
    case "PROCESSING":
      return "ارسال نشده";
    default:
      return status || "—";
  }
}

/* ---------- design primitives ---------- */

function paymentTone(status: string | null | undefined) {
  const value = String(status || "").toUpperCase();

  if (["PAID", "SUCCESS", "COMPLETED", "SETTLED", "DELIVERED"].includes(value)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["PENDING", "AWAITING", "PROCESSING", "IN_PROGRESS"].includes(value)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (
    ["FAILED", "CANCELED", "CANCELLED", "REJECTED", "EXPIRED"].includes(value)
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-zinc-100 text-zinc-600 ring-zinc-200";
}

function StatusBadge({
  text,
  translated,
}: {
  text: string | null | undefined;
  translated: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${paymentTone(
        text
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {translated}
    </span>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string | number | null | undefined;
  strong?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-zinc-400">{label}</div>
      <div
        className={`mt-1 truncate text-sm ${
          strong ? "font-semibold text-zinc-900" : "text-zinc-700"
        }`}
        title={isEmpty ? undefined : String(value)}
      >
        {isEmpty ? "—" : value}
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ShipToggle({
  shipped,
  disabled,
  onChange,
}: {
  shipped: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shipped}
      aria-label="وضعیت ارسال"
      disabled={disabled}
      onClick={() => onChange(!shipped)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        shipped ? "bg-emerald-500" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          shipped ? "left-0.5" : "right-0.5"
        }`}
      />
    </button>
  );
}

/* ---------- helpers ---------- */

function getOrderNumber(order: { id: number; order_number: string | null }) {
  return order.order_number || String(order.id);
}

function getProductImageSrc(item: OrderItem) {
  return (
    item.product_image || item.main_image || "/images/placeholder-product.png"
  );
}

function AdminOrdersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderListItem[]>([]);
  const [orderProductNames, setOrderProductNames] = useState<
    Record<number, string>
  >({});

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [adminNoteDraft,setAdminNoteDraft]=useState("");
  const [openDetails, setOpenDetails] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (paymentStatus) {
      params.set("payment_status", paymentStatus);
    }

    return params.toString();
  }, [page, limit, paymentStatus]);

  function getOrderProductName(
    order: OrderListItem,
    productNames: Record<number, string> = orderProductNames
  ) {
    return order.first_product_name || productNames[order.id] || "";
  }

  function getOrderProductNameForDisplay(order: OrderListItem) {
    return getOrderProductName(order) || "…";
  }

  function applyClientFilters(
    list: OrderListItem[],
    value: string,
    selectedShippingStatus: string,
    productNames: Record<number, string> = orderProductNames
  ) {
    const normalizedValue = value.trim().toLowerCase();

    return list.filter((order) => {
      const matchesShippingStatus =
        !selectedShippingStatus ||
        (selectedShippingStatus === "SHIPPED" && order.status === "SHIPPED") ||
        (selectedShippingStatus === "NOT_SHIPPED" &&
          order.status !== "SHIPPED");

      if (!matchesShippingStatus) {
        return false;
      }

      if (!normalizedValue) {
        return true;
      }

      const orderNumber = getOrderNumber(order).toLowerCase();
      const customerName = (order.customer_name || "").toLowerCase();
      const customerMobile = getCustomerMobile(order).toLowerCase();
      const customerLandline = getCustomerLandline(order).toLowerCase();
      const normalizedSearchPhone = getComparablePhone(normalizedValue);
      const normalizedMobile = getComparablePhone(customerMobile);
      const normalizedLandline = getComparablePhone(customerLandline);
      const firstProductName = getOrderProductName(
        order,
        productNames
      ).toLowerCase();

      return (
        orderNumber.includes(normalizedValue) ||
        customerName.includes(normalizedValue) ||
        customerMobile.includes(normalizedValue) ||
        customerLandline.includes(normalizedValue) ||
        (normalizedSearchPhone !== "" &&
          (normalizedMobile.includes(normalizedSearchPhone) ||
            normalizedLandline.includes(normalizedSearchPhone))) ||
        firstProductName.includes(normalizedValue)
      );
    });
  }

  async function fetchOrderProductNames(list: OrderListItem[]) {
    const ordersWithoutProductName = list.filter(
      (order) => !order.first_product_name && !orderProductNames[order.id]
    );

    if (ordersWithoutProductName.length === 0) {
      setOrderProductNames((currentNames) => ({
        ...currentNames,
        ...Object.fromEntries(
          list
            .filter((order) => order.first_product_name)
            .map((order) => [order.id, order.first_product_name || ""])
        ),
      }));
      return;
    }

    const productNameEntries = await Promise.all(
      list.map(async (order): Promise<[number, string]> => {
        if (order.first_product_name) {
          return [order.id, order.first_product_name];
        }

        if (orderProductNames[order.id]) {
          return [order.id, orderProductNames[order.id]];
        }

        try {
          const response = await fetch(`/api/v1/orders/${order.id}`, {
            cache: "no-store",
          });

          const result: ApiDetailsResponse = await response.json();

          if (!response.ok || !result.success) {
            return [order.id, ""];
          }

          return [order.id, result.data.items[0]?.product_name || ""];
        } catch (error) {
          console.error(`خطا در دریافت نام محصول سفارش ${order.id}:`, error);
          return [order.id, ""];
        }
      })
    );

    setOrderProductNames((currentNames) => ({
      ...currentNames,
      ...Object.fromEntries(productNameEntries),
    }));
  }

  async function fetchOrders() {
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/orders?${query}`, {
        cache: "no-store",
      });

      const result: ApiListResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "خطا در دریافت سفارش‌ها");
      }

      setOrders(result.data.items);
      setFilteredOrders(
        applyClientFilters(result.data.items, search, shippingStatus)
      );

      setTotalPages(result.data.totalPages || 1);
      setTotal(result.data.total || 0);

      void fetchOrderProductNames(result.data.items);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderDetails(orderId: number) {
    setDetailsLoading(true);

    try {
      const response = await fetch(`/api/v1/orders/${orderId}`, {
        cache: "no-store",
      });

      const result: ApiDetailsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "خطا در دریافت جزئیات سفارش");
      }

      const details = result.data;
      const firstProductName = details.items[0]?.product_name || "";

      setSelectedOrder(details);
      setAdminNoteDraft(details.admin_notes||"");

      if (firstProductName) {
        setOrderProductNames((currentNames) => ({
          ...currentNames,
          [orderId]: firstProductName,
        }));
      }

      setOpenDetails(true);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "خطا در دریافت جزئیات سفارش"
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveAdminNote(){
    if(!selectedOrder||adminNoteDraft.length>1000)return;
    setActionLoading(true);
    try{
      const response=await fetch(`/api/v1/orders/${selectedOrder.id}`,{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({admin_notes:adminNoteDraft}),
      });
      const data=await response.json();
      if(!response.ok||!data.success)throw new Error(data.message||"ذخیره یادداشت ناموفق بود");
      await fetchOrderDetails(selectedOrder.id);
    }catch(e){alert(e instanceof Error?e.message:"ذخیره یادداشت ممکن نشد")}
    finally{setActionLoading(false)}
  }

  async function toggleOrderShipped(
    order: OrderListItem | OrderDetails,
    checked: boolean
  ) {
    const previousStatus = order.status;
    const nextStatus = checked ? "SHIPPED" : "PROCESSING";

    setActionLoading(true);

    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? { ...currentOrder, status: nextStatus }
          : currentOrder
      )
    );

    setFilteredOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? { ...currentOrder, status: nextStatus }
          : currentOrder
      )
    );

    if (selectedOrder?.id === order.id) {
      setSelectedOrder((currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              status: nextStatus,
              shipped_at:
                nextStatus === "SHIPPED"
                  ? currentOrder.shipped_at || new Date().toISOString()
                  : null,
            }
          : currentOrder
      );
    }

    try {
      const response = await fetch(`/api/v1/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({status: nextStatus}),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "خطا در تغییر وضعیت ارسال سفارش");
      }

      await fetchOrders();

      if (selectedOrder?.id === order.id) {
        await fetchOrderDetails(order.id);
      }
    } catch (error) {
      console.error(error);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: previousStatus }
            : currentOrder
        )
      );

      setFilteredOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: previousStatus }
            : currentOrder
        )
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder((currentOrder) =>
          currentOrder ? { ...currentOrder, status: previousStatus } : currentOrder
        );
      }

      alert(
        error instanceof Error
          ? error.message
          : "خطا در تغییر وضعیت ارسال سفارش"
      );
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    void fetchOrders();
  }, [query]);

  useEffect(() => {
    setFilteredOrders(
      applyClientFilters(orders, search, shippingStatus, orderProductNames)
    );
  }, [orders, search, shippingStatus, orderProductNames]);

  useEffect(() => {
    const openOrderParam = searchParams.get("openOrder");

    if (!openOrderParam) {
      return;
    }

    const orderId = Number(openOrderParam);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return;
    }

    void fetchOrderDetails(orderId);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("openOrder");

    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  // بستن شیت جزئیات با Escape
  useEffect(() => {
    if (!openDetails) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDetails(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openDetails]);

  // قفل اسکرول صفحه وقتی شیت باز است (مهم برای موبایل)
  useEffect(() => {
    if (!openDetails) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openDetails]);


 return (
  <div className="min-h-screen bg-zinc-50 text-zinc-900" dir="rtl">
    {/* ---------- Header ---------- */}
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold md:text-lg">
            سفارش‌ها
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {total} سفارش ثبت شده
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 md:hidden"
        >
          {showFilters ? "بستن فیلتر" : "فیلتر"}
        </button>
      </div>
    </header>

    <main className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
      {/* ---------- Filters ---------- */}
      <div
        className={`${
          showFilters ? "block" : "hidden"
        } mb-4 rounded-2xl border border-zinc-200 bg-white p-3 md:mb-6 md:block md:p-4`}
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12 md:gap-3">
          <div className="md:col-span-5">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
              placeholder="شماره سفارش، مشتری، موبایل یا محصول"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={paymentStatus}
              onChange={(event) => {
                setPage(1);
                setPaymentStatus(event.target.value);
              }}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
            >
              <option value="">وضعیت پرداخت: همه</option>
              {PAYMENT_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translatePaymentStatus(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={shippingStatus}
              onChange={(event) => {
                setPage(1);
                setShippingStatus(event.target.value);
              }}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
            >
              <option value="">وضعیت ارسال: همه</option>
              {SHIPPING_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateShippingStatus(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
              className="h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              جستجو
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Mobile / tablet list ---------- */}
      <div className="space-y-2.5 lg:hidden">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            در حال دریافت…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            سفارشی یافت نشد
          </div>
        ) : (
          filteredOrders.map((order) => {
            const shipped = order.status === "SHIPPED";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                {/* row 1: id + payment */}
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                  <span className="font-mono text-sm font-semibold tracking-tight">
                    {getOrderNumber(order)}
                  </span>
                  <StatusBadge
                    text={order.payment_record_status || order.payment_status}
                    translated={translatePaymentRecordStatus(
                      order.payment_record_status || order.payment_status
                    )}
                  />
                </div>

                {/* row 2: data */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-4 py-3.5">
                  <InfoRow label="مشتری" value={order.customer_name} />
                  <InfoRow
                    label="محصول"
                    value={getOrderProductNameForDisplay(order)}
                  />
                  <InfoRow
                    label="مبلغ"
                    value={`${formatPrice(order.total_amount)} تومان`}
                    strong
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-zinc-400">
                      ارسال
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ShipToggle
                        shipped={shipped}
                        disabled={actionLoading || order.payment_status!=="PAID" || !["SHIPPED","PROCESSING"].includes(order.status)}
                        onChange={(next) =>
                          void toggleOrderShipped(order, next)
                        }
                      />
                      <span
                        className={`text-sm ${
                          shipped ? "text-emerald-600" : "text-zinc-500"
                        }`}
                      >
                        {shipped ? "شده" : "نشده"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* row 3: actions */}
                <div className="flex items-stretch border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => void fetchOrderDetails(order.id)}
                    disabled={detailsLoading || actionLoading}
                    className="flex-1 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-40"
                  >
                    جزئیات
                  </button>
                  
                  
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ---------- Desktop table ---------- */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">شماره</th>
                <th className="px-5 py-3 font-medium">مشتری</th>
                <th className="px-5 py-3 font-medium">محصول</th>
                <th className="px-5 py-3 font-medium">پرداخت</th>
                <th className="px-5 py-3 font-medium">مبلغ</th>
                <th className="px-5 py-3 font-medium">ارسال</th>
                <th className="px-5 py-3 text-left font-medium">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    در حال دریافت…
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-zinc-500"
                  >
                    سفارشی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const shipped = order.status === "SHIPPED";

                  return (
                    <tr
                      key={order.id}
                      className="text-sm text-zinc-700 transition hover:bg-zinc-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono font-semibold text-zinc-900">
                        {getOrderNumber(order)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="max-w-[160px] truncate">
                          {order.customer_name || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          className="max-w-[220px] truncate text-zinc-600"
                          title={getOrderProductName(order) || undefined}
                        >
                          {getOrderProductNameForDisplay(order)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          text={
                            order.payment_record_status || order.payment_status
                          }
                          translated={translatePaymentRecordStatus(
                            order.payment_record_status || order.payment_status
                          )}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-zinc-900">
                        {formatPrice(order.total_amount)}
                        <span className="mr-1 text-xs font-normal text-zinc-400">
                          تومان
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ShipToggle
                            shipped={shipped}
                            disabled={actionLoading || order.payment_status!=="PAID" || !["SHIPPED","PROCESSING"].includes(order.status)}
                            onChange={(next) =>
                              void toggleOrderShipped(order, next)
                            }
                          />
                          <span
                            className={`whitespace-nowrap text-xs ${
                              shipped ? "text-emerald-600" : "text-zinc-400"
                            }`}
                          >
                            {shipped ? "شده" : "نشده"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void fetchOrderDetails(order.id)}
                            disabled={detailsLoading || actionLoading}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40"
                          >
                            جزئیات
                          </button>
                          
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Pagination ---------- */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          صفحه {page} از {totalPages}
        </p>

        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPage((currentPage) => Math.max(1, currentPage - 1))
            }
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
          >
            قبلی
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((currentPage) => Math.min(totalPages, currentPage + 1))
            }
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      </div>
    </main>

    {/* ---------- Details: bottom sheet on mobile, modal on desktop ---------- */}
    {openDetails && selectedOrder ? (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => setOpenDetails(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-zinc-50 sm:max-h-[88vh] sm:max-w-3xl sm:rounded-2xl"
        >
          {/* sheet header */}
          <div className="shrink-0 border-b border-zinc-200 bg-white">
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-mono text-sm font-semibold">
                    {getOrderNumber(selectedOrder)}
                  </h2>
                  <StatusBadge
                    text={
                      selectedOrder.payment_record_status ||
                      selectedOrder.payment_status
                    }
                    translated={translatePaymentRecordStatus(
                      selectedOrder.payment_record_status ||
                        selectedOrder.payment_status
                    )}
                  />
                </div>
                <p className="mt-1 truncate text-[11px] text-zinc-400">
                  ثبت: {formatDate(selectedOrder.created_at)} · پرداخت:{" "}
                  {formatDate(
                    selectedOrder.payment_paid_at || selectedOrder.paid_at
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenDetails(false)}
                aria-label="بستن"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* sheet body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {detailsLoading ? (
              <div className="px-4 py-16 text-center text-sm text-zinc-500">
                در حال دریافت جزئیات…
              </div>
            ) : (
              <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
                {/* amounts – most scanned, so first */}
                <Section title="مبالغ">
                  <div className="grid grid-cols-3 gap-3">
                    <InfoRow
                      label="تخفیف"
                      value={`${formatPrice(selectedOrder.discount_amount)}`}
                    />
                    <InfoRow
                      label="ارسال"
                      value={`${formatPrice(selectedOrder.shipping_amount)}`}
                    />
                    <InfoRow
                      label="مبلغ نهایی"
                      value={`${formatPrice(selectedOrder.total_amount)} تومان`}
                      strong
                    />
                  </div>
                </Section>

                {/* customer + address */}
                <Section title="مشتری و آدرس">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <InfoRow
                      label="نام"
                      value={selectedOrder.customer_name}
                      strong
                    />
                    <InfoRow
                      label="موبایل"
                      value={getCustomerMobile(selectedOrder)}
                    />
                    <InfoRow
                      label="تلفن ثابت"
                      value={getCustomerLandline(selectedOrder)}
                    />
                    <InfoRow
                      label="استان"
                      value={selectedOrder.shipping_province}
                    />
                    <InfoRow label="شهر" value={selectedOrder.shipping_city} />
                    <InfoRow
                      label="کد پستی"
                      value={selectedOrder.shipping_postal_code}
                    />
                    <InfoRow
                      label="پلاک"
                      value={selectedOrder.shipping_plaque}
                    />
                    <InfoRow
                      label="طبقه"
                      value={selectedOrder.shipping_floor}
                    />
                    <InfoRow label="واحد" value={selectedOrder.shipping_unit} />
                  </div>

                  <div className="mt-4 border-t border-zinc-100 pt-3">
                    <div className="text-[11px] font-medium text-zinc-400">
                      آدرس کامل
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-700">
                      {selectedOrder.shipping_address || "—"}
                    </p>
                  </div>
                </Section>

                {/* items */}
                <Section
                  title="محصولات"
                  action={
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                      {selectedOrder.items.length}
                    </span>
                  }
                >
                  {selectedOrder.items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      محصولی ثبت نشده است
                    </p>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {selectedOrder.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                            <Image
                              src={getProductImageSrc(item)}
                              alt={item.product_name || "product"}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="line-clamp-2 text-sm font-medium text-zinc-900">
                                {item.product_name || "—"}
                              </h4>
                              <span className="shrink-0 text-sm font-semibold text-zinc-900">
                                {formatPrice(
                                  item.line_total ?? item.total_price
                                )}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs text-zinc-500">
                              {item.quantity} ×{" "}
                              {formatPrice(item.unit_price)} تومان
                              {item.volume_ml ? ` · ${item.volume_ml} میل` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* note */}
                <Section title="یادداشت مشتری">
                  <p className="text-sm leading-6 text-zinc-700">
                    {selectedOrder.notes || "—"}
                  </p>
                </Section>
                <Section title="یادداشت داخلی مدیر">
                  <label className="block text-xs text-zinc-600 mb-2" htmlFor="admin-order-note">
                    یادداشت فقط برای مدیر نمایش داده می‌شود.
                  </label>
                  <textarea id="admin-order-note" value={adminNoteDraft} maxLength={1000}
                    onChange={e=>setAdminNoteDraft(e.target.value)}
                    className="w-full min-h-24 border border-zinc-200 rounded-lg bg-white p-3 text-sm outline-none focus:border-zinc-500"
                    placeholder="پیگیری ارسال، هماهنگی با مشتری و…"/>
                  <div className="flex justify-between items-center mt-2">
                    <small className="text-xs text-zinc-400">{adminNoteDraft.length} / 1000</small>
                    <button type="button" disabled={actionLoading || adminNoteDraft===(selectedOrder.admin_notes||"")}
                      onClick={()=>void saveAdminNote()} className="fst-btn fst-btn-primary disabled:opacity-40">ذخیره یادداشت</button>
                  </div>
                </Section>
              </div>
            )}
          </div>

          {/* sheet footer – sticky, reachable by thumb */}
          <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpenDetails(false)}
                className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                بستن
              </button>
              
            </div>
          </div>
        </div>
      </div>
    ) : null}
  </div>
);

}

export default function AdminOrdersPage() {
  return <Suspense fallback={<main role="status" className="p-8 text-center text-neutral-500">در حال بارگذاری…</main>}><AdminOrdersPageContent/></Suspense>;
}
