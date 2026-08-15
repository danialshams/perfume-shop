import { registerSchema } from "@/server/validations/auth.validation";
import { authService } from "@/server/services/auth.service";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    const result = await authService.register(validated);
    return successResponse(result, "Register successful", 201);
  } catch (error: any) {
    return errorResponse(error?.message || "Register failed", 400);
  }
}