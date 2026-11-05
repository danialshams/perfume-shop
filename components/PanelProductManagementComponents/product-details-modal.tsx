"use client";

import { Divider, Image } from "antd";
import { Music4 } from "lucide-react";
import type { ReactNode } from "react";

import { formatPrice, ProductItem, ProductType } from "@/lib/product";
import AdminModal from "../panel-sections/admin-modal";
import AdminStatusBadge from "../panel-sections/admin-status-badge";
import {
    boolify,
    formatNumber,
    toPersianDigits,
} from "../panel-sections/persian-number";
import ProductImagesGrid from "./product-images-grid";
import ProductVariantsTable from "./product-variants-table";

type ProductImageLike = {
    id?: string | number;
    image_url: string;
    is_main?: boolean | number;
};

type CategoryOption = {
    id: number | string;
    name: string;
    slug?: string;
    is_active?: boolean | number;
    parent_id?: number | string | null;
    parent_ids?: Array<number | string>;
    parent_names?: string[];
    has_children?: boolean;
};

type CategoriesProp =
    | CategoryOption[]
    | {
        success?: boolean;
        message?: string;
        data?: CategoryOption[];
    }
    | null
    | undefined;

type ProductCategoryLike = {
    id?: number | string;
    name?: string;
    slug?: string;
    parent_id?: number | string | null;
    parent_ids?: Array<number | string>;
    parent_names?: string[];
};

type ScentFamilyLike = {
    id?: number | string | null;
    name?: string | null;
    image_url?: string | null;
    image?: string | null;
    slug?: string | null;
    is_active?: boolean | number | null;
};

type ProductWithExtraFields = ProductItem & {
    voice_file?: string | null;
    type?: ProductType;

    category_id?: number | string | null;
    category_name?: string | null;
    category_slug?: string | null;
    parent_category_id?: number | string | null;

    category?: ProductCategoryLike | null;

    total_stock?: number;
    variant_count?: number;

    primary_image?: string | null;
    image?: string | null;

    /**
     * مدل جدید گروه بویایی
     */
    scent_family_id?: number | string | null;
    scent_family_data?: ScentFamilyLike | null;
    scent_family_name?: string | null;

    /**
     * فیلدهای legacy برای سازگاری با پاسخ‌های قدیمی API
     */
    scent_family?: string | null;
    scent_family_image?: string | null;
    scent_family_description?: string | null;

    is_best_seller?: boolean | number;

    variants?: Array<Record<string, any>>;
    variant_options?: Array<Record<string, any>>;
    images?: ProductImageLike[];
};

type NormalizedVariantImage = {
    id?: string | number;
    image_url: string;
    is_main?: boolean | number;
};

type NormalizedVariant = {
    id?: string | number;
    label?: string | null;
    price: number;
    stock_qty: number;
    stock?: number;
    volume_ml?: number | null;
    is_active?: boolean | number;
    images: NormalizedVariantImage[];
};

export default function ProductDetailsModal({
    open,
    product,
    categories,
    onClose,
}: {
    open: boolean;
    product: ProductItem | null;
    categories?: CategoriesProp;
    onClose: () => void;
}) {
    if (!product) return null;

    const safeProduct = product as ProductWithExtraFields;

    const isSingle = safeProduct.type === "SINGLE";
    const voiceFile = safeProduct.voice_file?.trim() || "";

    const normalizedCategories: CategoryOption[] = Array.isArray(categories)
        ? categories
        : Array.isArray(categories?.data)
            ? categories.data
            : [];

    const productCategoryId =
        safeProduct.category_id ?? safeProduct.category?.id ?? null;

    const currentCategory = normalizedCategories.find(
        (category) => Number(category.id) === Number(productCategoryId),
    );

    const directParentId =
        safeProduct.parent_category_id ??
        currentCategory?.parent_id ??
        (Array.isArray(currentCategory?.parent_ids) &&
            currentCategory.parent_ids.length > 0
            ? currentCategory.parent_ids[0]
            : null) ??
        safeProduct.category?.parent_id ??
        (Array.isArray(safeProduct.category?.parent_ids) &&
            safeProduct.category.parent_ids.length > 0
            ? safeProduct.category.parent_ids[0]
            : null) ??
        null;

    const directParentCategory =
        directParentId !== null && directParentId !== undefined
            ? normalizedCategories.find(
                (category) => Number(category.id) === Number(directParentId),
            )
            : undefined;

    const firstParentNameFromCurrent =
        Array.isArray(currentCategory?.parent_names) &&
            currentCategory.parent_names.length > 0
            ? currentCategory.parent_names[0]
            : null;

    const firstParentNameFromProductCategory =
        Array.isArray(safeProduct.category?.parent_names) &&
            safeProduct.category.parent_names.length > 0
            ? safeProduct.category.parent_names[0]
            : null;

    const parentCategoryLabel =
        directParentCategory?.name ||
        firstParentNameFromCurrent ||
        firstParentNameFromProductCategory ||
        "-";

    const childCategoryLabel =
        currentCategory?.name ||
        safeProduct.category_name ||
        safeProduct.category?.name ||
        "-";

    const scentFamilyName =
        safeProduct.scent_family_data?.name?.trim() ||
        safeProduct.scent_family_name?.trim() ||
        safeProduct.scent_family?.trim() ||
        "-";

    const scentFamilyImage =
        safeProduct.scent_family_data?.image_url?.trim() ||
        safeProduct.scent_family_data?.image?.trim() ||
        safeProduct.scent_family_image?.trim() ||
        "";

    const scentFamilyId =
        safeProduct.scent_family_id ??
        safeProduct.scent_family_data?.id ??
        null;

    const productImages: ProductImageLike[] = Array.isArray(safeProduct.images)
        ? safeProduct.images
            .filter((image) => image?.image_url?.trim())
            .map((image) => ({
                id: image.id,
                image_url: image.image_url.trim(),
                is_main: image.is_main,
            }))
        : safeProduct.primary_image?.trim() || safeProduct.image?.trim()
            ? [
                {
                    id: `main-${safeProduct.id}`,
                    image_url:
                        safeProduct.primary_image?.trim() ||
                        safeProduct.image?.trim() ||
                        "",
                    is_main: true,
                },
            ]
            : [];

    const rawVariants = Array.isArray(safeProduct.variants)
        ? safeProduct.variants
        : [];

    const optionVariants = Array.isArray(safeProduct.variant_options)
        ? safeProduct.variant_options
        : [];

    let variants =
        rawVariants.length > 0
            ? rawVariants.map((variant) => {
                const matchedOption = optionVariants.find(
                    (option) => Number(option.id) === Number(variant.id),
                );

                return {
                    ...variant,
                    label: variant.label ?? matchedOption?.label,
                    price: variant.price ?? matchedOption?.price,
                    stock_qty:
                        variant.stock_qty ??
                        variant.stock ??
                        matchedOption?.stock_qty ??
                        matchedOption?.stock,
                    images:
                        Array.isArray(variant.images) &&
                            variant.images.length > 0
                            ? variant.images
                            : Array.isArray(matchedOption?.images)
                                ? matchedOption.images
                                : [],
                };
            })
            : optionVariants;

    if (isSingle && variants.length > 0) {
        variants = [variants[0]];
    }

    const normalizedVariants: NormalizedVariant[] = variants.map((variant) => ({
        ...variant,
        images: Array.isArray(variant.images)
            ? variant.images
                .filter((image: NormalizedVariantImage) =>
                    image?.image_url?.trim(),
                )
                .map((image: NormalizedVariantImage) => ({
                    id: image.id,
                    image_url: image.image_url.trim(),
                    is_main: image.is_main,
                }))
            : [],
        stock_qty: Number(variant.stock_qty ?? variant.stock ?? 0),
        price:
            variant.price !== undefined && variant.price !== null
                ? Number(variant.price)
                : 0,
        volume_ml:
            variant.volume_ml !== undefined && variant.volume_ml !== null
                ? Number(variant.volume_ml)
                : null,
        is_active: variant.is_active !== undefined ? variant.is_active : 1,
    }));

    const variantPrices = normalizedVariants
        .map((variant) => Number(variant.price))
        .filter((price) => !Number.isNaN(price));

    const productPrice =
        safeProduct.price !== undefined && safeProduct.price !== null
            ? Number(safeProduct.price)
            : null;

    const minPrice =
        variantPrices.length > 0
            ? Math.min(...variantPrices)
            : productPrice !== null
                ? productPrice
                : null;

    const maxPrice =
        variantPrices.length > 0
            ? Math.max(...variantPrices)
            : productPrice !== null
                ? productPrice
                : null;

    const hasRange =
        minPrice !== null &&
        maxPrice !== null &&
        Number(minPrice) !== Number(maxPrice);

    const priceLabel =
        minPrice !== null
            ? hasRange && maxPrice !== null
                ? `${formatPrice(minPrice)} تا ${formatPrice(maxPrice)}`
                : formatPrice(minPrice)
            : "-";

    const totalStock =
        safeProduct.total_stock ??
        normalizedVariants.reduce((sum, variant) => {
            return sum + Number(variant.stock_qty ?? 0);
        }, 0);

    const totalVariantImages = normalizedVariants.reduce((sum, variant) => {
        const images = Array.isArray(variant.images) ? variant.images : [];
        return sum + images.length;
    }, 0);

    const totalImagesCount = productImages.length + totalVariantImages;

    const mainProductImage =
        productImages.find((image) => boolify(image.is_main)) ||
        productImages[0] ||
        null;

    return (
        <AdminModal
            open={open}
            onCancel={onClose}
            title={
                <div className="flex min-w-0 flex-col">
                    <span className="truncate text-base font-black text-neutral-900 md:text-lg">
                        {safeProduct.name}
                    </span>

                    <span className="mt-1 truncate text-xs text-neutral-500">
                        {safeProduct.slug || "-"}
                    </span>
                </div>
            }
            width={1280}
        >
            <div className="space-y-6 md:space-y-8">
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:gap-6">
                    <div className="xl:col-span-4">
                        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
                            <div className="p-3 md:p-4">
                                {mainProductImage?.image_url ? (
                                    <Image
                                        src={mainProductImage.image_url}
                                        alt={safeProduct.name || "product-image"}
                                        className="w-full rounded-2xl object-cover"
                                        style={{
                                            maxHeight: 420,
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 text-center text-sm text-neutral-400 md:h-[420px]">
                                        تصویری برای این محصول ثبت نشده است
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-neutral-100 p-4">
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <MiniStat
                                        label="قیمت"
                                        value={priceLabel}
                                    />

                                    <MiniStat
                                        label="موجودی"
                                        value={formatNumber(totalStock)}
                                    />

                                    <MiniStat
                                        label="تصاویر"
                                        value={formatNumber(totalImagesCount)}
                                    />

                                    <MiniStat
                                        label="واریانت"
                                        value={formatNumber(
                                            safeProduct.variant_count ??
                                            normalizedVariants.length ??
                                            0,
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-8">
                        <section className="space-y-4">
                            <SectionHeader
                                title="خلاصه مدیریتی"
                                description="اطلاعات اصلی محصول برای بررسی سریع"
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <InfoCard
                                    label="شناسه"
                                    value={toPersianDigits(safeProduct.id)}
                                />

                                <InfoCard
                                    label="نوع محصول"
                                    valueNode={
                                        isSingle ? (
                                            <AdminStatusBadge
                                                type="active"
                                                label="ساده"
                                            />
                                        ) : (
                                            <AdminStatusBadge
                                                type="featured"
                                                label="گروهی"
                                            />
                                        )
                                    }
                                />

                                <InfoCard
                                    label="وضعیت فایل صوتی"
                                    valueNode={
                                        voiceFile ? (
                                            <AdminStatusBadge
                                                type="active"
                                                label="دارد"
                                            />
                                        ) : (
                                            <AdminStatusBadge
                                                type="inactive"
                                                label="ندارد"
                                            />
                                        )
                                    }
                                />

                                <InfoCard
                                    label="دسته‌بندی والد"
                                    value={parentCategoryLabel}
                                />

                                <InfoCard
                                    label="دسته‌بندی فرزند"
                                    value={childCategoryLabel}
                                />

                                <InfoCard
                                    label="گروه بویایی"
                                    value={scentFamilyName}
                                />

                                <InfoCard
                                    label="پرفروش‌ترین"
                                    valueNode={
                                        boolify(safeProduct.is_best_seller) ? (
                                            <AdminStatusBadge
                                                type="featured"
                                                label="پرفروش"
                                            />
                                        ) : (
                                            <AdminStatusBadge
                                                type="not-featured"
                                                label="پرفروش نیست"
                                            />
                                        )
                                    }
                                />

                                <InfoCard
                                    label="تاریخ ایجاد"
                                    value={formatDateTime(
                                        safeProduct.created_at,
                                    )}
                                />

                                <InfoCard
                                    label="آخرین بروزرسانی"
                                    value={formatDateTime(
                                        safeProduct.updated_at,
                                    )}
                                />
                            </div>
                        </section>
                    </div>
                </section>

                <Divider className="!my-4 md:!my-6" />

                <section className="space-y-4">
                    <SectionHeader
                        title="گروه بویایی"
                        description="گروه بویایی انتخاب‌شده برای این محصول"
                    />

                    <ScentFamilyBlock
                        id={scentFamilyId}
                        name={scentFamilyName}
                        imageUrl={scentFamilyImage}
                        isActive={safeProduct.scent_family_data?.is_active}
                    />
                </section>

                <Divider className="!my-4 md:!my-6" />

                <section className="space-y-4">
                    <SectionHeader
                        title="توضیحات محصول"
                        description="متن توضیحات قابل نمایش یا مدیریتی محصول"
                    />

                    <TextBlock
                        title="توضیح کامل"
                        value={safeProduct.description}
                    />
                </section>

                <Divider className="!my-4 md:!my-6" />

                <section className="space-y-4">
                    <SectionHeader
                        title="فایل صوتی محصول"
                        description="پیش‌نمایش فایل صوتی متصل به محصول"
                    />

                    {voiceFile ? (
                        <div className="rounded-3xl border border-neutral-200 bg-white p-4 md:p-5">
                            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-800">
                                <Music4 size={18} />
                                پیش‌نمایش فایل صوتی
                            </div>

                            <audio
                                controls
                                preload="none"
                                src={voiceFile}
                                className="w-full"
                            >
                                مرورگر شما از پخش فایل صوتی پشتیبانی نمی‌کند
                            </audio>

                            <div className="mt-4 break-all rounded-2xl bg-neutral-50 p-3 text-xs leading-6 text-neutral-500">
                                {voiceFile}
                            </div>
                        </div>
                    ) : (
                        <EmptyState message="فایل صوتی برای این محصول ثبت نشده است" />
                    )}
                </section>

                <Divider className="!my-4 md:!my-6" />

                <section className="space-y-4">
                    <SectionHeader
                        title="تصاویر محصول"
                        description="تصاویر عمومی محصول، جدا از تصاویر واریانت‌ها"
                    />

                    <ProductImagesGrid images={productImages.map((image, index) => ({ ...image, id: Number(image.id) || index + 1 }))} />
                </section>

                <Divider className="!my-4 md:!my-6" />

                <section className="space-y-4">
                    <SectionHeader
                        title={isSingle ? "قیمت و موجودی" : "واریانت‌ها"}
                        description={
                            isSingle
                                ? "برای محصول ساده فقط اولین واریانت معتبر نمایش داده می‌شود"
                                : "لیست واریانت‌ها، قیمت‌ها و موجودی هرکدام"
                        }
                    />

                    <ProductVariantsTable
                        variants={normalizedVariants.map((variant, index) => ({
                            id: Number(variant.id) || index + 1,
                            price: variant.price,
                            stock_qty: variant.stock_qty,
                            stock: variant.stock_qty,
                            volume_ml: variant.volume_ml ?? null,
                            label: variant.label,
                            is_active:
                                variant.is_active !== undefined
                                    ? variant.is_active
                                    : 1,
                            images: Array.isArray(variant.images)
                                ? variant.images.map((image, imageIndex) => ({ ...image, id: Number(image.id) || imageIndex + 1, is_main: image.is_main ?? false }))
                                : [],
                        }))}
                    />
                </section>

                {!isSingle ? (
                    <>
                        <Divider className="!my-4 md:!my-6" />

                        <section className="space-y-4">
                            <SectionHeader
                                title="تصاویر هر واریانت"
                                description="برای محصولات گروهی، تصاویر اختصاصی هر واریانت در این بخش نمایش داده می‌شود"
                            />

                            {normalizedVariants.length > 0 ? (
                                <div className="space-y-4 md:space-y-6">
                                    {normalizedVariants.map(
                                        (variant, variantIndex) => {
                                            const variantImages = Array.isArray(
                                                variant.images,
                                            )
                                                ? variant.images.filter(
                                                    (image) =>
                                                        image?.image_url?.trim(),
                                                )
                                                : [];

                                            return (
                                                <VariantImagesBlock
                                                    key={
                                                        variant.id ||
                                                        `${variant.label}-${variantIndex}`
                                                    }
                                                    variant={variant}
                                                    variantIndex={variantIndex}
                                                    images={variantImages}
                                                />
                                            );
                                        },
                                    )}
                                </div>
                            ) : (
                                <EmptyState message="این محصول هیچ واریانتی ندارد" />
                            )}
                        </section>
                    </>
                ) : null}
            </div>
        </AdminModal>
    );
}

function SectionHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <h3 className="text-base font-black text-neutral-900">{title}</h3>

            {description ? (
                <p className="text-xs leading-6 text-neutral-500">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

function MiniStat({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-2xl bg-neutral-50 p-3">
            <div className="text-xs text-neutral-500">{label}</div>

            <div className="mt-1 break-words text-xs font-black text-neutral-900 md:text-sm">
                {value || "-"}
            </div>
        </div>
    );
}

function InfoCard({
    label,
    value,
    valueNode,
}: {
    label: string;
    value?: string | number;
    valueNode?: ReactNode;
}) {
    return (
        <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="text-xs text-neutral-500">{label}</div>

            <div className="mt-2 break-words text-sm font-bold text-neutral-900">
                {valueNode ?? value ?? "-"}
            </div>
        </div>
    );
}

function TextBlock({
    title,
    value,
}: {
    title: string;
    value?: string | null;
}) {
    return (
        <div className="rounded-3xl border border-neutral-100 bg-white p-4">
            <h4 className="mb-3 text-sm font-black text-neutral-800">
                {title}
            </h4>

            <p className="whitespace-pre-wrap text-sm leading-8 text-neutral-600">
                {value || "—"}
            </p>
        </div>
    );
}

function ScentFamilyBlock({
    id,
    name,
    imageUrl,
    isActive,
}: {
    id?: string | number | null;
    name?: string | null;
    imageUrl?: string | null;
    isActive?: boolean | number | null;
}) {
    const safeName = name?.trim() || "-";
    const safeImageUrl = imageUrl?.trim() || "";
    const hasRealScentFamily = safeName !== "-";

    return (
        <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 lg:col-span-3">
                    {safeImageUrl ? (
                        <div className="border-b border-neutral-100 bg-neutral-50 p-3 md:border-b-0 md:border-l">
                            <Image
                                src={safeImageUrl}
                                alt={safeName}
                                className="w-full rounded-2xl object-cover"
                                style={{
                                    height: 220,
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex h-[220px] items-center justify-center border-b border-dashed border-neutral-200 bg-neutral-50 px-4 text-center text-sm text-neutral-400 md:border-b-0 md:border-l">
                            تصویری برای گروه بویایی ثبت نشده است
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center gap-4 p-4 md:col-span-8 lg:col-span-9 md:p-5">
                    <div>
                        <div className="text-xs font-bold text-neutral-500">
                            نام گروه بویایی
                        </div>

                        <div className="mt-2 text-lg font-black text-neutral-900">
                            {safeName}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoCard
                            label="شناسه گروه"
                            value={
                                id !== null && id !== undefined
                                    ? toPersianDigits(id)
                                    : "-"
                            }
                        />

                        <InfoCard
                            label="وضعیت گروه"
                            valueNode={
                                hasRealScentFamily ? (
                                    isActive === undefined ||
                                        isActive === null ||
                                        boolify(isActive) ? (
                                        <AdminStatusBadge
                                            type="active"
                                            label="فعال"
                                        />
                                    ) : (
                                        <AdminStatusBadge
                                            type="inactive"
                                            label="غیرفعال"
                                        />
                                    )
                                ) : (
                                    <AdminStatusBadge
                                        type="draft"
                                        label="ثبت نشده"
                                    />
                                )
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function VariantImagesBlock({
    variant,
    variantIndex,
    images,
}: {
    variant: NormalizedVariant;
    variantIndex: number;
    images: NormalizedVariantImage[];
}) {
    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 border-b border-neutral-100 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h4 className="text-sm font-black text-neutral-900">
                        واریانت {toPersianDigits(variantIndex + 1)}
                    </h4>

                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-neutral-500 sm:grid-cols-2 lg:grid-cols-4">
                        <span>
                            شناسه:{" "}
                            {variant.id ? toPersianDigits(variant.id) : "-"}
                        </span>

                        <span>عنوان: {variant.label || "-"}</span>

                        <span>
                            قیمت:{" "}
                            {variant.price ? formatPrice(variant.price) : "-"}
                        </span>

                        <span>
                            موجودی: {formatNumber(variant.stock_qty ?? 0)}
                        </span>
                    </div>
                </div>

                <div>
                    {boolify(
                        variant.is_active !== undefined
                            ? variant.is_active
                            : 1,
                    ) ? (
                        <AdminStatusBadge type="active" label="فعال" />
                    ) : (
                        <AdminStatusBadge type="inactive" label="غیرفعال" />
                    )}
                </div>
            </div>

            {images.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {images.map((image, imageIndex) => (
                        <div
                            key={
                                image.id || `${image.image_url}-${imageIndex}`
                            }
                            className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50"
                        >
                            <div className="p-3">
                                <Image
                                    src={image.image_url}
                                    alt={`variant-image-${variantIndex}-${imageIndex}`}
                                    className="w-full rounded-xl object-cover"
                                    style={{
                                        height: 220,
                                        objectFit: "cover",
                                    }}
                                />
                            </div>

                            <div className="space-y-2 border-t border-neutral-100 px-4 py-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-neutral-500">
                                        تصویر
                                    </span>

                                    <span className="font-bold text-neutral-900">
                                        {toPersianDigits(imageIndex + 1)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-neutral-500">
                                        نوع تصویر
                                    </span>

                                    <span>
                                        {boolify(image.is_main) ? (
                                            <AdminStatusBadge
                                                type="featured"
                                                label="تصویر اصلی"
                                            />
                                        ) : (
                                            <AdminStatusBadge
                                                type="draft"
                                                label="تصویر فرعی"
                                            />
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState message="برای این واریانت تصویری ثبت نشده است" />
            )}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm leading-7 text-neutral-500 md:p-8">
            {message}
        </div>
    );
}

function formatDateTime(value?: string | Date | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
