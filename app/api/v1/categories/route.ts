import { successResponse, errorResponse } from "@/lib/response";
import { categoryService } from "@/server/services/category.service";
import { createCategorySchema } from "@/server/validations/category.validation";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/middlewares/admin";
import {
  categoryPayloadFromFormData,
  getCategoryImageFile,
} from "@/server/utils/category-form";
import { deletePublicUpload, saveCategoryImage } from "@/server/utils/upload";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await categoryService.getAll();
    return successResponse(categories, "Categories fetched");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";

    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  let uploadedImageUrl: string | null = null;

  try {
    await requireAdmin(request);

    const contentType = request.headers.get("content-type") || "";

    let payload: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const imageFile = getCategoryImageFile(formData);

      if (imageFile) {
        uploadedImageUrl = await saveCategoryImage(imageFile);
      }

      payload = categoryPayloadFromFormData(formData, uploadedImageUrl);
    } else {
      /**
       * برای سازگاری با حالت JSON قبلی.
       * ولی در حالت جدید بهتر است از FormData استفاده کنی.
       */
      const body = await request.json();

      payload = {
        ...body,
        image_url: body.image_url === "" ? null : body.image_url,
        parent_ids: Array.isArray(body.parent_ids)
          ? body.parent_ids.map(Number)
          : body.parent_ids,
      };
    }

    const validated = createCategorySchema.parse(payload);

    const result = await categoryService.create(validated);

    return successResponse(result, "Category created", 201);
  } catch (error: unknown) {
    if (uploadedImageUrl) {
      await deletePublicUpload(uploadedImageUrl);
    }

    const message =
      error instanceof Error ? error.message : "Failed to create category";

    return errorResponse(message, 400);
  }
}
