"use client";

import type { FormInstance } from "antd";
import { Button, Card, Form, Input, InputNumber, Switch } from "antd";
import { Plus, Trash2 } from "lucide-react";
import ImageUploadField from "./ImageUploadField";

type ProductVariantsListProps = {
    form: FormInstance;
    productType: "SINGLE" | "GROUPED";
    isUploading: (key: string) => boolean;
    setImageUploading: (key: string, value: boolean) => void;
    uploadProductImage: (file: File) => Promise<{ url: string }>;
    validateBeforeUpload: (file: File) => boolean | Promise<boolean>;
};

export default function ProductVariantsList({
    form,
    productType,
    isUploading,
    setImageUploading,
    uploadProductImage,
    validateBeforeUpload,
}: ProductVariantsListProps) {
    const isSingle = productType === "SINGLE";

    return (
        <Form.List name="variants">
            {(fields, { add, remove }) => {
                const renderFields = isSingle ? fields.slice(0, 1) : fields;

                return (
                    <div className="space-y-4">
                        {renderFields.map((field, index) => (
                            <div key={field.key} className="fst-variant-item">
                              {!isSingle&&<div className="fst-variant-heading">
                                <strong>حجم {index+1}</strong>
                                {fields.length>1&&<Button danger type="text" icon={<Trash2 size={15}/>}
                                  onClick={()=>remove(field.name)}>حذف</Button>}
                              </div>}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Form.Item
                                        label="حجم (میلی‌لیتر)"
                                        name={[field.name, "volume_ml"]}
                                        rules={[
                                            {
                                                validator: async (_, value) => {
                                                    if (
                                                        value === undefined ||
                                                        value === null ||
                                                        value === ""
                                                    ) {
                                                        return;
                                                    }

                                                    if (Number(value) <= 0) {
                                                        throw new Error("حجم باید بیشتر از صفر باشد");
                                                    }
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            size="large"
                                            min={1}
                                            className="w-full"
                                            placeholder="مثلاً 100"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="قیمت"
                                        name={[field.name, "price"]}
                                        rules={[
                                            { required: true, message: "قیمت الزامی است" },
                                            {
                                                validator: async (_, value) => {
                                                    if (
                                                        value === undefined ||
                                                        value === null ||
                                                        value === ""
                                                    ) {
                                                        throw new Error("قیمت الزامی است");
                                                    }

                                                    if (Number(value) < 0) {
                                                        throw new Error("قیمت نمی‌تواند منفی باشد");
                                                    }
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber size="large" min={0} className="w-full" />
                                    </Form.Item>

                                    <Form.Item
                                        label="قیمت با تخفیف"
                                        name={[field.name, "discount_price"]}
                                        rules={[
                                            {
                                                validator: async (_, value) => {
                                                    if (
                                                        value === undefined ||
                                                        value === null ||
                                                        value === ""
                                                    ) {
                                                        return;
                                                    }

                                                    if (Number(value) < 0) {
                                                        throw new Error("قیمت با تخفیف نمی‌تواند منفی باشد");
                                                    }
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber size="large" min={0} className="w-full" />
                                    </Form.Item>

                                    <Form.Item
                                        label="موجودی"
                                        name={[field.name, "stock_qty"]}
                                        rules={[
                                            { required: true, message: "موجودی الزامی است" },
                                            {
                                                validator: async (_, value) => {
                                                    if (
                                                        value === undefined ||
                                                        value === null ||
                                                        value === ""
                                                    ) {
                                                        throw new Error("موجودی الزامی است");
                                                    }

                                                    if (
                                                        !Number.isInteger(Number(value)) ||
                                                        Number(value) < 0
                                                    ) {
                                                        throw new Error(
                                                            "موجودی باید عدد صحیح صفر یا بیشتر باشد",
                                                        );
                                                    }
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber size="large" min={0} className="w-full" />
                                    </Form.Item>

                                    {!isSingle ? (
                                        <div className="md:col-span-2">
                                            <div className="rounded-2xl border border-neutral-200 p-4">
                                                <div className="mb-4 text-base font-semibold">
                                                    تصاویر واریانت
                                                </div>

                                                <Form.List name={[field.name, "images"]}>
                                                    {(
                                                        imageFields,
                                                        {
                                                            add: addVariantImage,
                                                            remove: removeVariantImage,
                                                        },
                                                    ) => (
                                                        <div className="space-y-4">
                                                            {imageFields.map((imageField, imageIndex) => {
                                                                const uploadKey = `variant-${field.key}-image-${imageField.key}`;
                                                                const loading = isUploading(uploadKey);

                                                                const imageUrl: string =
                                                                    form.getFieldValue([
                                                                        "variants",
                                                                        field.name,
                                                                        "images",
                                                                        imageField.name,
                                                                        "image_url",
                                                                    ]) || "";

                                                                return (
                                                                    <Card
                                                                        key={imageField.key}
                                                                        size="small"
                                                                        title={`تصویر واریانت ${imageIndex + 1}`}
                                                                        extra={
                                                                            imageFields.length > 1 ? (
                                                                                <Button
                                                                                    danger
                                                                                    type="text"
                                                                                    icon={<Trash2 size={16} />}
                                                                                    onClick={() =>
                                                                                        removeVariantImage(imageField.name)
                                                                                    }
                                                                                >
                                                                                    حذف
                                                                                </Button>
                                                                            ) : null
                                                                        }
                                                                    >
                                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                            <div className="md:col-span-2">
                                                                                <ImageUploadField
                                                                                    key={
                                                                                        imageUrl ||
                                                                                        `empty-${imageField.key}`
                                                                                    }
                                                                                    value={imageUrl}
                                                                                    loading={loading}
                                                                                    previewAlt="variant-preview"
                                                                                    emptyTitle="تصویر واریانت را آپلود کنید"
                                                                                    successMessage="تصویر واریانت با موفقیت آپلود شد"
                                                                                    errorMessage="آپلود تصویر واریانت با خطا مواجه شد"
                                                                                    validateBeforeUpload={
                                                                                        validateBeforeUpload
                                                                                    }
                                                                                    onUpload={async (file) => {
                                                                                        try {
                                                                                            setImageUploading(
                                                                                                uploadKey,
                                                                                                true,
                                                                                            );

                                                                                            const uploaded =
                                                                                                await uploadProductImage(file);

                                                                                            form.setFieldValue(
                                                                                                [
                                                                                                    "variants",
                                                                                                    field.name,
                                                                                                    "images",
                                                                                                    imageField.name,
                                                                                                    "image_url",
                                                                                                ],
                                                                                                uploaded.url,
                                                                                            );

                                                                                            form.setFields([
                                                                                                {
                                                                                                    name: [
                                                                                                        "variants",
                                                                                                        field.name,
                                                                                                        "images",
                                                                                                        imageField.name,
                                                                                                        "image_url",
                                                                                                    ],
                                                                                                    errors: [],
                                                                                                },
                                                                                            ]);
                                                                                        } finally {
                                                                                            setImageUploading(
                                                                                                uploadKey,
                                                                                                false,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    onRemove={() => {
                                                                                        form.setFieldValue(
                                                                                            [
                                                                                                "variants",
                                                                                                field.name,
                                                                                                "images",
                                                                                                imageField.name,
                                                                                                "image_url",
                                                                                            ],
                                                                                            "",
                                                                                        );

                                                                                        form.setFields([
                                                                                            {
                                                                                                name: [
                                                                                                    "variants",
                                                                                                    field.name,
                                                                                                    "images",
                                                                                                    imageField.name,
                                                                                                    "image_url",
                                                                                                ],
                                                                                                errors: [],
                                                                                            },
                                                                                        ]);
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            <Form.Item
                                                                                label="آدرس تصویر"
                                                                                name={[imageField.name, "image_url"]}
                                                                                hidden
                                                                                rules={[
                                                                                    {
                                                                                        required: true,
                                                                                        message:
                                                                                            "آپلود تصویر واریانت الزامی است",
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Input />
                                                                            </Form.Item>

                                                                           
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            <Button
                                                                block
                                                                icon={<Plus size={16} />}
                                                                onClick={() =>
                                                                    addVariantImage({
                                                                        image_url: "",
                                                                        is_main: imageFields.length === 0,
                                                                    })
                                                                }
                                                            >
                                                                افزودن تصویر برای این واریانت
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Form.List>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </Card>
                        ))}

                        {!isSingle ? (
                            <Button
                                block
                                icon={<Plus size={16} />}
                                onClick={() =>
                                    add({
                                        volume_ml: 100,
                                        price: 0,
                                        discount_price: null,
                                        stock_qty: 0,
                                        is_active: true,
                                        images: [
                                            {
                                                image_url: "",
                                                is_main: true,
                                            },
                                        ],
                                    })
                                }
                            >
                                افزودن واریانت
                            </Button>
                        ) : null}
                    </div>
                );
            }}
        </Form.List>
    );
}
