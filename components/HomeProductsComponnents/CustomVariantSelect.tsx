"use client";

import { useEffect, useRef, useState } from "react";

type ProductVariant = {
    id: number;
    price: string;
    rawPrice: number | null;
    size: string;
    volumeMl?: number | string | null;
    label: string;
};

function getVariantDisplayLabel(variant: ProductVariant) {
    if (variant.volumeMl !== undefined && variant.volumeMl !== null && variant.volumeMl !== "") {
        return `${variant.volumeMl} میل`;
    }

    return variant.label || variant.size || "واریانت";
}

export default function CustomVariantSelect({
    variants,
    selectedId,
    onChange,
}: {
    variants: ProductVariant[];
    selectedId: number;
    onChange: (id: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedVariant =
        variants.find((v) => Number(v.id) === Number(selectedId)) || variants[0];

    const displayLabel = selectedVariant ? getVariantDisplayLabel(selectedVariant) : "";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-[12px] border border-[#e2e8f0] bg-white px-3 py-2 text-[11px] shadow-sm transition-all hover:border-[#cbd5e1]"
            >
                <div className="min-w-0 text-right">
                    <div className="truncate font-medium text-[#1e293b]">
                        {displayLabel || "انتخاب کنید"}
                    </div>
                    {selectedVariant?.price && (
                        <div className="mt-0.5 text-[10px] text-[#64748b]">
                            {selectedVariant.price}
                        </div>
                    )}
                </div>

                <svg
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-xl">
                    <div className="max-h-[220px] overflow-y-auto py-1">
                        {variants.map((variant) => {
                            const isSelected = Number(selectedId) === Number(variant.id);
                            const variantLabel = getVariantDisplayLabel(variant);

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(Number(variant.id));
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-right transition-colors ${isSelected
                                            ? "bg-slate-50 font-semibold text-[#0f172a]"
                                            : "text-[#475569] hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[11px]">
                                            {variantLabel}
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-[#64748b]">
                                            {variant.price || "تماس بگیرید"}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
