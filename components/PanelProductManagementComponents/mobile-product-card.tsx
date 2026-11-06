"use client";

import Image from "next/image";
import { Button, Card, Space } from "antd";
import { Eye, PencilLine } from "lucide-react";

import AdminStatusBadge from "../panel-sections/admin-status-badge";
import { formatPrice, getMainImage, getTotalStock, getVariantPriceInfo, ProductItem } from "@/lib/product";
import { formatNumber, boolify } from "../panel-sections/persian-number";

type MobileProductCardProps = {
    product: ProductItem;
    onView: () => void;
    onEdit: () => void;
};

export default function MobileProductCard({
    product,
    onView,
    onEdit,
}: MobileProductCardProps) {
    const image = getMainImage(product);
    const totalStock = getTotalStock(product);

    const { minPrice, maxPrice, hasRange } =
        getVariantPriceInfo(product);

    return (
        <Card className="overflow-hidden !rounded-[11px] !border-[#e7e2da] !bg-[#fffefa]">
            <div className="flex gap-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-[#ece8e0]">
                    {image ? (
                        <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                            بدون تصویر
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
                        {product.name}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {product.slug}
                    </p>

                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-neutral-500">قیمت</span>

                            <span className="font-bold text-neutral-900">
                                {minPrice
                                    ? hasRange
                                        ? `${formatPrice(minPrice)} تا ${formatPrice(maxPrice)}`
                                        : formatPrice(minPrice)
                                    : "-"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <span className="text-neutral-500">موجودی</span>

                            <span className="font-bold">
                                {formatNumber(totalStock)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <span className="text-neutral-500">وضعیت</span>

                            {product.status === "ACTIVE" ? (
                                <AdminStatusBadge type="active" label="فعال" />
                            ) : product.status === "DRAFT" ? (
                                <AdminStatusBadge type="draft" label="پیش‌نویس" />
                            ) : (
                                <AdminStatusBadge type="inactive" label="غیرفعال" />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {boolify(product.is_featured) ? (
                                <AdminStatusBadge type="featured" label="ویژه" />
                            ) : null}

                            {boolify(product.is_active) ? (
                                <AdminStatusBadge type="active" label="فعال" />
                            ) : (
                                <AdminStatusBadge type="inactive" label="غیرفعال" />
                            )}
                        </div>
                    </div>

                    <Space className="mt-4" wrap>
                        <Button type="primary" onClick={onEdit}>
                            ویرایش محصول <PencilLine size={15}/>
                        </Button>
                        <Button onClick={onView}>
                            جزئیات <Eye size={15}/>
                        </Button>
                    </Space>
                </div>
            </div>
        </Card>
    );
}
