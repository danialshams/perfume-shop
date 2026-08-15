"use client";

import { Table } from "antd";

import AdminStatusBadge from "../panel-sections/admin-status-badge";
import { formatPrice, getVariantStock, ProductVariant } from "@/lib/product";
import { toPersianDigits, formatNumber, boolify } from "../panel-sections/persian-number";

export default function ProductVariantsTable({
    variants,
}: {


    variants: ProductVariant[];
}) {
    return (
        <div className="overflow-hidden rounded-3xl border border-neutral-100">
            <Table<ProductVariant>
                rowKey="id"
                dataSource={variants}
                pagination={false}
                scroll={{ x: 900 }}
                columns={[
                    {
                        title: "شناسه",
                        dataIndex: "id",
                        key: "id",
                        width: 90,
                        render: (value) => toPersianDigits(value),
                    },
                    
                    {
                        title: "حجم",
                        dataIndex: "volume_ml",
                        key: "volume_ml",
                        width: 120,
                        render: (value) =>
                            value !== null && value !== undefined
                                ? `${formatNumber(Number(value))} ml`
                                : "-",
                    },
                    {
                        title: "قیمت",
                        key: "price",
                        width: 160,
                        render: (_, record) => {
                            const discountPrice =
                                record.discount_price !== null &&
                                    record.discount_price !== undefined
                                    ? Number(record.discount_price)
                                    : null;

                            const basePrice =
                                record.price !== null && record.price !== undefined
                                    ? Number(record.price)
                                    : 0;

                            const finalPrice =
                                discountPrice !== null && discountPrice > 0
                                    ? discountPrice
                                    : basePrice;

                            return formatPrice(finalPrice);
                        },
                    },
                    {
                        title: "قیمت قبل",
                        key: "compare_at_price",
                        width: 160,
                        render: (_, record) => {
                            const compareAtPrice =
                                record.compare_at_price !== null &&
                                    record.compare_at_price !== undefined
                                    ? Number(record.compare_at_price)
                                    : null;

                            return compareAtPrice !== null && compareAtPrice > 0
                                ? formatPrice(compareAtPrice)
                                : "-";
                        },
                    },
                    {
                        title: "موجودی",
                        key: "stock",
                        width: 120,
                        render: (_, record) => {
                            return formatNumber(getVariantStock(record));
                        },
                    },

                    {
                        title: "رزرو",
                        dataIndex: "reserved_stock_qty",
                        key: "reserved_stock_qty",
                        width: 100,
                        render: (value) => formatNumber(Number(value ?? 0)),
                    },
                    {
                        title: "پیش‌فرض",
                        dataIndex: "is_default",
                        key: "is_default",
                        width: 110,
                        render: (value) =>
                            boolify(value) ? (
                                <AdminStatusBadge type="featured" label="بله" />
                            ) : (
                                <span className="text-neutral-400">خیر</span>
                            ),
                    },
                    {
                        title: "وضعیت",
                        dataIndex: "status",
                        key: "status",
                        width: 140,
                        render: (value) =>
                            value === "ACTIVE" ? (
                                <AdminStatusBadge type="active" label="فعال" />
                            ) : (
                                <AdminStatusBadge type="inactive" label="غیرفعال" />
                            ),
                    },
                ]}
            />
        </div>
    );
}
