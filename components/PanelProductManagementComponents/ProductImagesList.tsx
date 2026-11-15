"use client";

import type { FormInstance } from "antd";
import { Button, Form, Input } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { uploadProductImage } from "@/lib/api";
import ImageUploadField from "./ImageUploadField";

type ProductImagesListProps = {
  form: FormInstance;
  validateBeforeUpload: (file: File) => boolean | Promise<boolean>;
  onUploadingChange?: (busy:boolean)=>void;
};

export default function ProductImagesList({
  form,
  validateBeforeUpload,
  onUploadingChange,
}: ProductImagesListProps) {
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});

  const setImageUploading = (key: string, value: boolean) => {
    setUploadingMap((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Form.List
      name="images"
      rules={[
        {
          validator: async (_, images) => {
            if (!images || images.length === 0 || !images.some((item: {image_url?:string}) => Boolean(item?.image_url?.trim()))) {
              throw new Error("حداقل یک تصویر برای محصول وارد کنید");
            }

            const hasMain = images.some((item: { is_main?: boolean; image_url?:string }) => Boolean(item?.is_main && item?.image_url?.trim()));

            if (!hasMain) {
              throw new Error("حداقل یک تصویر باید به عنوان تصویر اصلی انتخاب شود");
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-neutral-800">
              تصاویر محصول
            </h3>

            <Button
              icon={<Plus size={16} />}
              onClick={() =>
                add({
                  image_url: "",
                  is_main: fields.length === 0,
                })
              }
            >
              افزودن تصویر
            </Button>
          </div>

          <Form.ErrorList errors={errors} />

          {fields.map((field, index) => {
            const imageUrl = form.getFieldValue([
              "images",
              field.name,
              "image_url",
            ]);

            const uploadKey = `product-image-${field.key}`;
            const isUploading = Boolean(uploadingMap[uploadKey]);

            return (
              <div
                key={field.key}
                className="fst-image-item"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="font-medium text-neutral-700">
                    تصویر شماره {index + 1}
                  </div>

                  {fields.length > 1 && (
                    <Button
                      danger
                      type="text"
                      icon={<Trash2 size={16} />}
                      onClick={() => {
                        const currentImages =
                          form.getFieldValue("images") || [];

                        const removedItem = currentImages[field.name];
                        remove(field.name);

                        setTimeout(() => {
                          const nextImages = form.getFieldValue("images") || [];

                          if (
                            removedItem?.is_main &&
                            nextImages.length > 0 &&
                            !nextImages.some((item: any) => item?.is_main)
                          ) {
                            nextImages[0] = {
                              ...nextImages[0],
                              is_main: true,
                            };

                            form.setFieldValue("images", nextImages);
                          }
                        }, 0);
                      }}
                    >
                      حذف
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Item
                    className="md:col-span-2"
                    label="آپلود تصویر"
                    required
                  >
                    <Form.Item
                      name={[field.name, "image_url"]}
                      noStyle
                      rules={[
                        {
                          required: true,
                          message: "آپلود تصویر الزامی است",
                        },
                      ]}
                    >
                      <Input type="hidden" />
                    </Form.Item>

                    <ImageUploadField
                      value={imageUrl}
                      loading={isUploading}
                      previewAlt="product-preview"
                      emptyTitle="تصویر محصول را آپلود کنید"
                      successMessage="تصویر محصول با موفقیت آپلود شد"
                      errorMessage="آپلود تصویر محصول با خطا مواجه شد"
                      validateBeforeUpload={validateBeforeUpload}
                      onUpload={async (file) => {
                        try {
                          setImageUploading(uploadKey, true);
                          onUploadingChange?.(true);

                          const uploaded = await uploadProductImage(file);

                          form.setFieldValue(
                            ["images", field.name, "image_url"],
                            uploaded.url,
                          );

                          form.setFields([
                            {
                              name: ["images", field.name, "image_url"],
                              errors: [],
                            },
                          ]);
                        } finally {
                          setImageUploading(uploadKey, false);
                          onUploadingChange?.(false);
                        }
                      }}
                      onRemove={() => {
                        form.setFieldValue(
                          ["images", field.name, "image_url"],
                          "",
                        );

                        form.setFields([
                          {
                            name: ["images", field.name, "image_url"],
                            errors: [],
                          },
                        ]);
                      }}
                    />
                  </Form.Item>


                </div>
              </div>
            );
          })}


        </div>
      )}
    </Form.List>
  );
}
