"use client";

import Image from "next/image";
import AdminStatusBadge from "../panel-sections/admin-status-badge";
import { toPersianDigits, boolify } from "../panel-sections/persian-number";
import { ProductImage } from "@/lib/product";

export default function ProductImagesGrid({
    images,
}: {
    images: ProductImage[];
}) {
    if (!images?.length) {
        return (
            <div className="rounded-3xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                تصویری برای این محصول ثبت نشده است.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
                <div
                    key={image.id}
                    className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm"
                >
                    <div className="relative aspect-square w-full bg-neutral-100">
                        <Image
                            src={image.image_url}
                            alt={"تصویر محصول"}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>

                    <div className="space-y-2 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-neutral-500">شناسه</span>
                            <span className="font-medium">{toPersianDigits(image.id)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-neutral-500">اصلی</span>
                            {boolify(image.is_main) ? (
                                <AdminStatusBadge type="featured" label="تصویر اصلی" />
                            ) : (
                                <span className="text-neutral-400">خیر</span>
                            )}
                        </div>

            
                    </div>
                </div>
            ))}
        </div>
    );
}
