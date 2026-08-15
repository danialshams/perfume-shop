import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

import { requireAdmin } from "@/server/middlewares/admin";
import { errorResponse, successResponse } from "@/lib/response";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function sanitizeBaseName(fileName: string) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);

  return base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse("فایل تصویر ارسال نشده است", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("فرمت فایل مجاز نیست", 400, {
        allowedTypes: ALLOWED_TYPES,
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("حجم فایل بیشتر از حد مجاز است", 400, {
        maxFileSize: MAX_FILE_SIZE,
      });
    }

    const extension = getExtensionFromMimeType(file.type);

    if (!extension) {
      return errorResponse("پسوند فایل قابل تشخیص نیست", 400);
    }

    const safeBaseName = sanitizeBaseName(file.name) || "product-image";
    const fileName = `${Date.now()}-${safeBaseName}${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    const filePath = path.join(uploadDir, fileName);

    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/products/${fileName}`;

    return successResponse(
      {
        url: fileUrl,
        file_name: fileName,
        size: file.size,
        mime_type: file.type,
      },
      "تصویر محصول با موفقیت آپلود شد",
      201,
    );
  } catch (error: any) {
    console.error("POST /api/v1/uploads/products error:", error);

    return errorResponse("آپلود تصویر با خطا مواجه شد", 500, {
      message: error?.message ?? null,
      stack:
        process.env.NODE_ENV === "development" ? (error?.stack ?? null) : null,
    });
  }
}
