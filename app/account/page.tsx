// app/account/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";
import { verifyAccessToken } from "@/server/utils/jwt";
import { customerAuthService } from "@/server/services/customer-auth.service";
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
  // Never require a public base URL or make a localhost HTTP request on Vercel.
  // Resolve the current user against the service directly on the server.
  const token = (await cookies()).get(USER_ACCESS_COOKIE_NAME)?.value;
  let customerId: number | null = null;

  if (token) {
    try {
      const session = verifyAccessToken(token);
      if (session.role === "USER" && Number.isInteger(Number(session.userId)) && Number(session.userId) > 0) {
        customerId = Number(session.userId);
      }
    } catch {
      // Expired or invalid sessions should take the user to the login screen.
    }
  }

  if (!customerId) redirect("/login?redirect=%2Faccount");

  let customer: Awaited<ReturnType<typeof customerAuthService.me>>;
  try {
    customer = await customerAuthService.me(customerId);
  } catch {
    redirect("/login?redirect=%2Faccount");
  }

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
