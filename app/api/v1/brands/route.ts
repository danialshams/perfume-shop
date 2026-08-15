import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { brandService } from "@/server/services/brand.service";
import { createBrandSchema } from "@/server/validations/brand.validation";
import { requireAdmin } from "@/server/middlewares/admin";

export async function GET() {
  try {
    const brands = await brandService.getAll();

    return NextResponse.json(
      {
        success: true,
        message: "Brands fetched successfully",
        data: brands,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/brands error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch brands",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const validated = createBrandSchema.parse(body);

    const brand = await brandService.create({
      name: validated.name,
      description: validated.description ?? null,
      logo_url: validated.logo_url ?? null,
      country: validated.country ?? null,
      is_active: validated.is_active ?? 1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully",
        data: brand,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST /api/v1/brands error:", error);

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
        message: "Failed to create brand",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
