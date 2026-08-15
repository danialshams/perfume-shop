"use client";

import { useMemo, useState } from "react";
import { Select } from "antd";
import { formatPrice } from "@/lib/product";
import { formatNumber } from "../panel-sections/persian-number";

type VariantOption = {
    id: number | string;
    label: string;
    price: number | string;
    stock_qty: number | string;
};

type Props = {
    variants?: VariantOption[];
};

export default function ProductPriceCell({ variants = [] }: Props) {
    const availableVariants = useMemo(
        () =>
            variants.filter((v) => Number(v.stock_qty ?? 0) > 0),
        [variants]
    );

    const [selectedVariantId, setSelectedVariantId] = useState<number | string | undefined>(
        availableVariants[0]?.id
    );

    const selectedVariant =
        availableVariants.find((v) => String(v.id) === String(selectedVariantId)) ||
        availableVariants[0];

    if (!availableVariants.length) {
        return <span className="text-neutral-400">ناموجود</span>;
    }

    return (
        <div className="min-w-[200px]">
            <div className="font-bold text-neutral-900">
                {formatPrice(Number(selectedVariant?.price ?? 0))}
            </div>

            <div className="mt-2">
                <Select
                    size="small"
                    value={selectedVariant?.id}
                    onChange={setSelectedVariantId}
                    style={{ width: "100%" }}
                    options={availableVariants.map((variant) => ({
                        value: variant.id,
                        label: `${variant.label} - موجودی ${formatNumber(Number(variant.stock_qty ?? 0))}`,
                    }))}
                />
            </div>
        </div>
    );
}
