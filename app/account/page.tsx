// app/account/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AccountClientWrapper from "./AccountClientWrapper";
import { ProfileForm } from "@/components/account/utils";

type AddressPayload = {
  province?: string | null;
  city?: string | null;
  address?: string | null;
  plaque?: string | null;
  floor?: string | number | null;
  unit?: string | number | null;
  postal_code?: string | number | null;
  postalcode?: string | number | null;
  postal?: string | number | null;
  phone?: string | number | null;
  landline?: string | number | null;
  tel?: string | number | null;
  telephone?: string | number | null;
};

type CustomerProfileResponse = {
  success: boolean;
  message?: string;
  data?: {
    first_name?: string | null;
    last_name?: string | null;
    mobile?: string | null;
    postal_code?: string | number | null;
    phone?: string | number | null;
    landline?: string | number | null;
    telephone?: string | number | null;
    default_address?: AddressPayload | null;
    addresses?: AddressPayload[] | null;
  };
};

/** مقدار را به رشتهٔ تمیز تبدیل می‌کند؛ null و undefined و NaN را خالی می‌کند */
function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

/** اولین مقدار غیرخالی از میان کاندیدها */
function firstFilled(...values: unknown[]): string {
  for (const value of values) {
    const normalized = str(value);
    if (normalized) return normalized;
  }
  return "";
}

export default async function AccountPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const cookieHeader = allCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const res = await fetch(`${baseUrl}/api/v1/customers/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/auth");
  }

  const result: CustomerProfileResponse = await res.json();

  if (!res.ok || result.success === false || !result.data) {
    throw new Error(result.message || "خطا در دریافت اطلاعات حساب");
  }

  const customer = result.data;

  // آدرس پیش‌فرض؛ اگر نبود، اولین آدرس موجود
  const address: AddressPayload =
    customer.default_address ?? customer.addresses?.[0] ?? {};

  const initialProfileData: ProfileForm = {
    first_name: str(customer.first_name),
    last_name: str(customer.last_name),
    mobile: str(customer.mobile),
    province: str(address.province),
    city: str(address.city),
    address: str(address.address),
    plaque: str(address.plaque),
    floor: str(address.floor),
    unit: str(address.unit),

    // کد پستی و تلفن ثابت ممکن است روی آدرس یا روی خود مشتری برگردند
    postal_code: firstFilled(
      address.postal_code,
      address.postalcode,
      address.postal,
      customer.postal_code,
    ),
    phone: firstFilled(
      address.phone,
      address.landline,
      address.tel,
      address.telephone,
      customer.phone,
      customer.landline,
      customer.telephone,
    ),
  };

  return <AccountClientWrapper initialData={initialProfileData} />;
}
