import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { scentFamilyService } from "@/server/services/scent-family.service";
import {
  scentFamilyIdParamSchema,
  updateScentFamilySchema,
} from "@/server/validations/scent-family.validation";
import { NextRequest } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

function normalizeBoolean(value: unknown, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return Boolean(value);
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const parsedParams = scentFamilyIdParamSchema.safeParse({ id });

    if (!parsedParams.success) {
      return errorResponse("Invalid scent family id", 400);
    }

    const family = await scentFamilyService.getById(
      Number(parsedParams.data.id),
    );

    if (!family) {
      return errorResponse("Scent family not found", 404);
    }

    return successResponse(family, "Scent family fetched successfully");
  } catch (error: any) {
    return errorResponse("Failed to fetch scent family", 500, {
      message: error?.message ?? null,
    });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;

    const parsedParams = scentFamilyIdParamSchema.safeParse({ id });

    if (!parsedParams.success) {
      return errorResponse("Invalid scent family id", 400);
    }

    const body = await request.json();

    const normalizedBody = {
      ...body,
      ...(body.is_active !== undefined
        ? { is_active: normalizeBoolean(body.is_active) }
        : {}),
      ...(body.sort_order !== undefined && body.sort_order !== ""
        ? { sort_order: Number(body.sort_order) }
        : {}),
    };

    const parsed = updateScentFamilySchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return errorResponse(
        "Invalid scent family data",
        400,
        parsed.error.flatten(),
      );
    }

    const family = await scentFamilyService.update(
      Number(parsedParams.data.id),
      parsed.data,
    );

    if (!family) {
      return errorResponse("Scent family not found", 404);
    }

    return successResponse(family, "Scent family updated successfully");
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return errorResponse(
        "A scent family with this name already exists",
        409,
      );
    }

    return errorResponse("Failed to update scent family", 500, {
      message: error?.message ?? null,
    });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;

    const parsedParams = scentFamilyIdParamSchema.safeParse({ id });

    if (!parsedParams.success) {
      return errorResponse("Invalid scent family id", 400);
    }

    const deleted = await scentFamilyService.delete(
      Number(parsedParams.data.id),
    );

    if (!deleted) {
      return errorResponse(
        "Scent family not found or it is currently used by products",
        409,
      );
    }

    return successResponse(
      { id: Number(parsedParams.data.id) },
      "Scent family deleted successfully",
    );
  } catch (error: any) {
    return errorResponse("Failed to delete scent family", 500, {
      message: error?.message ?? null,
    });
  }
}
