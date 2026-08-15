import { NextRequest, NextResponse } from "next/server";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";
import { updateCustomerPasswordSchema } from "@/server/validations/customer-account.validation";
import { customerAccountService } from "@/server/services/customer-account.service";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireCustomerAuth(request);
    const body = await request.json();
    const parsed = updateCustomerPasswordSchema.safeParse(body);

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

    await customerAccountService.updatePassword(
      Number(user.userId),
      parsed.data,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update password failed";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
