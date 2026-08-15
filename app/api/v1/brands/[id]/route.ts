import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/server/middlewares/admin";
import { brandService } from "@/server/services/brand.service";
import { updateBrandSchema } from "@/server/validations/brand.validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);

    const { id } = await context.params;
    const brandId = Number(id);

    if (!Number.isInteger(brandId) || brandId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه برند نامعتبر است",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const validated = updateBrandSchema.parse(body);

    const brand = await brandService.update(brandId, {
      name: validated.name,
      description:
        validated.description === ""
          ? null
          : (validated.description ?? undefined),
      logo_url:
        validated.logo_url === "" ? null : (validated.logo_url ?? undefined),
      country:
        validated.country === "" ? null : (validated.country ?? undefined),
      is_active: validated.is_active,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Brand updated successfully",
        data: brand,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("PATCH /api/v1/brands/[id] error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update brand",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);

    const { id } = await context.params;
    const brandId = Number(id);

    if (!Number.isInteger(brandId) || brandId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "شناسه برند نامعتبر است",
        },
        { status: 400 },
      );
    }

    await brandService.delete(brandId);

    return NextResponse.json(
      {
        success: true,
        message: "Brand deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("DELETE /api/v1/brands/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete brand",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
