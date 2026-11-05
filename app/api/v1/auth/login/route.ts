import { NextResponse } from "next/server";
import { loginSchema } from "@/server/validations/auth.validation";
import { authService } from "@/server/services/auth.service";

const ADMIN_COOKIE_NAME = "admin_access_token";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const result = await authService.login(parsed.data);

    if (result.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Admins only.",
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    const isInvalidLogin = error instanceof Error && (error.message === "Invalid credentials" || error.message === "Your account is inactive");
    if (!isInvalidLogin) console.error("Admin login failed:", error);
    return NextResponse.json(
      { success: false, message: isInvalidLogin ? "اطلاعات ورود نامعتبر است" : "خطا در ورود. لطفاً دوباره تلاش کنید." },
      { status: isInvalidLogin ? 401 : 500 },
    );
  }
}
