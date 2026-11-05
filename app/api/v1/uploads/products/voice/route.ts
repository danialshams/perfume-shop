import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

import { requireAdmin } from "@/server/middlewares/admin";
import { errorResponse, successResponse } from "@/lib/response";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".ogg",
  ".oga",
  ".m4a",
  ".aac",
  ".flac",
  ".webm",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".opus",
  ".3gp",
  ".amr",
  ".aiff",
  ".aif",
  ".caf",
  ".wma",
]);

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

function getSafeExtension(fileName: string) {
  const ext = path
    .extname(fileName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

  return ext;
}

function isAllowedAudioFile(file: File) {
  const extension = getSafeExtension(file.name);
  const mimeType = (file.type || "").toLowerCase();

  if (mimeType.startsWith("audio/")) {
    return {
      valid: true,
      extension: extension || ".bin",
    };
  }

  if (ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
    return {
      valid: true,
      extension,
    };
  }

  return {
    valid: false,
    extension,
  };
}

export async function POST(request: NextRequest) {

  try {
    await requireAdmin(request);
    if ((process.env.NODE_ENV === "production" || process.env.VERCEL === "1")) {
      return errorResponse("آپلود فایل صوتی تا اتصال فضای ذخیره‌سازی دائمی فعال نیست.", 503);
    }

    const formData = await request.formData();

    const file = formData.get("file");


    if (file instanceof File) {

    }

    if (!file || !(file instanceof File)) {

      return errorResponse("فایل صوتی ارسال نشده است", 400);
    }

    if (file.size > MAX_FILE_SIZE) {

      return errorResponse("حجم فایل بیشتر از حد مجاز است", 400, {
        maxFileSize: MAX_FILE_SIZE,
      });
    }

    const { valid, extension } = isAllowedAudioFile(file);

    if (!valid) {

      return errorResponse("فرمت فایل صوتی مجاز نیست", 400, {
        allowedExtensions: Array.from(ALLOWED_AUDIO_EXTENSIONS),
        mimeType: file.type || null,
      });
    }

    const safeBaseName = sanitizeBaseName(file.name) || "product-voice";
    const safeExtension = extension || ".bin";
    const fileName = `${Date.now()}-${safeBaseName}${safeExtension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      "voices",
    );
    const filePath = path.join(uploadDir, fileName);


    if (!existsSync(uploadDir)) {

      await fs.mkdir(uploadDir, { recursive: true });
    } else {

    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/products/voices/${fileName}`;

    return successResponse(
      {
        url: fileUrl,
        file_name: fileName,
        size: file.size,
        mime_type: file.type || null,
      },
      "فایل صوتی محصول با موفقیت آپلود شد",
      201,
    );
  } catch (error: any) {
    console.error("POST /api/v1/uploads/products/voice error:", error);

    return errorResponse("آپلود فایل صوتی با خطا مواجه شد", 500);
  }
}
