"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LuxuryNavbar from "@/components/home-sections/navbar";
import LuxuryFooter from "@/components/home-sections/LuxuryFooter";
import { useCart } from "@/components/hooks/useCart";

type FormData = {
  first_name: string;
  last_name: string;
  phone: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor: string;
  unit: string;
  postal_code: string;
  notes: string;
  wants_register: boolean;
  password: string;
  confirm_password: string;
};

type FormErrors = Partial<Record<keyof FormData, string>> & {
  items?: string;
  general?: string;
};

type ToastType = "success" | "error";

type ToastState = {
  mounted: boolean;
  visible: boolean;
  message: string;
  type: ToastType;
};

type AuthStatus = "checking" | "authenticated" | "guest";

type CustomerProfileResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    first_name?: string | null;
    last_name?: string | null;
    mobile?: string | null;
    phone?: string | null;
    province?: string | null;
    city?: string | null;
    address?: string | null;
    plaque?: string | null;
    floor?: string | null;
    unit?: string | null;
    postal_code?: string | null;
    default_address?: {
      province?: string | null;
      city?: string | null;
      address?: string | null;
      plaque?: string | null;
      floor?: string | null;
      unit?: string | null;
      postal_code?: string | null;
    } | null;
  };
};

const initialForm: FormData = {
  first_name: "",
  last_name: "",
  phone: "",
  mobile: "",
  province: "",
  city: "",
  address: "",
  plaque: "",
  floor: "",
  unit: "",
  postal_code: "",
  notes: "",
  wants_register: false,
  password: "",
  confirm_password: "",
};

const iranMobileRegex = /^09\d{9}$/;
const postalCodeRegex = /^\d{10}$/;

const cardClass =
  "rounded-lg border border-black/[0.055] bg-white p-4 shadow-[0_14px_40px_rgba(36,34,31,0.04)] ring-1 ring-black/[0.018] sm:p-6";

const labelClass =
  "mb-2 block text-right text-[11.5px] font-light tracking-[-0.01em] text-[#77716a]";

const inputBaseClass =
  "luxury-checkout-input w-full rounded-md border bg-white px-3 py-2.5 text-[13px] font-light tracking-[-0.01em] text-[#33312e] outline-none transition-all duration-300 placeholder:text-[#b8b1a8] focus:border-[#5a554e] focus:shadow-[0_0_0_3px_rgba(70,67,61,0.055)] disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#aaa39a]";

function getLuxuryInputClass(hasError?: boolean, extra = "") {
  return [
    inputBaseClass,
    hasError
      ? "border-[#8a2f32]/35 bg-[#8a2f32]/[0.02]"
      : "border-black/[0.095] hover:border-black/[0.16]",
    extra,
  ].join(" ");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replace(/[^\d]/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

function sanitizeName(value: string) {
  return value
    .replace(/[0-9۰-۹!@#$%^&*()_=+\[\]{};:"\\|<>/?~`]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 50);
}

function sanitizeAddress(value: string) {
  return value.replace(/\s{3,}/g, " ").slice(0, 250);
}

function sanitizeSimpleText(value: string, maxLength = 20) {
  return value.replace(/[<>]/g, "").slice(0, maxLength);
}

function sanitizePassword(value: string) {
  return value.replace(/\s/g, "").slice(0, 100);
}

function normalizeMobileInput(value: string) {
  return onlyDigits(value, 11);
}

function normalizePhoneInput(value: string) {
  return onlyDigits(value, 20);
}

function normalizeForm(form: FormData): FormData {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone: form.phone.trim(),
    mobile: form.mobile.trim(),
    province: form.province.trim(),
    city: form.city.trim(),
    address: form.address.trim(),
    plaque: form.plaque.trim(),
    floor: form.floor.trim(),
    unit: form.unit.trim(),
    postal_code: form.postal_code.trim(),
    notes: form.notes.trim(),
    wants_register: form.wants_register,
    password: form.password,
    confirm_password: form.confirm_password,
  };
}

function buildFormFromCustomer(
  customer: NonNullable<CustomerProfileResponse["data"]>,
): FormData {
  const defaultAddress = customer.default_address;

  const mobile = String(customer.mobile ?? "").trim();
  const phone = String(customer.phone ?? "").trim() || mobile;

  return {
    ...initialForm,
    first_name: String(customer.first_name ?? "").trim(),
    last_name: String(customer.last_name ?? "").trim(),
    mobile,
    phone,
    province: String(defaultAddress?.province ?? customer.province ?? "").trim(),
    city: String(defaultAddress?.city ?? customer.city ?? "").trim(),
    address: String(defaultAddress?.address ?? customer.address ?? "").trim(),
    plaque: String(defaultAddress?.plaque ?? customer.plaque ?? "").trim(),
    floor: String(defaultAddress?.floor ?? customer.floor ?? "").trim(),
    unit: String(defaultAddress?.unit ?? customer.unit ?? "").trim(),
    postal_code: String(
      defaultAddress?.postal_code ?? customer.postal_code ?? "",
    ).trim(),
    notes: "",
    wants_register: false,
    password: "",
    confirm_password: "",
  };
}

async function parseApiResponse(res: Response) {
  const text = await res.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`پاسخ API معتبر نیست. کد وضعیت: ${res.status}`);
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-right text-[11px] font-light leading-5 text-[#8a2f32]">
      {message}
    </p>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const { cart, loading, isEmpty } = useCart();

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileForm, setProfileForm] = useState<FormData | null>(null);
  const [shipToDefaultAddress, setShipToDefaultAddress] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    mounted: false,
    visible: false,
    message: "",
    type: "success",
  });

  const toastHideTimerRef = useRef<number | null>(null);
  const toastUnmountTimerRef = useRef<number | null>(null);

  const isLoggedIn = authStatus === "authenticated";
  const isUsingDefaultAddress = isLoggedIn && shipToDefaultAddress;
  const lockReceiverFields = isUsingDefaultAddress;

  const cartItems = useMemo(() => cart?.items ?? [], [cart?.items]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item.unit_price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const checkoutItems = useMemo(() => {
    return cartItems.map((item) => {
      const rawItem = item as any;

      const productId = Number(
        rawItem.product_id ?? rawItem.productId ?? rawItem.id,
      );

      const rawVariantId =
        rawItem.variant_id ??
        rawItem.variantId ??
        rawItem.product_variant_id ??
        rawItem.productVariantId ??
        null;

      const variantId =
        rawVariantId === null ||
        rawVariantId === undefined ||
        rawVariantId === ""
          ? null
          : Number(rawVariantId);

      return {
        product_id: productId,
        variant_id:
          variantId !== null && Number.isInteger(variantId) && variantId > 0
            ? variantId
            : null,
        quantity: Number(item.quantity),
      };
    });
  }, [cartItems]);

  function showToast(message: string, type: ToastType) {
    if (toastHideTimerRef.current) {
      window.clearTimeout(toastHideTimerRef.current);
      toastHideTimerRef.current = null;
    }

    if (toastUnmountTimerRef.current) {
      window.clearTimeout(toastUnmountTimerRef.current);
      toastUnmountTimerRef.current = null;
    }

    setToast({
      mounted: true,
      visible: false,
      message,
      type,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast((prev) => ({ ...prev, visible: true }));
      });
    });

    toastHideTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);

    toastUnmountTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, mounted: false }));
    }, 3400);
  }

  useEffect(() => {
    return () => {
      if (toastHideTimerRef.current) {
        window.clearTimeout(toastHideTimerRef.current);
      }

      if (toastUnmountTimerRef.current) {
        window.clearTimeout(toastUnmountTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setProfileLoading(true);
      setAuthStatus("checking");

      try {
        const res = await fetch("/api/v1/customers/account/profile", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (cancelled) return;

        if (res.status === 401 || res.status === 403) {
          setAuthStatus("guest");
          setProfileForm(null);
          setShipToDefaultAddress(false);
          setForm((prev) => ({
            ...prev,
            wants_register: false,
            password: "",
            confirm_password: "",
          }));
          return;
        }

        const data = (await parseApiResponse(res)) as CustomerProfileResponse;

        if (!res.ok || data?.success === false || !data?.data) {
          setAuthStatus("guest");
          setProfileForm(null);
          setShipToDefaultAddress(false);
          return;
        }

        const nextProfileForm = buildFormFromCustomer(data.data);

        setAuthStatus("authenticated");
        setProfileForm(nextProfileForm);
        setShipToDefaultAddress(true);
        setForm(nextProfileForm);
        setErrors({});
      } catch {
        if (cancelled) return;

        setAuthStatus("guest");
        setProfileForm(null);
        setShipToDefaultAddress(false);
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange<K extends keyof FormData>(key: K, value: FormData[K]) {
    if (lockReceiverFields && key !== "notes") return;

    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
  }

  function handleToggleDefaultAddress(checked: boolean) {
    setShipToDefaultAddress(checked);
    setErrors({});

    if (checked && profileForm) {
      setForm((prev) => ({
        ...profileForm,
        notes: prev.notes,
        wants_register: false,
        password: "",
        confirm_password: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...initialForm,
      notes: prev.notes,
      wants_register: false,
      password: "",
      confirm_password: "",
    }));
  }

  function validateForm() {
    const normalized = normalizeForm(form);
    const nextErrors: FormErrors = {};

    if (!normalized.first_name) {
      nextErrors.first_name = "نام الزامی است";
    } else if (normalized.first_name.length < 2) {
      nextErrors.first_name = "نام باید حداقل ۲ کاراکتر باشد";
    }

    if (!normalized.last_name) {
      nextErrors.last_name = "نام خانوادگی الزامی است";
    } else if (normalized.last_name.length < 2) {
      nextErrors.last_name = "نام خانوادگی باید حداقل ۲ کاراکتر باشد";
    }

    if (!normalized.mobile) {
      nextErrors.mobile = "شماره همراه الزامی است";
    } else if (!iranMobileRegex.test(normalized.mobile)) {
      nextErrors.mobile = "شماره همراه باید ۱۱ رقم باشد و با 09 شروع شود";
    }

    if (!normalized.phone) {
      nextErrors.phone = "شماره تلفن ثابت الزامی است";
    } else if (normalized.phone.length > 20) {
      nextErrors.phone = "شماره تلفن ثابت بیش از حد مجاز است";
    }

    if (!normalized.province) {
      nextErrors.province = "استان الزامی است";
    }

    if (!normalized.city) {
      nextErrors.city = "شهر الزامی است";
    }

    if (!normalized.address) {
      nextErrors.address = "آدرس الزامی است";
    } else if (normalized.address.length < 10) {
      nextErrors.address = "آدرس باید حداقل ۱۰ کاراکتر باشد";
    }

    if (!normalized.plaque) {
      nextErrors.plaque = "پلاک الزامی است";
    }

    if (!normalized.floor) {
      nextErrors.floor = "طبقه الزامی است";
    } else if (normalized.floor.length > 20) {
      nextErrors.floor = "طبقه بیش از حد مجاز است";
    }

    if (!normalized.unit) {
      nextErrors.unit = "واحد الزامی است";
    } else if (normalized.unit.length > 20) {
      nextErrors.unit = "واحد بیش از حد مجاز است";
    }

    if (!normalized.postal_code) {
      nextErrors.postal_code = "کد پستی الزامی است";
    } else if (!postalCodeRegex.test(normalized.postal_code)) {
      nextErrors.postal_code = "کد پستی باید ۱۰ رقم باشد";
    }

    if (!isLoggedIn && normalized.wants_register) {
      if (!normalized.password) {
        nextErrors.password = "رمز عبور الزامی است";
      } else if (normalized.password.length < 6) {
        nextErrors.password = "رمز عبور باید حداقل ۶ کاراکتر باشد";
      }

      if (!normalized.confirm_password) {
        nextErrors.confirm_password = "تکرار رمز عبور الزامی است";
      } else if (normalized.password !== normalized.confirm_password) {
        nextErrors.confirm_password = "رمز عبور و تکرار آن یکسان نیستند";
      }
    }

    if (!checkoutItems.length) {
      nextErrors.items = "سبد خرید خالی است";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast("لطفاً خطاهای فرم را اصلاح کنید", "error");
      return false;
    }

    return true;
  }

  function extractApiError(result: any, fallback: string) {
    if (typeof result?.message === "string") return result.message;
    if (typeof result?.error === "string") return result.error;

    if (Array.isArray(result?.errors)) {
      return result.errors
        .map((error: unknown) => {
          if (typeof error === "string") return error;

          if (
            typeof error === "object" &&
            error !== null &&
            "message" in error
          ) {
            return String((error as { message: unknown }).message);
          }

          return JSON.stringify(error);
        })
        .join(" | ");
    }

    if (result?.errors && typeof result.errors === "object") {
      return Object.entries(result.errors)
        .map(([field, value]) => {
          const message = Array.isArray(value) ? value.join("، ") : String(value);
          return `${field}: ${message}`;
        })
        .join(" | ");
    }

    return fallback;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting || authStatus === "checking") return;

    const isValid = validateForm();

    if (!isValid) {
      setTimeout(() => {
        const firstError = document.querySelector("[data-field-error='true']");
        firstError?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);

      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const normalized = normalizeForm(form);
      const wantsRegister = !isLoggedIn && normalized.wants_register;

      const payload = {
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        phone: normalized.phone,
        mobile: normalized.mobile,
        province: normalized.province,
        city: normalized.city,
        address: normalized.address,
        plaque: normalized.plaque,
        floor: normalized.floor,
        unit: normalized.unit,
        postal_code: normalized.postal_code,
        notes: normalized.notes || null,
        wants_register: wantsRegister,
        password: wantsRegister ? normalized.password : undefined,
        confirm_password: wantsRegister ? normalized.confirm_password : undefined,
        items: checkoutItems,
      };

      const checkoutRes = await fetch("/api/v1/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const checkoutResult = await parseApiResponse(checkoutRes);

      if (!checkoutRes.ok || checkoutResult?.success === false) {
        throw new Error(
          extractApiError(
            checkoutResult,
            `ثبت سفارش ناموفق بود. کد وضعیت: ${checkoutRes.status}`,
          ),
        );
      }

      const checkoutData = checkoutResult?.data ?? checkoutResult;

      const orderId = Number(
        checkoutData?.order_id ?? checkoutData?.orderId ?? checkoutData?.id,
      );

      if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error("شناسه سفارش معتبر از سرور دریافت نشد");
      }

      showToast("سفارش ثبت شد؛ در حال انتقال به درگاه پرداخت...", "success");

      const paymentRes = await fetch("/api/v1/payment/request", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      const paymentResult = await parseApiResponse(paymentRes);

      if (!paymentRes.ok || paymentResult?.success === false) {
        throw new Error(
          extractApiError(
            paymentResult,
            `ایجاد درخواست پرداخت ناموفق بود. کد وضعیت: ${paymentRes.status}`,
          ),
        );
      }

      const paymentData = paymentResult?.data ?? paymentResult;

      const paymentUrl =
        paymentData?.payment_url ?? paymentData?.paymentUrl ?? paymentData?.url;

      if (typeof paymentUrl !== "string" || paymentUrl.trim().length === 0) {
        throw new Error("آدرس پرداخت از سرور دریافت نشد");
      }

      window.location.assign(paymentUrl);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "مشکلی در ثبت سفارش یا ایجاد درخواست پرداخت پیش آمد";

      setErrors((prev) => ({
        ...prev,
        general: message,
      }));

      showToast(message, "error");

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || profileLoading) {
    return (
      <>
        <LuxuryNavbar />
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 w-44 rounded bg-[#eeeae4]" />
              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4 rounded-lg border border-black/[0.055] bg-white p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-10 rounded bg-[#eeeae4]" />
                    <div className="h-28 rounded bg-[#eeeae4] sm:col-span-2" />
                  </div>
                </div>
                <div className="rounded-lg border border-black/[0.055] bg-white p-6">
                  <div className="h-64 rounded bg-[#eeeae4]" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <LuxuryFooter />
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        <LuxuryNavbar />
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-[22px] font-light tracking-[-0.04em] text-[#2f2d29]">
              سبد خرید شما خالی است
            </h1>
            <p className="mt-3 text-[13px] font-light leading-7 text-[#77716a]">
              برای ادامه فرایند نهایی‌سازی، ابتدا محصولی به سبد خرید اضافه
              کنید.
            </p>
            <button
              onClick={() => router.push("/cart")}
              className="mt-6 rounded-md bg-[#46433d] px-6 py-3 text-[12px] font-light text-white transition-all duration-300 hover:bg-[#34312d]"
            >
              بازگشت به سبد خرید
            </button>
          </div>
        </main>
        <LuxuryFooter />
      </>
    );
  }

  return (
    <>
      <LuxuryNavbar />

      {toast.mounted && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[140] flex justify-center px-4">
          <div
            className={[
              "pointer-events-auto min-w-[240px] max-w-[92vw] rounded-md border px-4 py-3 shadow-[0_14px_35px_rgba(0,0,0,0.08)] ring-1 transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              toast.type === "success"
                ? "border-[#52785d]/20 bg-white text-[#42634b] ring-[#52785d]/[0.05]"
                : "border-[#8a2f32]/20 bg-white text-[#7a262a] ring-[#8a2f32]/[0.05]",
              toast.visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
            ].join(" ")}
          >
            <p className="text-center text-[12px] font-light leading-7 tracking-[-0.01em]">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-white">
        <style jsx global>{`
          .luxury-checkout-input:-webkit-autofill,
          .luxury-checkout-input:-webkit-autofill:hover,
          .luxury-checkout-input:-webkit-autofill:focus,
          .luxury-checkout-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
            box-shadow: 0 0 0 1000px #ffffff inset !important;
            -webkit-text-fill-color: #33312e !important;
            caret-color: #33312e !important;
            transition: background-color 9999s ease-in-out 0s !important;
          }

          .luxury-checkout-input:disabled:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #fafafa inset !important;
            box-shadow: 0 0 0 1000px #fafafa inset !important;
            -webkit-text-fill-color: #aaa39a !important;
          }
        `}</style>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 text-right">
            <h1 className="text-[24px] font-light tracking-[-0.055em] text-[#2f2d29]">
              نهایی‌سازی سفارش
            </h1>
            <p className="mt-2 text-[13px] font-light leading-7 tracking-[-0.01em] text-[#77716a]">
              اطلاعات گیرنده و آدرس ارسال را وارد کنید.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <form onSubmit={handleSubmit} className={cardClass} noValidate>
              {errors.general && (
                <div className="mb-5 rounded-md border border-[#8a2f32]/15 bg-[#8a2f32]/[0.025] px-4 py-3 text-right text-[12px] font-light leading-7 text-[#7a262a]">
                  {errors.general}
                </div>
              )}

              {isLoggedIn && profileForm && (
                <div className="mb-5 rounded-md border border-[#52785d]/15 bg-[#52785d]/[0.025] p-4">
                  <label className="flex cursor-pointer items-center justify-start gap-3 text-right">
                    <input
                      type="checkbox"
                      checked={shipToDefaultAddress}
                      onChange={(e) => handleToggleDefaultAddress(e.target.checked)}
                      className="h-4 w-4 rounded border-black/[0.18] accent-[#46433d]"
                    />
                    <span className="text-[12.5px] font-light tracking-[-0.01em] text-[#4f4b45]">
                      می‌خواهم سفارش به آدرس خودم ارسال شود
                    </span>
                  </label>

                  <p className="mt-2 text-right text-[11.5px] font-light leading-6 text-[#8b847c]">
                    {shipToDefaultAddress
                      ? "اطلاعات حساب شما برای ارسال استفاده می‌شود. برای وارد کردن آدرس جدید، تیک را بردارید."
                      : "اکنون می‌توانید مشخصات و آدرس گیرنده را به صورت دستی وارد کنید."}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className={labelClass}>نام</label>
                  <input
                    type="text"
                    value={form.first_name}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("first_name", sanitizeName(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.first_name))}
                    placeholder="مثلاً محمد"
                    maxLength={50}
                    autoComplete="given-name"
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.first_name)}>
                    <FieldError message={errors.first_name} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>نام خانوادگی</label>
                  <input
                    type="text"
                    value={form.last_name}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("last_name", sanitizeName(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.last_name))}
                    placeholder="مثلاً رضایی"
                    maxLength={50}
                    autoComplete="family-name"
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.last_name)}>
                    <FieldError message={errors.last_name} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>شماره همراه</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.mobile}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("mobile", normalizeMobileInput(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.mobile))}
                    placeholder="09123456789"
                    pattern="09[0-9]{9}"
                    maxLength={11}
                    autoComplete="tel"
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.mobile)}>
                    <FieldError message={errors.mobile} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>تلفن ثابت</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.phone}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("phone", normalizePhoneInput(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.phone))}
                    placeholder="مثلاً 02112345678"
                    maxLength={20}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.phone)}>
                    <FieldError message={errors.phone} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>استان</label>
                  <input
                    type="text"
                    value={form.province}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("province", sanitizeName(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.province))}
                    placeholder="مثلاً تهران"
                    maxLength={50}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.province)}>
                    <FieldError message={errors.province} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>شهر</label>
                  <input
                    type="text"
                    value={form.city}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("city", sanitizeName(e.target.value))
                    }
                    className={getLuxuryInputClass(Boolean(errors.city))}
                    placeholder="مثلاً تهران"
                    maxLength={50}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.city)}>
                    <FieldError message={errors.city} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>کد پستی</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.postal_code}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("postal_code", onlyDigits(e.target.value, 10))
                    }
                    className={getLuxuryInputClass(Boolean(errors.postal_code))}
                    placeholder="۱۰ رقم"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.postal_code)}>
                    <FieldError message={errors.postal_code} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>پلاک</label>
                  <input
                    type="text"
                    value={form.plaque}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("plaque", sanitizeSimpleText(e.target.value, 20))
                    }
                    className={getLuxuryInputClass(
                      Boolean(errors.plaque),
                      "sm:max-w-[180px]",
                    )}
                    placeholder="مثلاً ۱۲"
                    maxLength={20}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.plaque)}>
                    <FieldError message={errors.plaque} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>طبقه</label>
                  <input
                    type="text"
                    value={form.floor}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("floor", sanitizeSimpleText(e.target.value, 20))
                    }
                    className={getLuxuryInputClass(
                      Boolean(errors.floor),
                      "sm:max-w-[180px]",
                    )}
                    placeholder="مثلاً ۳"
                    maxLength={20}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.floor)}>
                    <FieldError message={errors.floor} />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>واحد</label>
                  <input
                    type="text"
                    value={form.unit}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("unit", sanitizeSimpleText(e.target.value, 20))
                    }
                    className={getLuxuryInputClass(
                      Boolean(errors.unit),
                      "sm:max-w-[180px]",
                    )}
                    placeholder="مثلاً ۵"
                    maxLength={20}
                    dir="rtl"
                  />
                  <div data-field-error={Boolean(errors.unit)}>
                    <FieldError message={errors.unit} />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className={labelClass}>آدرس</label>
                  <textarea
                    value={form.address}
                    disabled={lockReceiverFields}
                    onChange={(e) =>
                      handleChange("address", sanitizeAddress(e.target.value))
                    }
                    rows={3}
                    maxLength={250}
                    className={getLuxuryInputClass(
                      Boolean(errors.address),
                      "min-h-[96px] resize-none leading-7",
                    )}
                    placeholder="آدرس کامل گیرنده"
                    dir="rtl"
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px]">
                    <div data-field-error={Boolean(errors.address)}>
                      <FieldError message={errors.address} />
                    </div>
                    <span className="shrink-0 font-light text-[#aaa39a]">
                      {form.address.length}/250
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className={labelClass}>یادداشت</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      handleChange("notes", sanitizeAddress(e.target.value))
                    }
                    rows={3}
                    maxLength={250}
                    className={getLuxuryInputClass(
                      Boolean(errors.notes),
                      "min-h-[96px] resize-none leading-7",
                    )}
                    placeholder="اگر توضیحی برای سفارش دارید اینجا بنویسید"
                    dir="rtl"
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px]">
                    <FieldError message={errors.notes} />
                    <span className="shrink-0 font-light text-[#aaa39a]">
                      {form.notes.length}/250
                    </span>
                  </div>
                </div>
              </div>

              {authStatus === "guest" && (
                <div className="mt-6 rounded-md border border-black/[0.055] bg-[#fafafa] p-4">
                  <label className="flex cursor-pointer items-center justify-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.wants_register}
                      onChange={(e) =>
                        handleChange("wants_register", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-black/[0.18] accent-[#46433d]"
                    />
                    <span className="text-[12.5px] font-light tracking-[-0.01em] text-[#4f4b45]">
                      می‌خواهم هم‌زمان ثبت‌نام هم انجام شود
                    </span>
                  </label>

                  {form.wants_register && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>رمز عبور</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) =>
                            handleChange("password", sanitizePassword(e.target.value))
                          }
                          className={getLuxuryInputClass(Boolean(errors.password))}
                          placeholder="حداقل ۶ کاراکتر"
                          minLength={6}
                          maxLength={100}
                          autoComplete="new-password"
                          dir="rtl"
                        />
                        <div data-field-error={Boolean(errors.password)}>
                          <FieldError message={errors.password} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>تکرار رمز عبور</label>
                        <input
                          type="password"
                          value={form.confirm_password}
                          onChange={(e) =>
                            handleChange(
                              "confirm_password",
                              sanitizePassword(e.target.value),
                            )
                          }
                          className={getLuxuryInputClass(
                            Boolean(errors.confirm_password),
                          )}
                          placeholder="تکرار رمز عبور"
                          minLength={6}
                          maxLength={100}
                          autoComplete="new-password"
                          dir="rtl"
                        />
                        <div data-field-error={Boolean(errors.confirm_password)}>
                          <FieldError message={errors.confirm_password} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errors.items && (
                <div className="mt-5 rounded-md border border-[#8a2f32]/15 bg-[#8a2f32]/[0.025] px-4 py-3 text-right text-[12px] font-light leading-7 text-[#7a262a]">
                  {errors.items}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting || authStatus === "checking"}
                  className={[
                    "inline-flex items-center justify-center rounded-md px-6 py-3 text-[12px] font-light tracking-[-0.01em] transition-all duration-300",
                    submitting || authStatus === "checking"
                      ? "cursor-not-allowed border border-black/[0.08] bg-white text-[#b1aaa1] shadow-none"
                      : "bg-[#46433d] text-white shadow-[0_10px_26px_rgba(70,67,61,0.16)] hover:bg-[#34312d] hover:shadow-[0_12px_30px_rgba(52,49,45,0.2)] active:scale-[0.99]",
                  ].join(" ")}
                >
                  {submitting ? "در حال انتقال به درگاه..." : "ثبت سفارش"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="inline-flex items-center justify-center rounded-md border border-black/[0.095] bg-white px-6 py-3 text-[12px] font-light tracking-[-0.01em] text-[#4f4b45] transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafafa]"
                >
                  بازگشت به سبد خرید
                </button>
              </div>
            </form>

            <aside className={`${cardClass} h-fit lg:sticky lg:top-24`}>
              <h2 className="text-right text-[16px] font-light tracking-[-0.035em] text-[#2f2d29]">
                خلاصه سفارش
              </h2>

              <div className="mt-5 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b border-black/[0.055] pb-4"
                  >
                    <div className="min-w-0 flex-1 text-right">
                      <p className="line-clamp-2 text-[13px] font-light leading-6 text-[#3d3a35]">
                        {(item as any).title || "محصول"}
                      </p>
                      <p className="mt-1 text-[11.5px] font-light text-[#8b847c]">
                        تعداد: {Number(item.quantity).toLocaleString("fa-IR")}
                      </p>
                    </div>

                    <div className="shrink-0 text-left text-[12.5px] font-light text-[#2f2d29]">
                      {formatPrice(
                        Number(item.unit_price || 0) *
                          Number(item.quantity || 0),
                      )}{" "}
                      تومان
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-black/[0.055] pt-5 text-[12.5px] font-light">
                <div className="flex items-center justify-between text-[#77716a]">
                  <span>{totalQuantity.toLocaleString("fa-IR")}</span>
                  <span>تعداد کل</span>
                </div>

                <div className="flex items-center justify-between text-[#77716a]">
                  <span>{formatPrice(subtotal)} تومان</span>
                  <span>جمع سبد خرید</span>
                </div>

                <div className="flex items-center justify-between pt-2 text-[14px] text-[#2f2d29]">
                  <span>{formatPrice(subtotal)} تومان</span>
                  <span>مبلغ قابل پرداخت</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </>
  );
}
export default function CheckoutPage() {
  return <Suspense fallback={<main className="ql-shop min-h-screen p-10 text-center text-[#8a8176]" role="status">در حال آماده‌سازی تسویه‌حساب…</main>}><CheckoutPageContent /></Suspense>;
}
