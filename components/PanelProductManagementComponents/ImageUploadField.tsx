"use client";

import { Button, Upload, message } from "antd";
import type { UploadProps } from "antd";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type ImageUploadFieldProps = {
  value?: string;          // مقدار اولیه از بیرون (اختیاری)
  loading?: boolean;
  previewAlt?: string;

  emptyTitle?: string;
  emptyDescription?: string;

  selectButtonText?: string;
  changeButtonText?: string;
  removeButtonText?: string;

  successMessage?: string;
  errorMessage?: string;

  validateBeforeUpload: (file: File) => boolean | Promise<boolean>;
  onUpload: (file: File) => Promise<void>;  // بیرون فقط فرم را آپدیت می‌کند
  onRemove: () => void;                     // بیرون فقط فرم را خالی می‌کند
};

export default function ImageUploadField({
  value,
  loading = false,
  previewAlt = "preview",

  emptyTitle = "تصویر را آپلود کنید",
  emptyDescription = "فرمت‌های مجاز: jpg, jpeg, png, webp - حداکثر 5MB",

  selectButtonText = "انتخاب تصویر",
  changeButtonText = "تغییر تصویر",
  removeButtonText = "حذف عکس",

  successMessage = "تصویر با موفقیت آپلود شد",
  errorMessage = "آپلود تصویر با خطا مواجه شد",

  validateBeforeUpload,
  onUpload,
  onRemove,
}: ImageUploadFieldProps) {
  const [internalUrl, setInternalUrl] = useState<string | undefined>(value);

  useEffect(() => {
    setInternalUrl(value);
  }, [value]);

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      const isValid = await validateBeforeUpload(file as File);
      if (!isValid) {
        onError?.(new Error("فایل معتبر نیست"));
        return;
      }

      await onUpload(file as File);

      
      onSuccess?.({ ok: true });
      message.success(successMessage);
    } catch (error) {
      onError?.(error as Error);

      message.error(
        error instanceof Error ? error.message : errorMessage,
      );
    }
  };

  const handleRemove = () => {
    // اول state داخلی را خالی کن
    setInternalUrl(undefined);

    // بعد به parent خبر بده که فرم را خالی کند
    onRemove();
  };

  const hasImage = !!internalUrl;

  if (hasImage) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={internalUrl}
            alt={previewAlt}
            className="h-48 w-full rounded-xl object-cover"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Upload
            accept=".jpg,.jpeg,.png,.webp"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => validateBeforeUpload(file as File)}
            customRequest={customRequest}
          >
            <Button loading={loading} icon={<ImagePlus size={16} />}>
              {changeButtonText}
            </Button>
          </Upload>

          <Button
            danger
            icon={<Trash2 size={16} />}
            onClick={handleRemove}
          >
            {removeButtonText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
      <div className="mb-3 flex justify-center text-neutral-500">
        <ImagePlus size={28} />
      </div>

      <div className="mb-2 font-medium text-neutral-700">
        {emptyTitle}
      </div>

      <div className="mb-4 text-sm text-neutral-500">
        {emptyDescription}
      </div>

      <Upload
        accept=".jpg,.jpeg,.png,.webp"
        maxCount={1}
        showUploadList={false}
        beforeUpload={(file) => validateBeforeUpload(file as File)}
        customRequest={customRequest}
      >
        <Button
          size="large"
          type="default"
          loading={loading}
          icon={<ImagePlus size={16} />}
        >
          {selectButtonText}
        </Button>
      </Upload>
    </div>
  );
}
