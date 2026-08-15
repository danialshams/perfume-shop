import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/response";
import { addressService } from "@/server/services/address.service";
import { requireAuth } from "@/server/middlewares/auth";
import { createAddressSchema } from "@/server/validations/address.validation";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// GET /api/v1/addresses
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const addresses = await addressService.list(user.userId);

    return successResponse(addresses, "Addresses retrieved successfully");
  } catch (error: unknown) {
    return errorResponse(getErrorMessage(error, "Failed to retrieve addresses"), 400);
  }
}

// POST /api/v1/addresses
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body: unknown = await request.json();
    const validated = createAddressSchema.parse(body);

    const createdAddress = await addressService.create(user.userId, validated);

    return successResponse(createdAddress, "Address created successfully", 201);
  } catch (error: unknown) {
    return errorResponse(getErrorMessage(error, "Failed to create address"), 400);
  }
}
