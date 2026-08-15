import { NextResponse } from "next/server";
import { customerRegisterSchema } from "@/server/validations/customer-auth.validation";
import { customerAuthService } from "@/server/services/customer-auth.service";
import { USER_ACCESS_COOKIE_NAME } from "@/server/constants/auth";
import { getErrorMessage, getErrorStatus } from "@/server/utils/http-error";

const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اطلاعات وارد شده معتبر نیست",
          errors: parsed.error.issues,
        },
        { status: 422 },
      );
    }

    const result = await customerAuthService.register(parsed.data);

    const response = NextResponse.json(
      {
        success: true,
        message: "ثبت نام با موفقیت انجام شد",
        data: {
          customer: result.customer,
        },
      },
      { status: 201 },
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
    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error, "ثبت نام ناموفق بود"),
      },
      { status: getErrorStatus(error, 400) },
    );
  }
}
