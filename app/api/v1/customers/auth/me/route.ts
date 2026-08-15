// app/api/v1/customers/auth/me/route.ts
import { NextRequest } from "next/server";
import { requireCustomerAuth } from "@/server/middlewares/customer-auth";
import { customerAuthService } from "@/server/services/customer-auth.service";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomerAuth(request);
    const result = await customerAuthService.me(Number(user.userId));

    return NextResponse.json(
      {
        success: true,
        message: "Customer profile",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 },
    );
  }
}
