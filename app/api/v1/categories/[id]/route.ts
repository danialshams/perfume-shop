import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/response";
import { requireAdmin } from "@/server/middlewares/admin";
import { categoryService } from "@/server/services/category.service";
import { updateCategorySchema } from "@/server/validations/category.validation";
import {
  categoryPayloadFromFormData,
  getCategoryImageFile,
  shouldRemoveCategoryImage,
} from "@/server/utils/category-form";
import { deletePublicUpload, saveCategoryImage } from "@/server/utils/upload";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse("شناسه دسته‌بندی نامعتبر است", 400);
    }

    const category = await categoryService.getById(categoryId);
    return successResponse(category, "Category fetched");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch category";

    return errorResponse(message, 400);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  let uploadedImageUrl: string | null = null;

  try {
    await requireAdmin(request);

    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse("شناسه دسته‌بندی نامعتبر است", 400);
    }

    const existingCategory = await categoryService.getById(categoryId);
    const oldImageUrl = existingCategory.image_url;

    const contentType = request.headers.get("content-type") || "";

    let payload: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const imageFile = getCategoryImageFile(formData);
      const removeImage = shouldRemoveCategoryImage(formData);

      let imageValue: string | null | undefined = undefined;

      if (imageFile) {
        uploadedImageUrl = await saveCategoryImage(imageFile);
        imageValue = uploadedImageUrl;
      } else if (removeImage) {
        imageValue = null;
      }

      payload = categoryPayloadFromFormData(formData, imageValue);
    } else {
      /**
       * برای سازگاری با حالت JSON قبلی.
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

    const validated = updateCategorySchema.parse(payload);

    const result = await categoryService.update(categoryId, validated);

    /**
     * اگر تصویر جدید آپلود شده باشد، تصویر قبلی حذف شود.
     */
    if (uploadedImageUrl && oldImageUrl && oldImageUrl !== uploadedImageUrl) {
      await deletePublicUpload(oldImageUrl);
    }

    /**
     * اگر کاربر خواست تصویر حذف شود.
     */
    if (!uploadedImageUrl && validated.image_url === null && oldImageUrl) {
      await deletePublicUpload(oldImageUrl);
    }

    return successResponse(result, "Category updated");
  } catch (error: unknown) {
    /**
     * اگر آپلود انجام شد ولی ذخیره دیتابیس شکست خورد،
     * فایل جدید را پاک می‌کنیم.
     */
    if (uploadedImageUrl) {
      await deletePublicUpload(uploadedImageUrl);
    }

    const message =
      error instanceof Error ? error.message : "Failed to update category";

    return errorResponse(message, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return errorResponse("شناسه دسته‌بندی نامعتبر است", 400);
    }

    const existingCategory = await categoryService.getById(categoryId);

    const result = await categoryService.remove(categoryId);

    if (existingCategory.image_url) {
      await deletePublicUpload(existingCategory.image_url);
    }

    return successResponse(result, "Category deleted");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete category";

    return errorResponse(message, 400);
  }
}
