"use client";

import type {
    Category,
    ScentFamily,
    UploadImageResult,
} from "@/lib/product";
import {
    Col,
    Divider,
    Empty,
    Form,
    Input,
    Radio,
    Row,
    Switch,
} from "antd";
import Image from "next/image";
import { useMemo } from "react";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";

type ProductBasicInfoFieldsProps = {
    categories?: Category[];
    scentFamilies?: ScentFamily[];

    isUploading: (key: string) => boolean;
    setImageUploading: (key: string, value: boolean) => void;
    uploadProductImage: (file: File) => Promise<UploadImageResult>;
    validateBeforeUpload: (file: File) => boolean | Promise<boolean>;
};

type ScentFamilyMode = "EXISTING" | "NEW";

export default function ProductBasicInfoFields({
    categories = [],
    scentFamilies = [],
    isUploading,
    setImageUploading,
    uploadProductImage,
    validateBeforeUpload,
}: ProductBasicInfoFieldsProps) {
    const form = Form.useFormInstance();

    const selectedParentCategoryId = Form.useWatch(
        "parent_category_id",
        form,
    );

    const selectedCategoryId = Form.useWatch("category_id", form);

    const scentFamilyMode =
        Form.useWatch("scent_family_mode", form) ?? "EXISTING";

    const selectedScentFamilyId = Form.useWatch("scent_family_id", form);

    const newScentFamilyImage = Form.useWatch(
        ["new_scent_family", "image_url"],
        form,
    );

    const parentCategories = useMemo(() => {
        return (categories ?? []).filter(
            (item) =>
                Array.isArray(item.parent_ids) &&
                item.parent_ids.length === 0,
        );
    }, [categories]);

    const childCategories = useMemo(() => {
        if (!selectedParentCategoryId) return [];

        return (categories ?? []).filter(
            (item) =>
                Array.isArray(item.parent_ids) &&
                item.parent_ids.includes(selectedParentCategoryId),
        );
    }, [categories, selectedParentCategoryId]);

    const activeScentFamilies = useMemo(() => {
        return (scentFamilies ?? []).filter((family) => {
            if (family.is_active === undefined || family.is_active === null) {
                return true;
            }

            return Boolean(family.is_active);
        });
    }, [scentFamilies]);

    const handleScentFamilyModeChange = (mode: ScentFamilyMode) => {
        if (mode === "EXISTING") {
            form.setFieldValue("new_scent_family", undefined);
            return;
        }

        form.setFieldValue("scent_family_id", undefined);
    };

    const handleSelectScentFamily = (familyId: number) => {
        form.setFieldValue("scent_family_id", familyId);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Item
                    label="نام محصول"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "نام محصول الزامی است",
                        },
                        {
                            validator: async (_, value) => {
                                if (!value) return;

                                if (String(value).trim().length < 2) {
                                    throw new Error(
                                        "نام محصول باید حداقل 2 کاراکتر باشد",
                                    );
                                }
                            },
                        },
                    ]}
                >
                    <Input size="large" placeholder="نام محصول" />
                </Form.Item>

                <Form.Item label="دسته‌بندی والد" name="parent_category_id">
                    <select
                        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
                        value={selectedParentCategoryId ?? ""}
                        onChange={(event) => {
                            const value = event.target.value
                                ? Number(event.target.value)
                                : undefined;

                            form.setFieldValue("parent_category_id", value);
                            form.setFieldValue("category_id", undefined);
                        }}
                    >
                        <option value="">انتخاب دسته‌بندی والد</option>

                        {parentCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </Form.Item>

                <Form.Item label="دسته‌بندی" name="category_id">
                    <select
                        className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
                        disabled={!selectedParentCategoryId}
                        value={selectedCategoryId ?? ""}
                        onChange={(event) => {
                            const value = event.target.value
                                ? Number(event.target.value)
                                : undefined;

                            form.setFieldValue("category_id", value);
                        }}
                    >
                        <option value="">
                            {selectedParentCategoryId
                                ? "انتخاب زیر‌دسته"
                                : "ابتدا دسته‌بندی والد را انتخاب کنید"}
                        </option>

                        {childCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    {selectedParentCategoryId &&
                        childCategories.length === 0 ? (
                        <div className="mt-1 text-xs text-neutral-400">
                            زیر‌دسته‌ای برای این دسته‌بندی پیدا نشد
                        </div>
                    ) : null}
                </Form.Item>

                <Form.Item
                    label="توضیحات کامل"
                    name="description"
                    className="md:col-span-2"
                    extra="می‌توانید تیتر، لیست، لینک، نقل‌قول، خط جداکننده، رنگ متن و تصویر داخل توضیحات اضافه کنید."
                >
                    <RichTextEditor
                        placeholder="توضیحات کامل محصول را وارد کنید..."
                        minHeight={340}
                        uploadImage={uploadProductImage}
                        validateBeforeUpload={validateBeforeUpload}
                    />
                </Form.Item>

                <Form.Item
                    label="ویژه"
                    name="is_featured"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="ویژه" unCheckedChildren="عادی" />
                </Form.Item>

                <Form.Item
                    label="پرفروش"
                    name="is_best_seller"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="پرفروش"
                        unCheckedChildren="عادی"
                    />
                </Form.Item>
            </div>

            <Divider className="!my-2">گروه بویایی</Divider>

            <Form.Item
                name="scent_family_mode"
                initialValue="EXISTING"
                className="!mb-4"
            >
                <Radio.Group
                    onChange={(event) =>
                        handleScentFamilyModeChange(event.target.value)
                    }
                >
                    <Radio value="EXISTING">
                        انتخاب از گروه‌های بویایی قبلی
                    </Radio>

                    <Radio value="NEW">ایجاد گروه بویایی جدید</Radio>
                </Radio.Group>
            </Form.Item>

            {scentFamilyMode === "EXISTING" ? (
                <Form.Item
                    label="گروه بویایی"
                    name="scent_family_id"
                    rules={[
                        {
                            required: true,
                            message: "انتخاب گروه بویایی الزامی است",
                        },
                    ]}
                >
                    {activeScentFamilies.length > 0 ? (
                        <Radio.Group className="w-full">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {activeScentFamilies.map((family) => {
                                    const isSelected =
                                        Number(selectedScentFamilyId) ===
                                        Number(family.id);

                                    return (
                                        <div
                                            key={family.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                handleSelectScentFamily(
                                                    Number(family.id),
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    handleSelectScentFamily(
                                                        Number(family.id),
                                                    );
                                                }
                                            }}
                                            className={[
                                                "group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-2 transition",
                                                "hover:border-blue-400 hover:shadow-md",
                                                isSelected
                                                    ? "border-blue-600 ring-2 ring-blue-100"
                                                    : "border-neutral-200",
                                            ].join(" ")}
                                        >
                                            <div className="absolute right-2 top-2 z-10">
                                                <Radio value={family.id} />
                                            </div>

                                            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                                                {family.image_url ? (
                                                    <Image
                                                        src={family.image_url}
                                                        alt={family.name}
                                                        fill
                                                        unoptimized
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                        className="object-cover transition duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                                                        بدون تصویر
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 min-h-10 text-center">
                                                <div
                                                    className={[
                                                        "line-clamp-2 text-sm font-medium",
                                                        isSelected
                                                            ? "text-blue-700"
                                                            : "text-neutral-800",
                                                    ].join(" ")}
                                                >
                                                    {family.name}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Radio.Group>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-8">
                            <Empty description="هنوز گروه بویایی ثبت نشده است" />
                        </div>
                    )}
                </Form.Item>
            ) : (
                <Row gutter={16}>
                    <Col xs={24} lg={14}>
                        <Form.Item
                            label="نام گروه بویایی جدید"
                            name={["new_scent_family", "name"]}
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "نام گروه بویایی جدید الزامی است",
                                },
                                {
                                    min: 2,
                                    message:
                                        "نام گروه بویایی باید حداقل 2 کاراکتر باشد",
                                },
                            ]}
                        >
                            <Input
                                size="large"
                                placeholder="مثلاً چوبی، گلی، شرقی یا مرکباتی"
                            />
                        </Form.Item>

                        <p className="text-xs leading-6 text-neutral-500">
                            این گروه فقط یک‌بار ساخته می‌شود و در محصولات بعدی
                            از لیست گروه‌های موجود قابل انتخاب خواهد بود.
                        </p>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Form.Item label="تصویر گروه بویایی جدید" required>
                            <ImageUploadField
                                value={newScentFamilyImage}
                                loading={isUploading("new_scent_family_image")}
                                previewAlt="تصویر گروه بویایی"
                                emptyTitle="آپلود تصویر گروه بویایی"
                                emptyDescription="فرمت‌های مجاز: jpg, jpeg, png, webp - حداکثر 5MB"
                                validateBeforeUpload={validateBeforeUpload}
                                onUpload={async (file) => {
                                    setImageUploading(
                                        "new_scent_family_image",
                                        true,
                                    );

                                    try {
                                        const result =
                                            await uploadProductImage(file);

                                        form.setFieldValue(
                                            ["new_scent_family", "image_url"],
                                            result.url,
                                        );
                                    } finally {
                                        setImageUploading(
                                            "new_scent_family_image",
                                            false,
                                        );
                                    }
                                }}
                                onRemove={() => {
                                    form.setFieldValue(
                                        ["new_scent_family", "image_url"],
                                        null,
                                    );
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name={["new_scent_family", "image_url"]}
                            hidden
                            rules={[
                                {
                                    required: scentFamilyMode === "NEW",
                                    message:
                                        "تصویر گروه بویایی جدید الزامی است",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            )}
        </div>
    );
}
