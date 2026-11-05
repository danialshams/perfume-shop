"use client";

import { createProduct, uploadProductImage } from "@/lib/api";
import { getScentFamilies } from "@/lib/product";
import type { ScentFamily } from "@/lib/product";
import { toSlug } from "@/lib/utils";
import { Button, Card, Drawer, Form, Radio } from "antd";
import { useEffect, useState } from "react";
import ProductBasicInfoFields from "./ProductBasicInfoFields";
import ProductImagesList from "./ProductImagesList";
import ProductVariantsList from "./ProductVariantsList";
import VoiceUploader from "./VoiceUploader";

type ProductType = "SINGLE" | "GROUPED";

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    categories: any[];
};

export default function CreateProductDrawer({
    open,
    onClose,
    onSuccess,
    categories,
}: Props) {
    const [form] = Form.useForm();

    const [selectedType, setSelectedType] = useState<ProductType | null>(null);
    const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);

    const [scentFamilies, setScentFamilies] = useState<ScentFamily[]>([]);
    const [loadingScentFamilies, setLoadingScentFamilies] = useState(false);

    useEffect(() => {
        if (!open) {
            form.resetFields();
            setSelectedType(null);
            setUploadingMap({});
            setSubmitting(false);
            setScentFamilies([]);
            setLoadingScentFamilies(false);
        }
    }, [open, form]);

    useEffect(() => {
        if (!open) return;

        let ignore = false;

        async function loadScentFamilies() {
            setLoadingScentFamilies(true);

            try {
                const data = await getScentFamilies();

                if (!ignore) {
                    setScentFamilies(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to load scent families:", error);

                if (!ignore) {
                    setScentFamilies([]);
                }
            } finally {
                if (!ignore) {
                    setLoadingScentFamilies(false);
                }
            }
        }

        loadScentFamilies();

        return () => {
            ignore = true;
        };
    }, [open]);

    const isUploading = (key: string) => Boolean(uploadingMap[key]);

    const setImageUploading = (key: string, value: boolean) => {
        setUploadingMap((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const validateBeforeUpload = (file: File) => {
        const isValidType = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
        ].includes(file.type);

        const isValidSize = file.size <= 5 * 1024 * 1024;

        if (!isValidType) {
            throw new Error("فرمت فایل تصویر مجاز نیست");
        }

        if (!isValidSize) {
            throw new Error("حجم تصویر بیشتر از حد مجاز است");
        }

        return true;
    };

    const validateVoiceBeforeUpload = (file: File) => {
        const isValidSize = file.size <= 20 * 1024 * 1024;

        if (!isValidSize) {
            throw new Error("حجم فایل صوتی بیشتر از حد مجاز است");
        }

        return true;
    };

    const normalizeVariants = (variants: any[], type: ProductType) => {
        if (type === "SINGLE") {
            const firstVariant =
                Array.isArray(variants) && variants.length > 0
                    ? variants[0]
                    : {};

            return [
                {
                    volume_ml:
                        firstVariant?.volume_ml === "" ||
                            firstVariant?.volume_ml === undefined ||
                            firstVariant?.volume_ml === null
                            ? null
                            : Number(firstVariant.volume_ml),

                    price: Number(firstVariant?.price ?? 0),

                    discount_price:
                        firstVariant?.discount_price === "" ||
                            firstVariant?.discount_price === undefined ||
                            firstVariant?.discount_price === null
                            ? null
                            : Number(firstVariant.discount_price),

                    stock_qty: Number(firstVariant?.stock_qty ?? 0),

                    is_active:
                        firstVariant?.is_active === undefined
                            ? true
                            : Boolean(firstVariant.is_active),

                    images: [],
                },
            ];
        }

        return Array.isArray(variants)
            ? variants.map((variant: any) => ({
                volume_ml:
                    variant?.volume_ml === "" ||
                        variant?.volume_ml === undefined ||
                        variant?.volume_ml === null
                        ? null
                        : Number(variant.volume_ml),

                price: Number(variant?.price ?? 0),

                discount_price:
                    variant?.discount_price === "" ||
                        variant?.discount_price === undefined ||
                        variant?.discount_price === null
                        ? null
                        : Number(variant.discount_price),

                stock_qty: Number(variant?.stock_qty ?? 0),

                is_active:
                    variant?.is_active === undefined
                        ? true
                        : Boolean(variant.is_active),

                images: Array.isArray(variant?.images)
                    ? variant.images.filter((image: any) => image?.image_url)
                    : [],
            }))
            : [];
    };

    const buildInitialVariants = (type: ProductType) => {
        if (type === "SINGLE") {
            return [
                {
                    volume_ml: 100,
                    price: 0,
                    discount_price: null,
                    stock_qty: 0,
                    is_active: true,
                    images: [],
                },
            ];
        }

        return [
            {
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
            },
        ];
    };

    const handleSelectType = (type: ProductType) => {
        setSelectedType(type);

        form.setFieldsValue({
            type,
            status: "ACTIVE",
            is_active: true,
            is_featured: false,
            is_best_seller: false,

            scent_family_mode: "EXISTING",
            scent_family_id: undefined,
            new_scent_family: undefined,

            images: [
                {
                    image_url: "",
                    is_main: true,
                },
            ],

            variants: buildInitialVariants(type),
        });
    };

    const handleBackToTypeSelection = () => {
        setSelectedType(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        if (!selectedType) return;

        const values = await form.validateFields();

        setSubmitting(true);

        try {
            const categoryLinks =
                values.parent_category_id && values.category_id
                    ? [
                        {
                            parent_id: Number(values.parent_category_id),
                            child_id: Number(values.category_id),
                        },
                    ]
                    : [];

            const {
                scent_family_mode,
                scent_family_id,
                new_scent_family,
                ...restValues
            } = values;

            const payload = {
                ...restValues,

                type: selectedType,
                slug: toSlug(values.name || ""),

                category_id: values.category_id ?? null,
                parent_category_id: values.parent_category_id ?? null,
                category_links: categoryLinks,

                scent_family_id:
                    scent_family_mode === "EXISTING"
                        ? scent_family_id
                            ? Number(scent_family_id)
                            : null
                        : null,

                new_scent_family:
                    scent_family_mode === "NEW"
                        ? {
                            name: String(
                                new_scent_family?.name ?? "",
                            ).trim(),
                            image_url: String(
                                new_scent_family?.image_url ?? "",
                            ).trim(),
                        }
                        : undefined,

                images: Array.isArray(values.images)
                    ? values.images.filter((item: any) => item?.image_url)
                    : [],

                variants: normalizeVariants(
                    values.variants || [],
                    selectedType,
                ),
            };
          
            await createProduct(payload);

            form.resetFields();
            setSelectedType(null);

            onSuccess?.();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="ایجاد محصول"
            width={1000}
            destroyOnClose
            placement="left"
        >
            {!selectedType ? (
                <div className="mx-auto max-w-2xl py-10">
                    <div className="mb-6 text-center">
                        <h3 className="text-xl font-bold">
                            نوع محصول را انتخاب کنید
                        </h3>
                    </div>

                    <Radio.Group
                        className="w-full"
                        onChange={(e) => handleSelectType(e.target.value)}
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Card
                                hoverable
                                className="cursor-pointer rounded-2xl"
                                onClick={() => handleSelectType("SINGLE")}
                            >
                                <Radio value="SINGLE" className="mb-3" />

                                <div className="text-lg font-semibold">
                                    محصول تکی
                                </div>
                            </Card>

                            <Card
                                hoverable
                                className="cursor-pointer rounded-2xl"
                                onClick={() => handleSelectType("GROUPED")}
                            >
                                <Radio value="GROUPED" className="mb-3" />

                                <div className="text-lg font-semibold">
                                    محصول گروهی
                                </div>
                            </Card>
                        </div>
                    </Radio.Group>
                </div>
            ) : (
                <Form form={form} layout="vertical">
                    <ProductBasicInfoFields
                        categories={categories}
                        scentFamilies={scentFamilies}
                        isUploading={isUploading}
                        setImageUploading={setImageUploading}
                        uploadProductImage={uploadProductImage}
                        validateBeforeUpload={validateBeforeUpload}
                    />

                    {loadingScentFamilies ? (
                        <div className="mb-4 text-xs text-neutral-500">
                            در حال دریافت گروه‌های بویایی...
                        </div>
                    ) : null}

                    <VoiceUploader
                        form={form}
                        validateBeforeUpload={validateVoiceBeforeUpload}
                    />

                    <ProductImagesList
                        form={form}
                        validateBeforeUpload={validateBeforeUpload}
                    />

                    <ProductVariantsList
                        form={form}
                        productType={selectedType}
                        isUploading={isUploading}
                        setImageUploading={setImageUploading}
                        uploadProductImage={uploadProductImage}
                        validateBeforeUpload={validateBeforeUpload}
                    />

                    <div className="mt-6 flex justify-end gap-2">
                        <Button onClick={handleBackToTypeSelection}>
                            بازگشت
                        </Button>

                        <Button onClick={onClose}>انصراف</Button>

                        <Button
                            type="primary"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            ثبت محصول
                        </Button>
                    </div>
                </Form>
            )}
        </Drawer>
    );
}
