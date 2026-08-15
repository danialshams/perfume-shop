import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const CATEGORY_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "categories",
);

export async function saveCategoryImage(file: File) {
  if (!file || file.size <= 0) {
    return null;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("حجم تصویر نباید بیشتر از ۵ مگابایت باشد");
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];

  if (!extension) {
    throw new Error(
      "فرمت تصویر معتبر نیست. فرمت‌های مجاز: jpg, png, webp, gif",
    );
  }

  await mkdir(CATEGORY_UPLOAD_DIR, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const fullPath = path.join(CATEGORY_UPLOAD_DIR, fileName);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(fullPath, buffer);

  return `/uploads/categories/${fileName}`;
}

export async function deletePublicUpload(publicUrl?: string | null) {
  if (!publicUrl) return;

  /**
   * فقط اجازه حذف فایل‌های همین مسیر را می‌دهیم
   * تا اشتباهی فایل‌های دیگر پروژه حذف نشوند.
   */
  if (!publicUrl.startsWith("/uploads/categories/")) {
    return;
  }

  const fileName = path.basename(publicUrl);

  const fullPath = path.join(CATEGORY_UPLOAD_DIR, fileName);

  if (!fullPath.startsWith(CATEGORY_UPLOAD_DIR)) {
    return;
  }

  try {
    await unlink(fullPath);
  } catch {
    /**
     * اگر فایل وجود نداشت، خطا نده.
     */
  }
}
