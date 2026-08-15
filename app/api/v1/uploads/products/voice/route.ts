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
  console.log("===== /api/v1/uploads/products/voice CALLED =====");

  try {
    await requireAdmin(request);
    console.log("requireAdmin passed");

    const formData = await request.formData();
    console.log("formData keys:", Array.from(formData.keys()));

    const file = formData.get("file");

    console.log("file raw value:", file);
    console.log("file instanceof File:", file instanceof File);

    if (file instanceof File) {
      console.log("file details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    if (!file || !(file instanceof File)) {
      console.log("NO FILE or NOT instance of File -> 400");
      return errorResponse("فایل صوتی ارسال نشده است", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log("FILE TOO LARGE:", file.size, ">", MAX_FILE_SIZE);
      return errorResponse("حجم فایل بیشتر از حد مجاز است", 400, {
        maxFileSize: MAX_FILE_SIZE,
      });
    }

    const { valid, extension } = isAllowedAudioFile(file);
    console.log("isAllowedAudioFile result:", { valid, extension });

    if (!valid) {
      console.log("INVALID AUDIO FILE EXT OR MIME -> 400");
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

    console.log("uploadDir:", uploadDir);
    console.log("filePath:", filePath);

    if (!existsSync(uploadDir)) {
      console.log("uploadDir does NOT exist, creating...");
      await fs.mkdir(uploadDir, { recursive: true });
    } else {
      console.log("uploadDir already exists");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("writing file...");
    await fs.writeFile(filePath, buffer);
    console.log("file written successfully");

    const fileUrl = `/uploads/products/voices/${fileName}`;
    console.log("final fileUrl:", fileUrl);

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

    return errorResponse("آپلود فایل صوتی با خطا مواجه شد", 500, {
      message: error?.message ?? null,
      stack:
        process.env.NODE_ENV === "development" ? (error?.stack ?? null) : null,
    });
  }
}
