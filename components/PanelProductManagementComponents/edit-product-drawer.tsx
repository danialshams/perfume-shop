"use client";

import { toSlug } from "@/lib/utils";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Divider,
    Drawer,
    Empty,
    Form,
    Image,
    Input,
    InputNumber,
    Progress,
    Radio,
    Select,
    Space,
    Switch,
    Upload,
} from "antd";

import { Music4, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductItem, ScentFamily } from "@/lib/product";
import { getProductById, getScentFamilies, updateProduct } from "./product-api";


type ProductType = "SINGLE" | "GROUPED";

type Props = {
    open: boolean;
    productId: number | null;
    onClose: () => void;
    onSuccess?: (product?: ProductItem) => void;
};

type EditVariantImageFormValue = {
    id?: number;
    image_url: string;
    is_main?: boolean;
};

type EditVariantFormValue = {
    id?: number;
    volume_ml?: number | null;
    price: number;
    discount_price?: number | null;
    stock_qty: number;
    is_active?: boolean;
    images?: EditVariantImageFormValue[];
};

type EditImageFormValue = {
    id?: number;
    image_url: string;
    is_main?: boolean;
};
type ScentFamilyMode = "EXISTING" | "NEW";

type NewScentFamilyFormValue = {
    name?: string;
    image_url?: string | null;
};

type EditProductFormValues = {
    name: string;
    description?: string;
    type?: ProductType;

    category_id?: number;

    scent_family_mode?: ScentFamilyMode;
    scent_family_id?: number | null;
    new_scent_family?: NewScentFamilyFormValue;


    is_active?: boolean;
    is_featured?: boolean;
    is_best_seller?: boolean;
    status?: "DRAFT" | "ACTIVE" | "INACTIVE";
    voice_file?: string;

    images?: EditImageFormValue[];
    variants?: EditVariantFormValue[];
};


type CategoryOption = {
    id: number;
    name: string;
    slug?: string;
    is_active?: boolean | number;
    status?: string;
    parent_ids?: number[];
    parent_names?: string[];
    has_children?: boolean;
};

type ApiListResponse<T> = {
    data?: T[];
    items?: T[];
};
type ProductWithExtraFields = ProductItem & {
    type?: ProductType;
    parent_category_id?: number | null;
    voice_file?: string | null;

    is_best_seller?: boolean | number;

    scent_family_id?: number | null;
    scent_family?: string | null;
    scent_family_name?: string | null;
    scent_family_image?: string | null;
    scent_family_description?: string | null;

    scent_family_data?: {
        id?: number | null;
        name?: string | null;
        image_url?: string | null;
        is_active?: boolean | number | null;
    } | null;


    category_links?: Array<{
        parent_id?: number | null;
        child_id?: number | null;
        category_id?: number | null;
    }>;
};


const ALLOWED_AUDIO_EXTENSIONS = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac",
];

const MAX_AUDIO_SIZE_MB = 20;


export default function EditProductDrawer({
    open,
    productId,
    onClose,
    onSuccess,
}: Props) {
    const { message } = App.useApp();
    const [form] = Form.useForm<EditProductFormValues>();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [voiceUploading, setVoiceUploading] = useState(false);
    const [voiceUploadPercent, setVoiceUploadPercent] = useState(0);

    const [variantUploading, setVariantUploading] = useState<Record<string, boolean>>(
        {}
    );

    const [scentFamilyUploading, setScentFamilyUploading] = useState(false);
    const [scentFamilies, setScentFamilies] = useState<ScentFamily[]>([]);

    const [product, setProduct] = useState<ProductItem | null>(null);
    const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(
        null
    );
    const [selectedType, setSelectedType] = useState<ProductType>("SINGLE");

    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [metaLoading, setMetaLoading] = useState(false);

    const voiceFileValue = Form.useWatch("voice_file", form);

    const scentFamilyMode =
        Form.useWatch("scent_family_mode", form) ?? "EXISTING";

    const selectedScentFamilyId = Form.useWatch("scent_family_id", form);

    const newScentFamilyImage = Form.useWatch(
        ["new_scent_family", "image_url"],
        form
    );

    const title = useMemo(() => {
        if (!product) return "ویرایش محصول";
        return `ویرایش: ${product.name}`;
    }, [product]);

    const buildInitialVariants = (type: ProductType): EditVariantFormValue[] => {
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

    const normalizeVariants = (
        variants: EditVariantFormValue[],
        type: ProductType
    ) => {
        if (type === "SINGLE") {
            const firstVariant =
                Array.isArray(variants) && variants.length > 0 ? variants[0] : undefined;

            return [
                {
                    id: firstVariant?.id,
                    volume_ml:
                        firstVariant?.volume_ml !== undefined &&
                            firstVariant?.volume_ml !== null
                            ? Number(firstVariant.volume_ml)
                            : null,
                    price: Number(firstVariant?.price ?? 0),
                    discount_price:
                        firstVariant?.discount_price !== undefined &&
                            firstVariant?.discount_price !== null
                            ? Number(firstVariant.discount_price)
                            : null,
                    stock_qty:
                        firstVariant?.stock_qty !== undefined &&
                            firstVariant?.stock_qty !== null
                            ? Number(firstVariant.stock_qty)
                            : 0,
                    is_active:
                        firstVariant?.is_active === undefined
                            ? true
                            : Boolean(firstVariant.is_active),
                    images: [],
                },
            ];
        }

        return Array.isArray(variants)
            ? variants.map((variant) => {
                const variantImages: EditVariantImageFormValue[] = Array.isArray(
                    variant.images
                )
                    ? variant.images
                    : [];

                return {
                    id: variant.id,
                    volume_ml:
                        variant.volume_ml !== undefined &&
                            variant.volume_ml !== null
                            ? Number(variant.volume_ml)
                            : null,
                    price: Number(variant.price ?? 0),
                    discount_price:
                        variant.discount_price !== undefined &&
                            variant.discount_price !== null
                            ? Number(variant.discount_price)
                            : null,
                    stock_qty:
                        variant.stock_qty !== undefined &&
                            variant.stock_qty !== null
                            ? Number(variant.stock_qty)
                            : 0,
                    is_active:
                        variant.is_active === undefined
                            ? true
                            : Boolean(variant.is_active),
                    images: variantImages
                        .filter((image) => image?.image_url?.trim())
                        .map((image, index) => ({
                            id: image.id,
                            image_url: image.image_url.trim(),
                            is_main: image.is_main ?? index === 0,
                        })),
                };
            })
            : [];
    };

    useEffect(() => {
        if (!open) return;

        let mounted = true;
        async function fetchMeta() {
            try {
                setMetaLoading(true);

                const [categoriesRes, scentFamiliesResult] = await Promise.all([
                    fetch("/api/v1/categories", {
                        credentials: "include",
                    }),
                    getScentFamilies(),
                ]);

                const categoriesJson: ApiListResponse<CategoryOption> =
                    await categoriesRes.json();

                if (!categoriesRes.ok) {
                    throw new Error("دریافت دسته‌بندی‌ها با خطا مواجه شد");
                }

                if (!mounted) return;

                const categoriesData = Array.isArray(categoriesJson?.data)
                    ? categoriesJson.data
                    : Array.isArray(categoriesJson?.items)
                        ? categoriesJson.items
                        : [];

                const scentFamiliesData = Array.isArray(scentFamiliesResult?.data)
                    ? scentFamiliesResult.data
                    : Array.isArray(scentFamiliesResult?.items)
                        ? scentFamiliesResult.items
                        : Array.isArray(scentFamiliesResult)
                            ? scentFamiliesResult
                            : [];

                setCategories(categoriesData);
                setScentFamilies(scentFamiliesData);
            } catch (error) {
                console.error(error);
                message.error("دریافت اطلاعات اولیه محصول با خطا مواجه شد");
            } finally {
                if (mounted) setMetaLoading(false);
            }
        }


        fetchMeta();

        return () => {
            mounted = false;
        };
    }, [open, message]);

    useEffect(() => {
        if (!open || !productId) return;

        let mounted = true;

        async function fetchProduct() {
            try {
                setLoading(true);

                const result: ProductItem = await getProductById(Number(productId));
                const productResult = result as ProductWithExtraFields;

                if (!mounted) return;

                setProduct(result);

                const normalizedImages: EditImageFormValue[] = Array.isArray(result.images)
                    ? result.images.map((image) => ({
                        id: image.id,
                        image_url: image.image_url,
                        is_main: Boolean(image.is_main),
                    }))
                    : [];

                let resolvedCategoryId: number | undefined = undefined;
                let resolvedParentCategoryId: number | null = null;

                const firstCategoryLink = Array.isArray(productResult.category_links)
                    ? productResult.category_links[0]
                    : undefined;

                if (firstCategoryLink) {
                    resolvedParentCategoryId =
                        firstCategoryLink.parent_id !== null &&
                            firstCategoryLink.parent_id !== undefined
                            ? Number(firstCategoryLink.parent_id)
                            : null;

                    resolvedCategoryId =
                        firstCategoryLink.child_id !== null &&
                            firstCategoryLink.child_id !== undefined
                            ? Number(firstCategoryLink.child_id)
                            : firstCategoryLink.category_id !== null &&
                                firstCategoryLink.category_id !== undefined
                                ? Number(firstCategoryLink.category_id)
                                : undefined;
                } else {
                    resolvedCategoryId =
                        result.category_id !== null && result.category_id !== undefined
                            ? Number(result.category_id)
                            : undefined;

                    resolvedParentCategoryId =
                        productResult.parent_category_id !== null &&
                            productResult.parent_category_id !== undefined
                            ? Number(productResult.parent_category_id)
                            : null;
                }

                const resolvedType: ProductType =
                    productResult.type === "GROUPED" ? "GROUPED" : "SINGLE";

                const normalizedVariants: EditVariantFormValue[] = Array.isArray(
                    result.variants
                )
                    ? result.variants.map((variant) => ({
                        id: variant.id,
                        volume_ml:
                            variant.volume_ml === null ||
                                variant.volume_ml === undefined
                                ? null
                                : Number(variant.volume_ml),
                        price: Number(variant.price ?? 0),
                        discount_price:
                            variant.discount_price !== null &&
                                variant.discount_price !== undefined
                                ? Number(variant.discount_price)
                                : variant.compare_at_price !== null &&
                                    variant.compare_at_price !== undefined
                                    ? Number(variant.compare_at_price)
                                    : null,
                        stock_qty: Number(variant.stock_qty ?? variant.stock ?? 0),
                        is_active:
                            variant.is_active === undefined
                                ? true
                                : Boolean(variant.is_active),
                        images:
                            resolvedType === "GROUPED" && Array.isArray(variant.images)
                                ? variant.images.map((image) => ({
                                    id: image.id,
                                    image_url: image.image_url,
                                    is_main: Boolean(image.is_main),
                                }))
                                : [],
                    }))
                    : [];
                const resolvedScentFamilyId =
                    productResult.scent_family_id !== null &&
                        productResult.scent_family_id !== undefined
                        ? Number(productResult.scent_family_id)
                        : productResult.scent_family_data?.id !== null &&
                            productResult.scent_family_data?.id !== undefined
                            ? Number(productResult.scent_family_data.id)
                            : null;

                form.setFieldsValue({
                    name: result.name || "",
                    description: result.description || "",
                    type: resolvedType,

                    category_id: resolvedCategoryId,

                    scent_family_mode: "EXISTING",
                    scent_family_id: resolvedScentFamilyId,
                    new_scent_family: undefined,

                    is_active: Boolean(result.is_active),
                    is_featured: Boolean(result.is_featured),
                    is_best_seller: Boolean(productResult.is_best_seller),
                    status: result.status || "DRAFT",
                    voice_file: productResult.voice_file || "",

                    images: normalizedImages,
                    variants:
                        normalizedVariants.length > 0
                            ? normalizeVariants(normalizedVariants, resolvedType)
                            : buildInitialVariants(resolvedType),
                });



                setSelectedType(resolvedType);
                setSelectedParentCategory(resolvedParentCategoryId);
            } catch (error) {
                console.error(error);
                message.error("دریافت اطلاعات محصول با خطا مواجه شد");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchProduct();

        return () => {
            mounted = false;
        };
    }, [open, productId, form, message]);

    useEffect(() => {
        if (!open || !product || categories.length === 0) return;

        const productExtra = product as ProductWithExtraFields;

        if (selectedParentCategory !== null) return;

        const currentCategory = categories.find(
            (category) => Number(category.id) === Number(product.category_id)
        );

        if (!currentCategory) {
            setSelectedParentCategory(
                productExtra.parent_category_id !== null &&
                    productExtra.parent_category_id !== undefined
                    ? Number(productExtra.parent_category_id)
                    : null
            );
            return;
        }

        if (
            productExtra.parent_category_id !== null &&
            productExtra.parent_category_id !== undefined
        ) {
            setSelectedParentCategory(Number(productExtra.parent_category_id));
            return;
        }

        if (
            Array.isArray(currentCategory.parent_ids) &&
            currentCategory.parent_ids.length > 0
        ) {
            setSelectedParentCategory(Number(currentCategory.parent_ids[0]));
        } else {
            setSelectedParentCategory(Number(currentCategory.id));
        }
    }, [open, product, categories, selectedParentCategory]);

    const parentCategories = categories.filter((category) => {
        const isActive = Number(category.is_active ?? 1) === 1;
        const parentIds = Array.isArray(category.parent_ids)
            ? category.parent_ids
            : [];

        return isActive && parentIds.length === 0;
    });

    const childCategories = categories.filter((category) => {
        const isActive = Number(category.is_active ?? 1) === 1;
        const parentIds = Array.isArray(category.parent_ids)
            ? category.parent_ids
            : [];

        return (
            isActive &&
            selectedParentCategory !== null &&
            parentIds.some(
                (parentId) => Number(parentId) === Number(selectedParentCategory)
            )
        );
    });

    const activeScentFamilies = useMemo(() => {
        return (scentFamilies ?? []).filter((family) => {
            if (family.is_active === undefined || family.is_active === null) {
                return true;
            }

            return Boolean(family.is_active);
        });
    }, [scentFamilies]);


    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/v1/uploads/products", {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        const result: {
            message?: string;
            data?: { url?: string };
        } = await response.json();

        if (!response.ok) {
            throw new Error(result?.message || "خطا در آپلود");
        }

        const uploadedUrl = result?.data?.url;

        if (!uploadedUrl) {
            throw new Error("آدرس تصویر آپلود شده معتبر نیست");
        }

        return uploadedUrl;
    };

    const uploadVoiceFile = async (
        file: File,
        options?: { onProgress?: (percent: number) => void }
    ) => {
        const formData = new FormData();
        formData.append("file", file);

        options?.onProgress?.(20);

        const response = await fetch("/api/v1/uploads/products/voice", {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        options?.onProgress?.(80);

        const result: {
            message?: string;
            data?: { url?: string };
            url?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result?.message || "خطا در آپلود فایل صوتی");
        }

        const uploadedUrl = result?.data?.url || result?.url;

        if (!uploadedUrl) {
            throw new Error("آدرس فایل صوتی آپلود شده معتبر نیست");
        }

        options?.onProgress?.(100);

        return uploadedUrl;
    };

    const validateVoiceBeforeUpload = (file: File) => {
        const isAudio =
            file.type.startsWith("audio/") ||
            ALLOWED_AUDIO_EXTENSIONS.some((ext) =>
                file.name.toLowerCase().endsWith(ext)
            );

        if (!isAudio) {
            message.error("فقط فایل صوتی مجاز است");
            return Upload.LIST_IGNORE;
        }

        const isValidSize = file.size / 1024 / 1024 <= MAX_AUDIO_SIZE_MB;

        if (!isValidSize) {
            message.error(`حداکثر حجم فایل صوتی ${MAX_AUDIO_SIZE_MB} مگابایت است`);
            return Upload.LIST_IGNORE;
        }

        return true;
    };

    const handleUpload = async (file: File) => {
        try {
            setUploading(true);

            const uploadedUrl = await uploadFile(file);

            const rawImages = form.getFieldValue("images");
            const currentImages: EditImageFormValue[] = Array.isArray(rawImages)
                ? rawImages
                : [];

            form.setFieldValue("images", [
                ...currentImages,
                {
                    image_url: uploadedUrl,
                    is_main: currentImages.length === 0,
                },
            ]);

            message.success("تصویر آپلود شد");
        } catch (error: unknown) {
            console.error(error);
            message.error(
                error instanceof Error ? error.message : "آپلود تصویر با خطا مواجه شد"
            );
        } finally {
            setUploading(false);
        }

        return false;
    };
    const handleNewScentFamilyImageUpload = async (file: File) => {
        try {
            setScentFamilyUploading(true);

            const uploadedUrl = await uploadFile(file);

            form.setFieldValue(["new_scent_family", "image_url"], uploadedUrl);
            form.setFields([
                {
                    name: ["new_scent_family", "image_url"],
                    errors: [],
                },
            ]);

            message.success("تصویر گروه بویایی با موفقیت آپلود شد");
        } catch (error) {
            console.error(error);
            message.error(
                error instanceof Error
                    ? error.message
                    : "آپلود تصویر گروه بویایی با خطا مواجه شد"
            );
        } finally {
            setScentFamilyUploading(false);
        }

        return false;
    };


    const handleVariantUpload = async (file: File, variantIndex: number) => {
        const uploadKey = `variant-${variantIndex}`;

        try {
            setVariantUploading((prev) => ({
                ...prev,
                [uploadKey]: true,
            }));

            const uploadedUrl = await uploadFile(file);

            const variants =
                (form.getFieldValue("variants") as EditVariantFormValue[] | undefined) ||
                [];

            const currentVariant = variants[variantIndex] || {
                volume_ml: null,
                price: 0,
                discount_price: null,
                stock_qty: 0,
                is_active: true,
                images: [],
            };

            const currentImages: EditVariantImageFormValue[] = Array.isArray(
                currentVariant.images
            )
                ? currentVariant.images
                : [];

            const updatedVariants = [...variants];

            updatedVariants[variantIndex] = {
                ...currentVariant,
                images: [
                    ...currentImages,
                    {
                        image_url: uploadedUrl,
                        is_main: currentImages.length === 0,
                    },
                ],
            };

            form.setFieldValue("variants", updatedVariants);

            message.success("تصویر واریانت آپلود شد");
        } catch (error: unknown) {
            console.error(error);
            message.error(
                error instanceof Error
                    ? error.message
                    : "آپلود تصویر واریانت با خطا مواجه شد"
            );
        } finally {
            setVariantUploading((prev) => ({
                ...prev,
                [uploadKey]: false,
            }));
        }

        return false;
    };

    const handleRemoveImage = (index: number) => {
        const images =
            (form.getFieldValue("images") as EditImageFormValue[] | undefined) || [];

        const removedImage = images[index];

        const updated = images
            .filter((_, i) => i !== index)
            .map((img) => ({
                ...img,
            }));

        if (removedImage?.is_main && updated.length > 0) {
            updated[0].is_main = true;
        }

        if (updated.length === 1 && !updated[0].is_main) {
            updated[0].is_main = true;
        }

        form.setFieldValue("images", updated);
    };

    const handleSetMainImage = (index: number) => {
        const images =
            (form.getFieldValue("images") as EditImageFormValue[] | undefined) || [];

        const updated = images.map((img, i) => ({
            ...img,
            is_main: i === index,
        }));

        form.setFieldValue("images", updated);
    };

    const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
        const variants =
            (form.getFieldValue("variants") as EditVariantFormValue[] | undefined) ||
            [];

        const currentVariant = variants[variantIndex];

        if (!currentVariant) return;

        const currentImages: EditVariantImageFormValue[] = Array.isArray(
            currentVariant.images
        )
            ? currentVariant.images
            : [];

        const removedImage = currentImages[imageIndex];

        const updatedImages = currentImages
            .filter((_, i) => i !== imageIndex)
            .map((img) => ({
                ...img,
            }));

        if (removedImage?.is_main && updatedImages.length > 0) {
            updatedImages[0].is_main = true;
        }

        if (updatedImages.length === 1 && !updatedImages[0].is_main) {
            updatedImages[0].is_main = true;
        }

        const updatedVariants = [...variants];

        updatedVariants[variantIndex] = {
            ...currentVariant,
            images: updatedImages,
        };

        form.setFieldValue("variants", updatedVariants);
    };

    const handleSetMainVariantImage = (
        variantIndex: number,
        imageIndex: number
    ) => {
        const variants =
            (form.getFieldValue("variants") as EditVariantFormValue[] | undefined) ||
            [];

        const currentVariant = variants[variantIndex];

        if (!currentVariant) return;

        const currentImages: EditVariantImageFormValue[] = Array.isArray(
            currentVariant.images
        )
            ? currentVariant.images
            : [];

        const updatedImages = currentImages.map((img, i) => ({
            ...img,
            is_main: i === imageIndex,
        }));

        const updatedVariants = [...variants];

        updatedVariants[variantIndex] = {
            ...currentVariant,
            images: updatedImages,
        };

        form.setFieldValue("variants", updatedVariants);
    };

    const handleTypeChange = (nextType: ProductType) => {
        const currentVariants =
            (form.getFieldValue("variants") as EditVariantFormValue[] | undefined) ||
            [];

        setSelectedType(nextType);
        form.setFieldValue("type", nextType);

        if (nextType === "SINGLE") {
            const firstVariant =
                currentVariants.length > 0 ? currentVariants[0] : buildInitialVariants("SINGLE")[0];

            form.setFieldValue("variants", [
                {
                    ...firstVariant,
                    images: [],
                },
            ]);
            return;
        }

        if (currentVariants.length === 0) {
            form.setFieldValue("variants", buildInitialVariants("GROUPED"));
            return;
        }

        form.setFieldValue(
            "variants",
            currentVariants.map((variant, index) => ({
                ...variant,
                images:
                    Array.isArray(variant.images) && variant.images.length > 0
                        ? variant.images
                        : index === 0
                            ? [
                                {
                                    image_url: "",
                                    is_main: true,
                                },
                            ]
                            : [],
            }))
        );
    };

    const handleClose = () => {
        form.resetFields();
        setProduct(null);
        setSelectedParentCategory(null);
        setSelectedType("SINGLE");
        setVariantUploading({});
        setScentFamilyUploading(false);
        setVoiceUploading(false);
        setVoiceUploadPercent(0);
        onClose();
    };


    const handleSubmit = async () => {
        try {
            if (!product) {
                message.error("محصول یافت نشد");
                return;
            }

            setSubmitting(true);

            const values = await form.validateFields();

            const rawImages = form.getFieldValue("images");
            const safeImages: EditImageFormValue[] = Array.isArray(rawImages)
                ? rawImages
                : [];

            const normalizedImages = safeImages
                .filter((image) => image?.image_url?.trim())
                .map((image, index) => ({
                    id: image.id,
                    image_url: image.image_url.trim(),
                    is_main: image.is_main ?? index === 0,
                }));

            const hasChildCategory =
                values.category_id !== undefined && values.category_id !== null;

            const hasParentCategory =
                selectedParentCategory !== null && selectedParentCategory !== undefined;

            const categoryLinks =
                hasParentCategory || hasChildCategory
                    ? [
                        {
                            parent_id: hasParentCategory
                                ? Number(selectedParentCategory)
                                : null,
                            child_id: hasChildCategory
                                ? Number(values.category_id)
                                : null,
                        },
                    ]
                    : [];

            const rawVariants = form.getFieldValue("variants");
            const safeVariants: EditVariantFormValue[] = Array.isArray(rawVariants)
                ? rawVariants
                : [];
            const selectedMode = values.scent_family_mode ?? "EXISTING";

            const normalizedNewScentFamily =
                selectedMode === "NEW"
                    ? {
                        name: values.new_scent_family?.name?.trim() || "",
                        image_url: values.new_scent_family?.image_url?.trim() || "",
                    }
                    : undefined;

            const payload = {
                name: values.name?.trim(),
                slug: toSlug(values.name?.trim() || ""),
                description: values.description?.trim() || null,
                type: selectedType,

                category_links: categoryLinks,

                scent_family_id:
                    selectedMode === "EXISTING" && values.scent_family_id
                        ? Number(values.scent_family_id)
                        : null,

                new_scent_family:
                    selectedMode === "NEW" && normalizedNewScentFamily
                        ? normalizedNewScentFamily
                        : undefined,

                is_active: Boolean(values.is_active),
                is_featured: Boolean(values.is_featured),
                is_best_seller: Boolean(values.is_best_seller),
                status: values.status || "DRAFT",
                voice_file: values.voice_file?.trim() || null,

                images: normalizedImages,
                variants: normalizeVariants(safeVariants, selectedType),
            };


            await updateProduct(product.id, payload);

            message.success("محصول با موفقیت بروزرسانی شد");
            handleClose();
            onSuccess?.();
        } catch (error) {
            console.error("handleSubmit error:", error);
            message.error("خطا در بروزرسانی محصول");
        } finally {
            setSubmitting(false);
        }
    };
    const handleScentFamilyModeChange = (mode: ScentFamilyMode) => {
        form.setFieldValue("scent_family_mode", mode);

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
        <Drawer
            title={title}
            open={open}
            onClose={handleClose}
            width={920}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={handleClose}>انصراف</Button>
                    <Button
                        type="primary"
                        loading={submitting}
                        onClick={handleSubmit}
                    >
                        ذخیره تغییرات
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                disabled={loading || metaLoading}
                initialValues={{
                    type: "SINGLE",
                    status: "DRAFT",
                    is_active: true,
                    is_featured: false,
                    is_best_seller: false,
                    voice_file: "",
                    scent_family_mode: "EXISTING",
                    scent_family_id: undefined,
                    new_scent_family: undefined,
                    images: [],
                    variants: [],
                }}


            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Form.Item
                        label="نام محصول"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: "نام محصول الزامی است",
                            },
                        ]}
                    >
                        <Input size="large" placeholder="مثلاً Dior Sauvage" />
                    </Form.Item>

                    <Form.Item label="نوع محصول" name="type">
                        <Radio.Group
                            onChange={(e) => handleTypeChange(e.target.value)}
                            value={selectedType}
                        >
                            <Space direction="horizontal">
                                <Radio value="SINGLE">تکی</Radio>
                                <Radio value="GROUPED">گروهی</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item label="دسته‌بندی والد">
                        <Select
                            size="large"
                            allowClear
                            placeholder="انتخاب دسته‌بندی والد"
                            value={selectedParentCategory ?? undefined}
                            onChange={(value) => {
                                setSelectedParentCategory(value ?? null);
                                form.setFieldValue("category_id", undefined);
                                form.resetFields(["category_id"]);
                            }}
                            options={parentCategories.map((category) => ({
                                value: Number(category.id),
                                label: category.name,
                            }))}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Form.Item label="دسته‌بندی فرزند" name="category_id">
                        <Select
                            size="large"
                            allowClear
                            placeholder="انتخاب دسته‌بندی فرزند"
                            disabled={selectedParentCategory === null}
                            options={childCategories.map((category) => ({
                                value: Number(category.id),
                                label: category.name,
                            }))}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>

                    <Form.Item
                        label="محصول ویژه"
                        name="is_featured"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="ویژه" unCheckedChildren="عادی" />
                    </Form.Item>

                    <Form.Item
                        label="محصول پرفروش"
                        name="is_best_seller"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="پرفروش" unCheckedChildren="عادی" />
                    </Form.Item>

                    <Form.Item
                        label="وضعیت فعال بودن"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
                    </Form.Item>



                </div>

                <Form.Item label="توضیحات کامل" name="description">
                    <Input.TextArea rows={5} placeholder="توضیحات کامل محصول" />
                </Form.Item>
                <Divider titlePlacement="right">گروه بویایی</Divider>

                <Card className="rounded-3xl border border-neutral-200 bg-neutral-50/70">
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
                            <Space direction="horizontal" wrap>
                                <Radio value="EXISTING">
                                    انتخاب از گروه‌های بویایی قبلی
                                </Radio>

                                <Radio value="NEW">
                                    ایجاد گروه بویایی جدید
                                </Radio>
                            </Space>
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
                                                            Number(family.id)
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key === "Enter" ||
                                                            event.key === " "
                                                        ) {
                                                            event.preventDefault();
                                                            handleSelectScentFamily(
                                                                Number(family.id)
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

                                                    <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
                                                        {family.image_url ? (
                                                            <img
                                                                src={family.image_url}
                                                                alt={family.name}
                                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
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
                                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-8">
                                    <Empty description="هنوز گروه بویایی ثبت نشده است" />
                                </div>
                            )}
                        </Form.Item>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Form.Item
                                    label="نام گروه بویایی جدید"
                                    name={["new_scent_family", "name"]}
                                    rules={[
                                        {
                                            required: scentFamilyMode === "NEW",
                                            message: "نام گروه بویایی جدید الزامی است",
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
                                    این گروه پس از ذخیره محصول ساخته می‌شود و در محصولات بعدی
                                    از لیست گروه‌های موجود قابل انتخاب خواهد بود.
                                </p>
                            </div>

                            <div>
                                <Form.Item label="تصویر گروه بویایی جدید" required>
                                    <Upload
                                        multiple={false}
                                        showUploadList={false}
                                        beforeUpload={(file) =>
                                            handleNewScentFamilyImageUpload(file as File)
                                        }
                                    >
                                        <Button
                                            block
                                            loading={scentFamilyUploading}
                                            icon={<PlusOutlined />}
                                        >
                                            آپلود تصویر گروه بویایی
                                        </Button>
                                    </Upload>

                                    <div className="mt-3">
                                        {newScentFamilyImage ? (
                                            <Card
                                                size="small"
                                                cover={
                                                    <div className="p-2">
                                                        <Image
                                                            src={newScentFamilyImage}
                                                            alt="تصویر گروه بویایی جدید"
                                                            height={180}
                                                            className="w-full rounded-xl object-cover"
                                                        />
                                                    </div>
                                                }
                                                actions={[
                                                    <Button
                                                        key="remove"
                                                        danger
                                                        size="small"
                                                        onClick={() => {
                                                            form.setFieldValue(
                                                                ["new_scent_family", "image_url"],
                                                                ""
                                                            );
                                                            form.setFields([
                                                                {
                                                                    name: [
                                                                        "new_scent_family",
                                                                        "image_url",
                                                                    ],
                                                                    errors: [],
                                                                },
                                                            ]);
                                                        }}
                                                    >
                                                        حذف تصویر
                                                    </Button>,
                                                ]}
                                            />
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
                                                هنوز تصویری ثبت نشده است
                                            </div>
                                        )}
                                    </div>
                                </Form.Item>

                                <Form.Item
                                    name={["new_scent_family", "image_url"]}
                                    hidden
                                    rules={[
                                        {
                                            required: scentFamilyMode === "NEW",
                                            message: "تصویر گروه بویایی جدید الزامی است",
                                        },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                            </div>
                        </div>
                    )}
                </Card>


                <Divider titlePlacement="right">فایل صوتی محصول</Divider>

                <div className="mb-6 rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4">
                    {voiceFileValue ? (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                <div className="mb-3 flex items-center gap-2 font-medium text-neutral-800">
                                    <Music4 size={18} />
                                    فایل صوتی آپلود شده
                                </div>

                                <audio
                                    controls
                                    preload="none"
                                    src={voiceFileValue}
                                    className="w-full"
                                >
                                    مرورگر شما از پخش فایل صوتی پشتیبانی نمی‌کند
                                </audio>
                            </div>

                            {voiceUploading ? (
                                <div className="rounded-2xl border border-primary/20 bg-white p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-medium text-neutral-700">
                                            در حال آپلود فایل صوتی...
                                        </span>
                                        <span className="font-bold text-primary">
                                            {voiceUploadPercent}%
                                        </span>
                                    </div>

                                    <Progress
                                        percent={voiceUploadPercent}
                                        status="active"
                                        strokeColor="#1677ff"
                                        showInfo={false}
                                    />
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                <Upload
                                    accept={ALLOWED_AUDIO_EXTENSIONS.join(",")}
                                    maxCount={1}
                                    multiple={false}
                                    showUploadList={false}
                                    disabled={voiceUploading}
                                    beforeUpload={(file) => {
                                        if (voiceUploading) {
                                            message.warning(
                                                "لطفاً تا پایان آپلود فعلی صبر کنید"
                                            );
                                            return Upload.LIST_IGNORE;
                                        }

                                        return validateVoiceBeforeUpload(file as File);
                                    }}
                                    customRequest={async ({
                                        file,
                                        onSuccess,
                                        onError,
                                    }) => {
                                        if (voiceUploading) {
                                            onError?.(
                                                new Error(
                                                    "آپلود فایل صوتی در حال انجام است"
                                                )
                                            );
                                            return;
                                        }

                                        try {
                                            setVoiceUploading(true);
                                            setVoiceUploadPercent(0);

                                            const uploadedUrl = await uploadVoiceFile(
                                                file as File,
                                                {
                                                    onProgress: (percent) => {
                                                        setVoiceUploadPercent(percent);
                                                    },
                                                }
                                            );

                                            form.setFieldValue("voice_file", uploadedUrl);
                                            form.setFields([
                                                {
                                                    name: ["voice_file"],
                                                    errors: [],
                                                },
                                            ]);

                                            setVoiceUploadPercent(100);
                                            onSuccess?.({ url: uploadedUrl });
                                            message.success(
                                                "فایل صوتی با موفقیت آپلود شد"
                                            );
                                        } catch (error) {
                                            onError?.(error as Error);
                                            message.error(
                                                error instanceof Error
                                                    ? error.message
                                                    : "آپلود فایل صوتی با خطا مواجه شد"
                                            );
                                        } finally {
                                            setVoiceUploading(false);
                                        }
                                    }}
                                >
                                    <Button
                                        loading={voiceUploading}
                                        disabled={voiceUploading}
                                        icon={<UploadCloud size={16} />}
                                    >
                                        تغییر فایل صوتی
                                    </Button>
                                </Upload>

                                <Button
                                    danger
                                    icon={<Trash2 size={16} />}
                                    disabled={voiceUploading}
                                    onClick={() => {
                                        form.setFieldValue("voice_file", "");
                                        form.setFields([
                                            {
                                                name: ["voice_file"],
                                                errors: [],
                                            },
                                        ]);
                                        setVoiceUploadPercent(0);
                                    }}
                                >
                                    حذف فایل صوتی
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
                            <div className="mb-3 flex justify-center text-neutral-500">
                                <Music4 size={28} />
                            </div>

                            <div className="mb-2 font-medium text-neutral-700">
                                فایل صوتی محصول را آپلود کنید
                            </div>

                            <div className="mb-4 text-sm text-neutral-500">
                                فرمت‌های مجاز: audio/* و پسوندهای رایج صوتی - حداکثر 20MB
                            </div>

                            {voiceUploading ? (
                                <div className="mx-auto mb-4 max-w-md rounded-2xl border border-primary/20 bg-neutral-50 p-4 text-right">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-medium text-neutral-700">
                                            در حال آپلود فایل صوتی...
                                        </span>
                                        <span className="font-bold text-primary">
                                            {voiceUploadPercent}%
                                        </span>
                                    </div>

                                    <Progress
                                        percent={voiceUploadPercent}
                                        status="active"
                                        strokeColor="#1677ff"
                                        showInfo={false}
                                    />
                                </div>
                            ) : null}

                            <Upload
                                accept={ALLOWED_AUDIO_EXTENSIONS.join(",")}
                                maxCount={1}
                                multiple={false}
                                showUploadList={false}
                                disabled={voiceUploading}
                                beforeUpload={(file) => {
                                    if (voiceUploading) {
                                        message.warning(
                                            "لطفاً تا پایان آپلود فعلی صبر کنید"
                                        );
                                        return Upload.LIST_IGNORE;
                                    }

                                    return validateVoiceBeforeUpload(file as File);
                                }}
                                customRequest={async ({
                                    file,
                                    onSuccess,
                                    onError,
                                }) => {
                                    if (voiceUploading) {
                                        onError?.(
                                            new Error(
                                                "آپلود فایل صوتی در حال انجام است"
                                            )
                                        );
                                        return;
                                    }

                                    try {
                                        setVoiceUploading(true);
                                        setVoiceUploadPercent(0);

                                        const uploadedUrl = await uploadVoiceFile(
                                            file as File,
                                            {
                                                onProgress: (percent) => {
                                                    setVoiceUploadPercent(percent);
                                                },
                                            }
                                        );

                                        form.setFieldValue("voice_file", uploadedUrl);
                                        form.setFields([
                                            {
                                                name: ["voice_file"],
                                                errors: [],
                                            },
                                        ]);

                                        setVoiceUploadPercent(100);
                                        onSuccess?.({ url: uploadedUrl });
                                        message.success(
                                            "فایل صوتی با موفقیت آپلود شد"
                                        );
                                    } catch (error) {
                                        onError?.(error as Error);
                                        message.error(
                                            error instanceof Error
                                                ? error.message
                                                : "آپلود فایل صوتی با خطا مواجه شد"
                                        );
                                    } finally {
                                        setVoiceUploading(false);
                                    }
                                }}
                            >
                                <Button
                                    size="large"
                                    type="default"
                                    loading={voiceUploading}
                                    disabled={voiceUploading}
                                    icon={<UploadCloud size={16} />}
                                >
                                    انتخاب فایل صوتی
                                </Button>
                            </Upload>
                        </div>
                    )}

                    <Form.Item name="voice_file" hidden>
                        <Input />
                    </Form.Item>
                </div>

                <Divider titlePlacement="right">واریانت‌ها</Divider>

                <Form.List name="variants">
                    {(fields, { add, remove }) => (
                        <Space direction="vertical" className="w-full" size="middle">
                            {(selectedType === "SINGLE" ? fields.slice(0, 1) : fields).map(
                                (field) => (
                                    <Card
                                        key={field.key}
                                        size="small"
                                        extra={
                                            selectedType === "GROUPED" ? (
                                                <Button
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => remove(field.name)}
                                                />
                                            ) : null
                                        }
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Form.Item
                                                label="حجم (ml)"
                                                name={[field.name, "volume_ml"]}
                                            >
                                                <InputNumber className="w-full" min={0} />
                                            </Form.Item>

                                            <Form.Item
                                                label="قیمت"
                                                name={[field.name, "price"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "قیمت الزامی است",
                                                    },
                                                ]}
                                            >
                                                <InputNumber className="w-full" min={0} />
                                            </Form.Item>

                                            <Form.Item
                                                label="قیمت تخفیف"
                                                name={[field.name, "discount_price"]}
                                            >
                                                <InputNumber className="w-full" min={0} />
                                            </Form.Item>

                                            <Form.Item
                                                label="موجودی"
                                                name={[field.name, "stock_qty"]}
                                            >
                                                <InputNumber className="w-full" min={0} />
                                            </Form.Item>


                                        </div>

                                        {selectedType === "GROUPED" ? (
                                            <>
                                                <Divider orientation="start">
                                                    تصاویر این واریانت
                                                </Divider>

                                                <Space
                                                    direction="vertical"
                                                    className="w-full"
                                                    size="middle"
                                                >
                                                    <Upload
                                                        multiple={false}
                                                        showUploadList={false}
                                                        beforeUpload={(file) =>
                                                            handleVariantUpload(
                                                                file as File,
                                                                Number(field.name)
                                                            )
                                                        }
                                                    >
                                                        <Button
                                                            loading={
                                                                variantUploading[
                                                                `variant-${field.name}`
                                                                ]
                                                            }
                                                        >
                                                            آپلود تصویر واریانت
                                                        </Button>
                                                    </Upload>

                                                    <Form.Item shouldUpdate noStyle>
                                                        {() => {
                                                            const variants =
                                                                (form.getFieldValue(
                                                                    "variants"
                                                                ) as
                                                                    | EditVariantFormValue[]
                                                                    | undefined) || [];

                                                            const variant =
                                                                variants[field.name];

                                                            const images: EditVariantImageFormValue[] = Array.isArray(variant?.images)
                                                                ? variant.images.filter((image) => image?.image_url?.trim())
                                                                : [];

                                                            return images.length > 0 ? (
                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {images.map((image, imageIndex) => (
                                                                        <Card
                                                                            key={`${image.image_url}-${imageIndex}`}
                                                                            size="small"
                                                                            cover={
                                                                                <div className="p-2">
                                                                                    <Image
                                                                                        src={image.image_url}
                                                                                        alt={`variant-image-${field.name}-${imageIndex}`}
                                                                                        height={220}
                                                                                        className="w-full object-cover"
                                                                                    />
                                                                                </div>
                                                                            }
                                                                            actions={[
                                                                                <Button
                                                                                    key="main"
                                                                                    type={image.is_main ? "primary" : "default"}
                                                                                    size="small"
                                                                                    onClick={() =>
                                                                                        handleSetMainVariantImage(
                                                                                            Number(field.name),
                                                                                            imageIndex
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    تصویر اصلی
                                                                                </Button>,
                                                                                <Button
                                                                                    key="delete"
                                                                                    danger
                                                                                    size="small"
                                                                                    onClick={() =>
                                                                                        handleRemoveVariantImage(
                                                                                            Number(field.name),
                                                                                            imageIndex
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    حذف
                                                                                </Button>,
                                                                            ]}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
                                                                    هنوز تصویری برای این واریانت ثبت نشده است
                                                                </div>
                                                            );

                                                        }}
                                                    </Form.Item>
                                                </Space>
                                            </>
                                        ) : null}
                                    </Card>
                                )
                            )}

                            {selectedType === "GROUPED" ? (
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                        add({
                                            volume_ml: null,
                                            price: 0,
                                            discount_price: null,
                                            stock_qty: 0,
                                            is_active: true,
                                            images: [],
                                        })
                                    }
                                >
                                    افزودن واریانت
                                </Button>
                            ) : null}
                        </Space>
                    )}
                </Form.List>

                <Divider titlePlacement="right">تصاویر محصول</Divider>

                <Form.Item name="images" initialValue={[]}>
                    <Space direction="vertical" className="w-full" size="middle">
                        <Upload
                            multiple={false}
                            showUploadList={false}
                            beforeUpload={handleUpload}
                        >
                            <Button loading={uploading}>آپلود تصویر</Button>
                        </Upload>

                        <Form.Item shouldUpdate noStyle>
                            {() => {
                                const rawImages = form.getFieldValue("images");

                                const images: EditImageFormValue[] = Array.isArray(rawImages)
                                    ? rawImages
                                    : [];

                                return images.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {images.map((image, index) => (
                                            <Card
                                                key={`${image.image_url}-${index}`}
                                                size="small"
                                                cover={
                                                    <div className="p-2">
                                                        <Image
                                                            src={image.image_url}
                                                            alt={`product-image-${index}`}
                                                            height={220}
                                                            className="w-full object-cover"
                                                        />
                                                    </div>
                                                }
                                                actions={[
                                                    <Button
                                                        key="main"
                                                        type={
                                                            image.is_main
                                                                ? "primary"
                                                                : "default"
                                                        }
                                                        size="small"
                                                        onClick={() =>
                                                            handleSetMainImage(index)
                                                        }
                                                    >
                                                        تصویر اصلی
                                                    </Button>,
                                                    <Button
                                                        key="delete"
                                                        danger
                                                        size="small"
                                                        onClick={() =>
                                                            handleRemoveImage(index)
                                                        }
                                                    >
                                                        حذف
                                                    </Button>,
                                                ]}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
                                        هنوز تصویری برای این محصول ثبت نشده است
                                    </div>
                                );
                            }}
                        </Form.Item>
                    </Space>
                </Form.Item>
            </Form>
        </Drawer>
    );
}
