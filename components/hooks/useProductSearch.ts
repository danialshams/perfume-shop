"use client";

import { useEffect, useState } from "react";
import { FERTINI_DEMOS } from "@/lib/fertini-demo";

export type SearchProduct = {
    id: number | string;
    name: string;
    slug: string;
    image: string | null;
    volumesMl: number[];
    href?: string;
    demo?: boolean;
};

type UseProductSearchOptions = {
    enabled?: boolean;
    debounceMs?: number;
    limit?: number;
};

type UseProductSearchResult = {
    products: SearchProduct[];
    loading: boolean;
    error: string | null;
    hasSearched: boolean;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(
    value: unknown,
): value is UnknownRecord {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function getString(
    value: unknown,
    fallback = "",
): string {
    return typeof value === "string"
        ? value
        : fallback;
}

function normalizeVolume(
    value: unknown,
): number | null {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return null;
    }

    const normalizedValue =
        typeof value === "string"
            ? value
                  .replace(/[^\d.]/g, "")
                  .trim()
            : value;

    if (normalizedValue === "") {
        return null;
    }

    const numericValue = Number(normalizedValue);

    if (
        !Number.isFinite(numericValue) ||
        numericValue <= 0
    ) {
        return null;
    }

    return numericValue;
}

function extractVolumesFromArray(
    values: unknown[],
): number[] {
    const volumes: number[] = [];

    for (const value of values) {
        const directVolume = normalizeVolume(value);

        if (directVolume !== null) {
            volumes.push(directVolume);
            continue;
        }

        if (!isRecord(value)) {
            continue;
        }

        const recordVolume = normalizeVolume(
            value.volume_ml ??
                value.volume ??
                value.size_ml ??
                value.size,
        );

        if (recordVolume !== null) {
            volumes.push(recordVolume);
        }
    }

    return volumes;
}

function getProductVolumes(
    product: UnknownRecord,
): number[] {
    const volumes: number[] = [];

    /*
     * پشتیبانی از حجم مستقیم روی خود محصول.
     */
    const directVolume = normalizeVolume(
        product.volume_ml,
    );

    if (directVolume !== null) {
        volumes.push(directVolume);
    }

    /*
     * پشتیبانی از آرایه‌ی volumes.
     */
    if (Array.isArray(product.volumes)) {
        volumes.push(
            ...extractVolumesFromArray(
                product.volumes,
            ),
        );
    }

    /*
     * پشتیبانی از آرایه‌ی volumes_ml.
     */
    if (Array.isArray(product.volumes_ml)) {
        volumes.push(
            ...extractVolumesFromArray(
                product.volumes_ml,
            ),
        );
    }

    /*
     * پشتیبانی از رشته‌ای مانند:
     * "50,100,200"
     */
    if (typeof product.volumes_ml === "string") {
        volumes.push(
            ...product.volumes_ml
                .split(",")
                .map(normalizeVolume)
                .filter(
                    (
                        volume,
                    ): volume is number =>
                        volume !== null,
                ),
        );
    }

    /*
     * پشتیبانی از variants.
     */
    if (Array.isArray(product.variants)) {
        volumes.push(
            ...extractVolumesFromArray(
                product.variants,
            ),
        );
    }

    /*
     * پشتیبانی از product_variants.
     */
    if (
        Array.isArray(
            product.product_variants,
        )
    ) {
        volumes.push(
            ...extractVolumesFromArray(
                product.product_variants,
            ),
        );
    }

    /*
     * حذف حجم‌های تکراری و مرتب‌سازی صعودی.
     */
    return Array.from(new Set(volumes)).sort(
        (first, second) => first - second,
    );
}

function getProductImage(
    product: UnknownRecord,
): string | null {
    const directImageFields = [
        product.main_image,
        product.image,
        product.image_url,
        product.thumbnail,
        product.thumbnail_url,
    ];

    for (const image of directImageFields) {
        if (
            typeof image === "string" &&
            image.trim()
        ) {
            return image;
        }
    }

    if (Array.isArray(product.images)) {
        const mainImage = product.images.find(
            (item) => {
                if (!isRecord(item)) {
                    return false;
                }

                return (
                    item.is_main === true ||
                    item.is_main === 1 ||
                    item.is_main === "1"
                );
            },
        );

        if (isRecord(mainImage)) {
            const imageUrl =
                mainImage.image_url ??
                mainImage.url ??
                mainImage.image;

            if (
                typeof imageUrl === "string" &&
                imageUrl.trim()
            ) {
                return imageUrl;
            }
        }

        const firstImage =
            product.images.find(isRecord);

        if (isRecord(firstImage)) {
            const imageUrl =
                firstImage.image_url ??
                firstImage.url ??
                firstImage.image;

            if (
                typeof imageUrl === "string" &&
                imageUrl.trim()
            ) {
                return imageUrl;
            }
        }
    }

    if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
            if (!isRecord(variant)) {
                continue;
            }

            if (!Array.isArray(variant.images)) {
                continue;
            }

            const firstVariantImage =
                variant.images.find(isRecord);

            if (!isRecord(firstVariantImage)) {
                continue;
            }

            const imageUrl =
                firstVariantImage.image_url ??
                firstVariantImage.url ??
                firstVariantImage.image;

            if (
                typeof imageUrl === "string" &&
                imageUrl.trim()
            ) {
                return imageUrl;
            }
        }
    }

    return null;
}

function extractItems(
    payload: unknown,
): unknown[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!isRecord(payload)) {
        return [];
    }

    if (Array.isArray(payload.items)) {
        return payload.items;
    }

    if (Array.isArray(payload.products)) {
        return payload.products;
    }

    if (isRecord(payload.data)) {
        if (Array.isArray(payload.data.items)) {
            return payload.data.items;
        }

        if (
            Array.isArray(
                payload.data.products,
            )
        ) {
            return payload.data.products;
        }

        if (
            isRecord(payload.data.data) &&
            Array.isArray(
                payload.data.data.items,
            )
        ) {
            return payload.data.data.items;
        }

        if (
            isRecord(payload.data.data) &&
            Array.isArray(
                payload.data.data.products,
            )
        ) {
            return payload.data.data.products;
        }
    }

    return [];
}

function normalizeProducts(
    payload: unknown,
): SearchProduct[] {
    return extractItems(payload)
        .filter(isRecord)
        .map((product) => {
            const id =
                typeof product.id === "number" ||
                typeof product.id ===
                    "string"
                    ? product.id
                    : "";

            const name = getString(
                product.name,
            ).trim();

            const slug = getString(
                product.slug,
                String(id),
            ).trim();

            return {
                id,
                name,
                slug,
                image: getProductImage(product),
                volumesMl:
                    getProductVolumes(product),
            };
        })
        .filter((product) => {
            return (
                product.id !== "" &&
                product.name.length > 0
            );
        });
}

function extractErrorMessage(
    payload: unknown,
): string | null {
    if (!isRecord(payload)) {
        return null;
    }

    if (
        typeof payload.message === "string" &&
        payload.message.trim()
    ) {
        return payload.message;
    }

    if (
        isRecord(payload.error) &&
        typeof payload.error.message ===
            "string"
    ) {
        return payload.error.message;
    }

    return null;
}

function normalized(value:string){
  return value.toLocaleLowerCase("fa").normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g,"").replace(/ي/g,"ی").replace(/ك/g,"ک").trim();
}
/** Clearly identified demo results are used when the real products API is offline. */
function demoResults(query:string,limit:number):SearchProduct[]{
  const q=normalized(query);
  return FERTINI_DEMOS.filter(product=>{
    const family=product.family==="woody"?"چوبی دودی":product.family==="floral"?"گلی لطیف":"گرم شرقی";
    const terms=[product.name,product.id,product.description,product.subtitle,family,"عطر",
      ...product.accords,...product.notes.top,...product.notes.heart,...product.notes.base].join(" ");
    return normalized(terms).includes(q);
  }).slice(0,limit).map(product=>({
    id:product.id,name:product.name,slug:product.id,image:product.image,
    volumesMl:product.variants.map(v=>v.volume),href:"/fragrance/"+product.id,demo:true,
  }));
}

export function useProductSearch(
    query: string,
    options: UseProductSearchOptions = {},
): UseProductSearchResult {
    const {
        enabled = true,
        debounceMs = 350,
        limit = 10,
    } = options;

    const [products, setProducts] = useState<
        SearchProduct[]
    >([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] = useState<
        string | null
    >(null);

    const [hasSearched, setHasSearched] =
        useState(false);

    useEffect(() => {
        const normalizedQuery = query.trim();

        /*
         * وقتی جست‌وجو بسته شده یا تعداد
         * کاراکترها کافی نیست، تمام stateهای
         * جست‌وجوی قبلی پاک می‌شوند.
         */
        if (
            !enabled ||
            normalizedQuery.length < 2
        ) {
            setProducts([]);
            setLoading(false);
            setError(null);
            setHasSearched(false);

            return;
        }

        const controller =
            new AbortController();

        // Show matching demo inventory immediately while the live API is queried.
        // This remains useful when the preview's database is intentionally offline.
        const immediateDemos=demoResults(normalizedQuery,limit);
        setProducts(immediateDemos);
        setLoading(immediateDemos.length===0);
        setError(null);
        setHasSearched(immediateDemos.length>0);

        const timeoutId = window.setTimeout(
            async () => {
                try {
                    const searchParams =
                        new URLSearchParams({
                            q: normalizedQuery,
                            page: "1",
                            limit: String(limit),
                            sort: "newest",
                        });

                    const response = await fetch(
                        `/api/v1/products/search?${searchParams.toString()}`,
                        {
                            method: "GET",
                            headers: {
                                Accept: "application/json",
                            },
                            cache: "no-store",
                            signal: controller.signal,
                        },
                    );

                    let payload: unknown = null;

                    try {
                        payload =
                            await response.json();
                    } catch {
                        payload = null;
                    }

                    if (!response.ok) {
                        throw new Error(
                            extractErrorMessage(
                                payload,
                            ) ??
                                "جست‌وجوی محصولات ناموفق بود.",
                        );
                    }

                    if (
                        controller.signal.aborted
                    ) {
                        return;
                    }

                    const live=normalizeProducts(payload);
                    const samples=demoResults(normalizedQuery,limit);
                    const known=new Set(live.map(item=>normalized(item.name)));
                    setProducts([...live,...samples.filter(item=>!known.has(normalized(item.name)))].slice(0,limit));

                    setHasSearched(true);
                } catch (
                    requestError: unknown
                ) {
                    if (
                        requestError instanceof
                            DOMException &&
                        requestError.name ===
                            "AbortError"
                    ) {
                        return;
                    }

                    if (
                        controller.signal.aborted
                    ) {
                        return;
                    }

                    const samples=demoResults(normalizedQuery,limit);
                    setProducts(samples);
                    setHasSearched(true);
                    if(samples.length){setError(null);return;}
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "خطایی هنگام جست‌وجوی محصولات رخ داد.",
                    );
                } finally {
                    if (
                        !controller.signal.aborted
                    ) {
                        setLoading(false);
                    }
                }
            },
            debounceMs,
        );

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [
        query,
        enabled,
        debounceMs,
        limit,
    ]);

    return {
        products,
        loading,
        error,
        hasSearched,
    };
}
