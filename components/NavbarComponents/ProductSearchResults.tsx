"use client";

import {
    ImageIcon,
    Search,
} from "lucide-react";
import Link from "next/link";

import {
    SearchProduct,
} from "../hooks/useProductSearch";

type ProductSearchResultsProps = {
    query: string;
    products: SearchProduct[];
    loading: boolean;
    error: string | null;
    hasSearched: boolean;
    onProductClick?: () => void;
    productBasePath?: string;
};

type SearchResultSkeletonProps = {
    count?: number;
};

function formatVolume(
    volume: number,
): string {
    return Number.isInteger(volume)
        ? String(volume)
        : String(volume).replace(/\.0+$/, "");
}

function getVolumesLabel(
    volumes: number[],
): string {
    return volumes
        .map(
            (volume) =>
                `${formatVolume(volume)} میل`,
        )
        .join(" - ");
}

function SearchResultSkeleton({
    count = 5,
}: SearchResultSkeletonProps) {
    return (
        <div
            dir="rtl"
            role="status"
            aria-live="polite"
            aria-label="در حال جستجوی محصولات"
            className="w-full"
        >
            <span className="sr-only">
                در حال جستجوی محصولات...
            </span>

            <div className="space-y-1">
                {Array.from({
                    length: count,
                }).map((_, index) => (
                    <div
                        key={index}
                        aria-hidden="true"
                        className={[
                            "flex min-h-[74px] w-full",
                            "items-center rounded-[8px]",
                            "px-2 py-2",
                            "animate-pulse",
                        ].join(" ")}

                    >
                        <div
                            className={[
                                "ml-3 h-14 w-14 shrink-0",
                                "rounded-[3px]",
                                "bg-black/[0.07]",
                            ].join(" ")}
                        />


                        <div className="min-w-0 flex-1">
                            <div
                                className={[
                                    "h-[11px] rounded-full",
                                    "bg-black/[0.07]",
                                    index % 3 === 0
                                        ? "w-[58%]"
                                        : index % 3 ===
                                            1
                                            ? "w-[72%]"
                                            : "w-[46%]",
                                ].join(" ")}
                            />

                            <div
                                className={[
                                    "mt-2 h-[9px]",
                                    "w-[34%] rounded-full",
                                    "bg-black/[0.055]",
                                ].join(" ")}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProductSearchResults({
    query,
    products,
    loading,
    error,
    hasSearched,
    onProductClick,
    productBasePath = "/products",
}: ProductSearchResultsProps) {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
        return (
            <div
                dir="rtl"
                className={[
                    "flex min-h-[180px] w-full",
                    "items-center justify-center",
                ].join(" ")}
            />
        );
    }

    if (loading) {
        return (
            <SearchResultSkeleton count={5} />
        );
    }

    if (error) {
        return (
            <div
                dir="rtl"
                role="alert"
                className={[
                    "flex min-h-[180px] w-full",
                    "flex-col items-center",
                    "justify-center px-5",
                    "text-center",
                ].join(" ")}
            >
                <p className="text-[13px] font-medium text-red-600/80">
                    جست‌وجو انجام نشد
                </p>

                <p className="mt-2 max-w-[300px] text-[11px] leading-5 text-black/40">
                    {error}
                </p>
            </div>
        );
    }

    if (
        hasSearched &&
        products.length === 0
    ) {
        return (
            <div
                dir="rtl"
                className={[
                    "flex min-h-[180px] w-full",
                    "flex-col items-center",
                    "justify-center px-4",
                    "text-center",
                ].join(" ")}
            >
                <div
                    className={[
                        "flex h-11 w-11",
                        "items-center justify-center",
                        "rounded-full",
                        "bg-black/[0.035]",
                        "text-black/30",
                    ].join(" ")}
                >
                    <Search
                        aria-hidden="true"
                        className="h-5 w-5"
                        strokeWidth={1.7}
                    />
                </div>

                <p className="mt-3 text-[13px] font-medium text-black/55">
                    محصولی پیدا نشد
                </p>

                <p className="mt-1 text-[11px] leading-5 text-black/35">
                    نتیجه‌ای برای «
                    {normalizedQuery}» وجود ندارد.
                </p>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            aria-live="polite"
            className="w-full"
        >
            {products.length > 0 && (
                <div className="mb-2 flex items-center justify-between px-2">
                    <p className="text-[11px] text-black/40">
                        نتایج جست‌وجو
                    </p>

                    <span className="text-[10px] tabular-nums text-black/30">
                        {products.length} محصول
                    </span>
                </div>
            )}

            <div className="space-y-1">
                {products.map((product) => {
                    const href = `${productBasePath}/${product.id}`;



                    const volumesLabel =
                        getVolumesLabel(
                            product.volumesMl,
                        );

                    return (
                        <Link
                            key={String(
                                product.id,
                            )}
                            href={href}
                            onClick={
                                onProductClick
                            }
                            className={[
                                "group flex min-h-[74px]",
                                "w-full items-center",
                                "rounded-[8px]",
                                "bg-transparent",
                                "px-2 py-2",
                                "transition-[background-color,transform]",
                                "duration-200",
                                "hover:bg-black/[0.025]",
                                "active:scale-[0.995]",
                            ].join(" ")}

                        >
                            <div
                                className={[
                                    "ml-3 flex h-14 w-14",
                                    "shrink-0 items-center",
                                    "justify-center",
                                    "overflow-hidden",
                                    "rounded-[3px]",
                                    "border border-black/[0.045]",
                                    "bg-white/25",
                                ].join(" ")}
                            >

                                {product.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={
                                            product.image
                                        }
                                        alt={
                                            product.name
                                        }
                                        loading="lazy"
                                        className={[
                                            "h-full w-full",
                                            "object-cover",
                                            "transition-transform",
                                            "duration-300",
                                            "group-hover:scale-[1.04]",
                                        ].join(
                                            " ",
                                        )}
                                        onError={(
                                            event,
                                        ) => {
                                            event.currentTarget.style.display =
                                                "none";
                                        }}
                                    />
                                ) : (
                                    <ImageIcon
                                        aria-hidden="true"
                                        className="h-5 w-5 text-black/20"
                                        strokeWidth={
                                            1.5
                                        }
                                    />
                                )}
                            </div>

                            <div className="min-w-0 flex-1 text-right">
                                <p className="truncate text-[13px] font-medium leading-6 text-[#262626]">
                                    {product.name}
                                </p>

                                {volumesLabel && (
                                    <p
                                        className={[
                                            "mt-0.5 truncate",
                                            "text-[11px]",
                                            "font-normal",
                                            "leading-4",
                                            "text-black/40",
                                            "tabular-nums",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {
                                            volumesLabel
                                        }
                                    </p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
