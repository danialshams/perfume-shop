import { errorResponse, successResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { scentFamilyService } from "@/server/services/scent-family.service";
import {
  createScentFamilySchema,
  scentFamilyListQuerySchema,
} from "@/server/validations/scent-family.validation";
import { NextRequest } from "next/server";

function getQueryObject(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

export async function GET(request: NextRequest) {
  try {
    const parsed = scentFamilyListQuerySchema.safeParse(
      getQueryObject(request),
    );

    if (!parsed.success) {
      return errorResponse(
        "Invalid scent family query parameters",
        400,
        parsed.error.flatten(),
      );
    }

    /**
     * API عمومی بدون پارامتر، فقط گروه‌های فعال را نمایش می‌دهد.
     *
     * برای پنل ادمین:
     * GET /api/v1/scent-families?is_active=1
     *
     * اگر بعداً لیست گروه‌های غیرفعال هم لازم شد،
     * یک Route ادمین جدا یا پارامتر include_inactive اضافه می‌کنیم.
     */
    const manage=request.nextUrl.searchParams.get("manage")==="1";
    if(manage){try{await requireAdmin(request)}catch{return errorResponse("ورود مدیر لازم است",403)}}
    const families = await scentFamilyService.getList({
      ...parsed.data,
      is_active: manage ? parsed.data.is_active : 1,
    });

    return successResponse(families, "Scent families fetched successfully");
  } catch (error: any) {
    return errorResponse("Failed to fetch scent families", 500, {
      message: error?.message ?? null,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const normalizedBody = {
      ...body,
      is_active:
        body.is_active === undefined
          ? true
          : body.is_active === true ||
              body.is_active === 1 ||
              body.is_active === "1" ||
              body.is_active === "true",
      sort_order:
        body.sort_order === undefined || body.sort_order === ""
          ? 0
          : Number(body.sort_order),
    };

    const parsed = createScentFamilySchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return errorResponse(
        "Invalid scent family data",
        400,
        parsed.error.flatten(),
      );
    }

    const family = await scentFamilyService.create(parsed.data);

    return successResponse(
      family,
      "Scent family created successfully",
      201,
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return errorResponse(
        "A scent family with this name already exists",
        409,
      );
    }

    return errorResponse("Failed to create scent family", 500, {
      message: error?.message ?? null,
    });
  }
}
