// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/server/utils/jwt";
import {isFertiniPreviewGuestEnabled} from "@/server/admin-preview-guest";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  USER_ACCESS_COOKIE_NAME,
} from "@/server/constants/auth";

function verifyTokenWithRole(
  token: string | undefined,
  expectedRole: "USER" | "ADMIN",
) {
  if (!token) return false;

  try {
    const payload = verifyAccessToken(token);
    return payload.role === expectedRole;
  } catch {
    return false;
  }
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute =
    pathname === "/admin" || pathname === "/admin/login";

  // The /account route presents an in-page login/register gateway to guests.
  // Only flows that require a logged-in customer must be gated here.
  const protectedUserRoutes = ["/complete-profile"];
  const isProtectedUserRoute = protectedUserRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const userAuthPage = pathname === "/auth";

  if (isAdminRoute) {
    // First owner must be able to open the one-time setup screen without a session.
    // The POST API still requires the high-entropy server-only setup code.
    if (pathname === "/admin/setup" && process.env.FERTINI_BOOTSTRAP_TOKEN) {
      return NextResponse.next();
    }
    // Public shell navigation for the isolated preview branch only.
    // Admin data APIs remain separately protected by requireAdmin().
    if(isFertiniPreviewGuestEnabled())return NextResponse.next();

    const token = request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value;
    const validAdminToken = verifyTokenWithRole(token, "ADMIN");

    if (isAdminLoginRoute) {
      if (validAdminToken) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      const response = NextResponse.next();

      if (token && !validAdminToken) {
        clearCookie(response, ADMIN_ACCESS_COOKIE_NAME);
      }

      return response;
    }

    if (!validAdminToken) {
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("redirect", pathname + search);

      const response = NextResponse.redirect(loginUrl);

      if (token) {
        clearCookie(response, ADMIN_ACCESS_COOKIE_NAME);
      }

      return response;
    }

    return NextResponse.next();
  }

  if (userAuthPage) {
    const token = request.cookies.get(USER_ACCESS_COOKIE_NAME)?.value;
    const validUserToken = verifyTokenWithRole(token, "USER");

    if (validUserToken) {
      return NextResponse.redirect(new URL("/account", request.url));
    }

    const response = NextResponse.next();

    if (token && !validUserToken) {
      clearCookie(response, USER_ACCESS_COOKIE_NAME);
    }

    return response;
  }

  if (isProtectedUserRoute) {
    const token = request.cookies.get(USER_ACCESS_COOKIE_NAME)?.value;
    const validUserToken = verifyTokenWithRole(token, "USER");

    if (!validUserToken) {
      // پیدا کردن صفحه قبلی کاربر که از آن کلیک کرده است
      const referer = request.headers.get("referer");
      let fallbackUrl: URL;

      if (referer) {
        fallbackUrl = new URL(referer);
      } else {
        fallbackUrl = new URL("/", request.url);
      }

      // افزودن پارامتر باز شدن فرم لاگین به صفحه فعلی/قبلی
      fallbackUrl.searchParams.set("openLogin", "true");

      const response = NextResponse.redirect(fallbackUrl);

      if (token) {
        clearCookie(response, USER_ACCESS_COOKIE_NAME);
      }

      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth",
    "/complete-profile",
  ],
};
