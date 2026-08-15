"use client";

import { Button, Card, Image, Tag } from "antd";
import { Hash, Pencil, Trash2 } from "lucide-react";

import AdminStatusBadge from "../panel-sections/admin-status-badge";
import { SliderItem } from "./slider-types";

type MobileSliderCardProps = {
    slider: SliderItem;
    onEdit: () => void;
    onDelete: () => void;
};

export default function MobileSliderCard({
    slider,
    onEdit,
    onDelete,
}: MobileSliderCardProps) {
    const isActive = slider.is_active === true || slider.is_active === 1;

    return (
        <Card
            className="overflow-hidden rounded-[28px] border border-neutral-100 shadow-sm"
            styles={{
                body: {
                    padding: 16,
                },
            }}
        >
            <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl bg-neutral-100">
                    {slider.image_url ? (
                        <Image
                            src={slider.image_url}
                            alt={slider.product_name || slider.title || "slider"}
                            preview={false}
                            fallback="data:application/octet-stream;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                            className="!block w-full object-cover"
                            style={{
                                width: "100%",
                                height: 180,
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <div className="flex h-[180px] items-center justify-center text-xs text-neutral-500">
                            بدون تصویر
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="line-clamp-2 text-sm font-black leading-6 text-neutral-900">
                        {slider.product_name || "بدون محصول"}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {slider.placement === "PRODUCTS"
                            ? "صفحه محصولات"
                            : "صفحه اصلی"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isActive ? (
                        <AdminStatusBadge type="active" label="فعال" />
                    ) : (
                        <AdminStatusBadge type="inactive" label="غیرفعال" />
                    )}

                    {slider.placement === "PRODUCTS" ? (
                        <Tag color="blue">صفحه محصولات</Tag>
                    ) : (
                        <Tag color="purple">صفحه اصلی</Tag>
                    )}
                </div>

                <div className="rounded-2xl bg-neutral-50 px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <Hash size={13} />
                        <span>شناسه</span>
                    </div>

                    <div className="truncate text-xs font-bold text-neutral-900">
                        {slider.id}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                        type="primary"
                        icon={<Pencil size={16} />}
                        onClick={onEdit}
                        className="h-10 rounded-xl"
                        block
                    >
                        ویرایش
                    </Button>

                    <Button
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={onDelete}
                        className="h-10 rounded-xl"
                        block
                    >
                        حذف
                    </Button>
                </div>
            </div>
        </Card>
    );
}
