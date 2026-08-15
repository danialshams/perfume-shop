import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";
import { updateCustomerProfileSchema } from "@/server/validations/customer-account.validation";
import { customerAccountService } from "@/server/services/customer-account.service";
import { HttpError } from "@/server/utils/http-error";

function getErrorStatus(error: unknown, fallbackStatus: number) {
  if (error instanceof HttpError && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if (error instanceof HttpError && typeof error.status === "number") {
    return error.status;
  }

  return fallbackStatus;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomerAuth(request);

    const result = await customerAccountService.getProfile(Number(user.userId));

    return NextResponse.json(
      {
        success: true,
        message: "Profile fetched successfully",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getErrorStatus(error, 401);
    const message = getErrorMessage(error, "Get profile failed");

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireCustomerAuth(request);
    const body = await request.json();

    const parsed = updateCustomerProfileSchema.safeParse(body);

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

    const result = await customerAccountService.updateProfile(
      Number(user.userId),
      parsed.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getErrorStatus(error, 400);
    const message = getErrorMessage(error, "Update profile failed");

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }
}
