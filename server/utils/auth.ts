import { verifyAccessToken } from "@/server/utils/jwt";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  USER_ACCESS_COOKIE_NAME,
} from "../constants/auth";

export type AuthUser = {
  userId: number;
  email?: string;
  role?: "USER" | "ADMIN";
};

function getTokenFromCookie(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  );

  if (!tokenCookie) return null;

  return decodeURIComponent(tokenCookie.split("=")[1]);
}

function getTokenFromAuthorization(header: string | null) {
  if (!header) return null;

  if (!header.startsWith("Bearer ")) return null;

  return header.replace("Bearer ", "").trim();
}

function parseAndValidateToken(token: string): AuthUser {
  const payload = verifyAccessToken(token);

  const userId = Number(payload.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("توکن احراز هویت نامعتبر است.");
  }

  return {
    userId,
    email: payload.email,
    role: payload.role,
  };
}

// برای route های ادمین
export async function requireAdminAuth(request: Request): Promise<AuthUser> {
  const authorizationToken = getTokenFromAuthorization(
    request.headers.get("authorization"),
  );

  const cookieToken = getTokenFromCookie(
    request.headers.get("cookie"),
    ADMIN_ACCESS_COOKIE_NAME,
  );

  const token = authorizationToken || cookieToken;

  if (!token) {
    throw new Error("برای انجام این عملیات باید به عنوان ادمین وارد شوید.");
  }

  const user = parseAndValidateToken(token);

  if (user.role !== "ADMIN") {
    throw new Error("دسترسی غیرمجاز.");
  }

  return user;
}

// برای route های یوزر معمولی
export async function requireUserAuth(request: Request): Promise<AuthUser> {
  const authorizationToken = getTokenFromAuthorization(
    request.headers.get("authorization"),
  );

  const cookieToken = getTokenFromCookie(
    request.headers.get("cookie"),
    USER_ACCESS_COOKIE_NAME,
  );

  const token = authorizationToken || cookieToken;

  if (!token) {
    throw new Error("برای انجام این عملیات باید وارد حساب کاربری شوید.");
  }

  const user = parseAndValidateToken(token);

  if (user.role !== "USER") {
    throw new Error("دسترسی غیرمجاز.");
  }

  return user;
}
