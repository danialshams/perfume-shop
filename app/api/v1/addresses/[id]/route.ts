import { successResponse, errorResponse } from "@/lib/response";
import { addressService } from "@/server/services/address.service";
import { updateAddressSchema } from "@/server/validations/address.validation";
import { NextRequest } from "next/server";
import { requireAuth } from "@/server/middlewares/auth";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseId(id: string): number {
  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid address id");
  }

  return parsed;
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const addressId = parseId(id);

    const address = await addressService.getById(user.userId, addressId);

    return successResponse(address, "Address fetched successfully");
  } catch (error: unknown) {
    return errorResponse(
      getErrorMessage(error, "Failed to fetch address"),
      400,
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const addressId = parseId(id);

    const body: unknown = await request.json();
    const validated = updateAddressSchema.parse(body);

    const result = await addressService.update(user.userId, addressId, validated);

    return successResponse(result, "Address updated successfully");
  } catch (error: unknown) {
    return errorResponse(
      getErrorMessage(error, "Failed to update address"),
      400,
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const addressId = parseId(id);

    await addressService.remove(user.userId, addressId);

    return successResponse(null, "Address deleted successfully");
  } catch (error: unknown) {
    return errorResponse(
      getErrorMessage(error, "Failed to delete address"),
      400,
    );
  }
}
