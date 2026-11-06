import { Suspense } from "react";
import { cookies } from "next/headers";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";
import { verifyAccessToken } from "@/server/utils/jwt";
import CartClient from "./CartClient";

export const metadata = {
  title: "سبد خرید | FERTINI",
  description: "مرور عطرهای انتخاب‌شده و ادامه خرید از FERTINI",
};

export default async function CartPage() {
  let isAuthenticated=false;
  const token=(await cookies()).get(USER_ACCESS_COOKIE_NAME)?.value;
  if(token){try{isAuthenticated=verifyAccessToken(token).role==="USER";}catch{isAuthenticated=false;}}
  return <div className="ql-shop maison-cart min-h-screen">
    <Suspense fallback={<div className="ql-container py-20 text-center text-[#8a8176]" role="status">در حال آماده‌سازی سبد خرید…</div>}>
      <CartClient isAuthenticated={isAuthenticated} />
    </Suspense>
  </div>;
}
