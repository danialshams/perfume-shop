import { verifyAccessToken } from "@/server/utils/jwt";

export type AuthUser = {
  userId: number;
  email?: string;
  role?: "USER" | "ADMIN";
};

const AUTH_COOKIE_NAMES = [
  "admin_access_token",
  "token",
  "accessToken",
  "authToken",
];

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookieName of AUTH_COOKIE_NAMES) {
    const tokenCookie = cookies.find((cookie) =>
      cookie.startsWith(`${cookieName}=`),
    );

    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split("=")[1]);
    }
  }

  return null;
}

function getTokenFromAuthorization(header: string | null) {
  if (!header) return null;

  if (!header.startsWith("Bearer ")) return null;

  return header.replace("Bearer ", "").trim();
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authorizationToken = getTokenFromAuthorization(
    request.headers.get("authorization"),
  );

  const cookieToken = getTokenFromCookie(request.headers.get("cookie"));

  const token = authorizationToken || cookieToken;

  if (!token) {
    throw new Error("برای انجام این عملیات باید وارد حساب کاربری شوید.");
  }

  try {
    const payload = verifyAccessToken(token);

    const userId = Number(payload.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error();
    }

    return {
      userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    throw new Error("توکن احراز هویت نامعتبر یا منقضی شده است.");
  }
}
