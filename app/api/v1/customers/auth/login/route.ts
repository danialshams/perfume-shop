// app/api/v1/customers/auth/login/route.ts
import { NextResponse } from "next/server";
import { customerLoginSchema } from "@/server/validations/customer-auth.validation";
import { customerAuthService } from "@/server/services/customer-auth.service";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";

const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: parsed.error.issues,
        },
        { status: 422 },
      );
    }

    const result = await customerAuthService.login(parsed.data);

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          customer: result.customer,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: USER_ACCESS_COOKIE_NAME,
      value: result.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 },
    );
  }
}
