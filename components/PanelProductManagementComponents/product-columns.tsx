"use client";

import type { ColumnsType } from "antd/es/table";
import { Button, Dropdown, Image, Modal, Space } from "antd";
import { MoreVertical, Eye, Pencil, Trash2, RotateCcw } from "lucide-react";

import ProductPriceCell from "../HomeProductsComponnents/ProductPriceCell";
import AdminStatusBadge from "../panel-sections/admin-status-badge";
import { formatNumber, boolify, toPersianDigits } from "../panel-sections/persian-number";
import {
    ProductItem,
    getMainImage,
    getTotalStock,
    getProductVariants,
    getVariantLabel,
} from "@/lib/product";

type Props = {
    onView: (product: ProductItem) => void;
    onEdit?: (product: ProductItem) => void;
    onImages?: (product: ProductItem) => void;
    onVariants?: (product: ProductItem) => void;
    onDelete?: (product: ProductItem) => void;
    onRestore?: (product: ProductItem) => void;
};

// اگر مطمئنی همیشه is_active داری، می‌تونی این helper رو ساده‌تر کنی
function resolveIsActive(record: ProductItem): boolean {
    const v = (record as any)?.is_active;
    if (v === true || v === false) return v && record.status === "ACTIVE";
    if (v === 0 || v === 1) return v === 1 && record.status === "ACTIVE";

    // fallback برای داده‌های قدیمی/ناقص
    return (record as any)?.status === "ACTIVE";
}

export function getProductColumns({
    onView,
    onEdit,
    onDelete,
    onRestore,
}: Props): ColumnsType<ProductItem> {
    return [
        {
            title: "تصویر",
            key: "image",
            width: 90,
            fixed: "right",
            render: (_, record) => {
                const src = getMainImage(record);
                return (
                    <div className="flex justify-center">
                        {src ? (
                            <Image
                                src={src}
                                alt={record.name}
                                width={56}
                                height={56}
                                className="rounded-2xl object-cover"
                                preview={false}
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
                                ندارد
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "محصول",
            key: "product",
            width: 280,
            fixed: "right",
            render: (_, record) => (
                <div className="min-w-[220px]">
                    <div className="line-clamp-1 font-black text-neutral-900">{record.name}</div>
                    <div className="mt-1 text-xs text-neutral-500">{record.slug}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {record.category?.name ? (
                            <span className="text-[11px] text-neutral-500">
                                دسته: {record.category.name}
                            </span>
                        ) : null}
                    </div>
                </div>
            ),
        },
        {
            title: "قیمت",
            key: "price",
            width: 260,
            render: (_, record) => {
                const variants = getProductVariants(record).map((variant) => ({
                    ...variant,
                    label: getVariantLabel(variant),
                    stock_qty: Number(variant.stock_qty ?? variant.stock ?? 0),
                }));

                return <ProductPriceCell variants={variants} />;
            },
        },
        {
            title: "واریانت‌ها",
            key: "variants_count",
            width: 110,
            render: (_, record) => {
                const count =
                    record.variant_count !== null && record.variant_count !== undefined
                        ? Number(record.variant_count)
                        : getProductVariants(record).length;

                return formatNumber(count);
            },
        },
        {
            title: "موجودی کل",
            key: "stock",
            width: 130,
            render: (_, record) => {
                const total = getTotalStock(record);
                return total <= 5 ? (
                    <Space direction="vertical" size={2}>
                        <span className="font-bold text-red-600">{formatNumber(total)}</span>
                        <AdminStatusBadge type="low-stock" label="کم" />
                    </Space>
                ) : (
                    <Space direction="vertical" size={2}>
                        <span className="font-bold text-neutral-900">{formatNumber(total)}</span>
                        <AdminStatusBadge type="in-stock" label="موجود" />
                    </Space>
                );
            },
        },

        // ✅ فقط is_active — status حذف شد
        {
            title: "وضعیت",
            key: "is_active",
            width: 120,
            render: (_, record) => {
                const isActive = resolveIsActive(record);

                return isActive ? (
                    <AdminStatusBadge type="active" label="در فروشگاه" />
                ) : (
                    <AdminStatusBadge type="inactive" label="نمایش داده نمی‌شود" />
                );
            },
        },

        {
            title: "ویژه",
            dataIndex: "is_featured",
            key: "is_featured",
            width: 100,
            render: (value) =>
                boolify(value) ? (
                    <AdminStatusBadge type="featured" label="بله" />
                ) : (
                    <AdminStatusBadge type="not-featured" label="خیر" />
                ),
        },
        {
            title: "پرفروش",
            dataIndex: "is_best_seller",
            key: "is_best_seller",
            width: 110,
            render: (value) =>
                boolify(value) ? (
                    <AdminStatusBadge type="featured" label="بله" />
                ) : (
                    <AdminStatusBadge type="not-featured" label="خیر" />
                ),
        },
        {
            title: "شناسه",
            dataIndex: "id",
            key: "id",
            width: 90,
            render: (value) => toPersianDigits(value),
        },
        {
            title: "عملیات",
            key: "actions",
            width: 140,
            fixed: "left",
            render: (_, record) => {
                if (record.deleted_at) {
                    return (
                        <Button icon={<RotateCcw size={16} />} onClick={() => onRestore?.(record)}>
                            بازیابی
                        </Button>
                    );
                }

                return (
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                {
                                    key: "view",
                                    label: "مشاهده کامل",
                                    icon: <Eye size={16} />,
                                    onClick: () => onView(record),
                                },
                                {
                                    key: "edit",
                                    label: "ویرایش",
                                    icon: <Pencil size={16} />,
                                    onClick: () => onEdit?.(record),
                                },
                                { type: "divider" },
                                {
                                    key: "delete",
                                    danger: true,
                                    label: "حذف",
                                    icon: <Trash2 size={16} />,
                                    onClick: () => {
                                        Modal.confirm({
                                            title: "حذف محصول",
                                            content: `آیا از حذف «${record.name}» مطمئن هستید؟`,
                                            okText: "بله، حذف شود",
                                            cancelText: "انصراف",
                                            okButtonProps: { danger: true },
                                            onOk: () => onDelete?.(record),
                                        });
                                    },
                                },
                            ],
                        }}
                    >
                        <Button shape="circle" icon={<MoreVertical size={16} />} />
                    </Dropdown>
                );
            },
        },
    ];
}
