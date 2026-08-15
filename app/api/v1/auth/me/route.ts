import { successResponse, errorResponse } from "@/lib/response";
import { authService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/middlewares/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const result = await authService.me(user.userId);
    return successResponse(result, "User profile");
  } catch (error: any) {
    return errorResponse(error?.message || "Unauthorized", 401);
  }
}
