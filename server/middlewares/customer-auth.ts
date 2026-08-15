// server/middlewares/customer-auth.ts
import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/server/utils/jwt";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";

export async function requireCustomerAuth(request: NextRequest) {
  const token = request.cookies.get(USER_ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifyAccessToken(token);

  if (!payload || payload.role !== "USER") {
    throw new Error("Unauthorized");
  }

  return payload;
}
