"use client";

import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";

import { CartItemCardProps } from "./cart.types";
import { formatPrice } from "./cart.utils";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const T = {
    ink1: "#1A1A1A",
    ink2: "#5A5A5A",
    ink3: "#8A8A8A",
    hairline: "#E6E4E1",
    paper: "#FBFAF9",
    smoke: "#F4F3F1",
    smokeDeep: "#EDEBE8",

    smoky: "#3D3D3D",
    smokyHover: "#343434",
    smokyEdge: "#2E2E2E",
    onSmoky: "#F8F8F8",

    danger: "#9A5B5B",
    scrim: "rgba(26,26,26,0.55)",

    modalBg: "#FFFFFF",
    radiusSm: "6px",
    radiusMd: "8px",
    radiusLg: "10px",
} as const;

const stripCurrency = (s: string) => s.replace(/\s*(تومان|تومن)$/i, "").trim();

/* ------------------------------------------------------------------ */
/*  ProductImage                                                       */
/* ------------------------------------------------------------------ */

const IMAGE_FIELDS = [
    "product_image",
    "image",
    "image_url",
    "imageUrl",
    "thumbnail",
    "thumb",
    "cover",
    "main_image",
] as const;

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

function collectImageCandidates(source: unknown): string[] {
    console.log("[ProductImage] ---------------- collectImageCandidates:start ----------------");
    console.log("[ProductImage] source:", source);
    console.log("[ProductImage] source type:", typeof source);

    if (!source || typeof source !== "object") {
        console.warn("[ProductImage] source معتبر نیست یا object نیست:", source);
        return [];
    }

    const obj = source as Record<string, unknown>;
    const out: string[] = [];

    console.log("[ProductImage] top-level keys:", Object.keys(obj));
    console.log("[ProductImage] product_image exact:", obj.product_image);
    console.log("[ProductImage] main_image exact:", obj.main_image);
    console.log("[ProductImage] image exact:", obj.image);
    console.log("[ProductImage] image_url exact:", obj.image_url);
    console.log("[ProductImage] images exact:", obj.images);
    console.log("[ProductImage] variants exact:", obj.variants);

    if (obj.product_image && typeof obj.product_image === "object") {
        console.log(
            "[ProductImage] product_image object keys:",
            Object.keys(obj.product_image as Record<string, unknown>),
        );
        console.log("[ProductImage] product_image raw object:", obj.product_image);
    }

    const pushString = (value: string, label: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        out.push(trimmed);
        console.log(`[ProductImage] pushed string from ${label}:`, trimmed);
    };

    const push = (v: unknown, label = "unknown") => {
        console.log(`[ProductImage] push() called from ${label}:`, v);

        if (isNonEmptyString(v)) {
            pushString(v, label);
            return;
        }

        if (Array.isArray(v)) {
            console.log(`[ProductImage] ${label} is array:`, v);

            for (let i = 0; i < v.length; i++) {
                const item = v[i];
                const itemLabel = `${label}[${i}]`;

                if (isNonEmptyString(item)) {
                    pushString(item, itemLabel);
                    continue;
                }

                if (item && typeof item === "object") {
                    const nested = item as Record<string, unknown>;
                    console.log(`[ProductImage] ${itemLabel} object keys:`, Object.keys(nested));

                    if (isNonEmptyString(nested.image_url)) {
                        pushString(nested.image_url, `${itemLabel}.image_url`);
                    } else if (isNonEmptyString(nested.imageUrl)) {
                        pushString(nested.imageUrl, `${itemLabel}.imageUrl`);
                    } else if (isNonEmptyString(nested.url)) {
                        pushString(nested.url, `${itemLabel}.url`);
                    } else if (isNonEmptyString(nested.src)) {
                        pushString(nested.src, `${itemLabel}.src`);
                    } else if (isNonEmptyString(nested.path)) {
                        pushString(nested.path, `${itemLabel}.path`);
                    } else if (isNonEmptyString(nested.file)) {
                        pushString(nested.file, `${itemLabel}.file`);
                    } else {
                        console.log(
                            `[ProductImage] ${itemLabel} هیچ کلید مستقیم عکسی نداشت، بررسی nested...`,
                        );

                        if (Array.isArray(nested.images)) {
                            push(nested.images, `${itemLabel}.images`);
                        }
                    }
                }
            }

            return;
        }

        if (v && typeof v === "object") {
            const nested = v as Record<string, unknown>;
            console.log(`[ProductImage] ${label} is object with keys:`, Object.keys(nested));

            if (isNonEmptyString(nested.url)) {
                pushString(nested.url, `${label}.url`);
                return;
            }
            if (isNonEmptyString(nested.src)) {
                pushString(nested.src, `${label}.src`);
                return;
            }
            if (isNonEmptyString(nested.image_url)) {
                pushString(nested.image_url, `${label}.image_url`);
                return;
            }
            if (isNonEmptyString(nested.imageUrl)) {
                pushString(nested.imageUrl, `${label}.imageUrl`);
                return;
            }
            if (isNonEmptyString(nested.path)) {
                pushString(nested.path, `${label}.path`);
                return;
            }
            if (isNonEmptyString(nested.file)) {
                pushString(nested.file, `${label}.file`);
                return;
            }

            if (Array.isArray(nested.images)) {
                push(nested.images, `${label}.images`);
            }
        }
    };

    console.log("[ProductImage] before direct fields:", [...out]);
    for (const f of IMAGE_FIELDS) {
        push(obj[f], `obj.${f}`);
    }
    console.log("[ProductImage] after direct fields:", [...out]);

    if (obj.product && typeof obj.product === "object") {
        const p = obj.product as Record<string, unknown>;
        console.log("[ProductImage] product object detected:", p);
        console.log("[ProductImage] product object keys:", Object.keys(p));

        for (const f of IMAGE_FIELDS) {
            push(p[f], `obj.product.${f}`);
        }

        if (Array.isArray(p.images)) {
            push(p.images, "obj.product.images");
        }

        if (Array.isArray(p.variants)) {
            push(p.variants, "obj.product.variants");
        }
    }

    if (Array.isArray(obj.images)) {
        push(obj.images, "obj.images");
    }

    if (Array.isArray(obj.variants)) {
        push(obj.variants, "obj.variants");
    }

    const unique = Array.from(new Set(out));

    console.log("[ProductImage] final candidates before dedupe:", out);
    console.log("[ProductImage] final candidates unique:", unique);
    console.log("[ProductImage] ---------------- collectImageCandidates:end ----------------");

    return unique;
}

function normalizeSrc(src: string) {
    console.log("[ProductImage] normalizeSrc input:", src);

    if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) {
        console.log("[ProductImage] normalizeSrc absolute/data output:", src);
        return src;
    }

    if (src.startsWith("/")) {
        console.log("[ProductImage] normalizeSrc root-relative output:", src);
        return src;
    }

    const normalized = `/${src.replace(/^\.?\//, "")}`;
    console.log("[ProductImage] normalizeSrc normalized output:", normalized);
    return normalized;
}

function ProductImage({
    source,
    alt,
    className = "",
}: {
    source: unknown;
    alt: string;
    className?: string;
}) {
    const candidates = useMemo(() => {
        const raw = collectImageCandidates(source);
        const normalized = raw.map(normalizeSrc);

        console.log("[ProductImage] raw candidates:", raw);
        console.log("[ProductImage] normalized candidates:", normalized);

        return normalized;
    }, [source]);

    const [index, setIndex] = useState(0);
    const warned = useRef(false);

    useEffect(() => {
        console.log("[ProductImage] candidates changed, resetting index to 0");
        setIndex(0);
    }, [candidates]);

    const src = candidates[index];

    console.log("[ProductImage] current index:", index);
    console.log("[ProductImage] current src:", src);
    console.log("[ProductImage] alt:", alt);

    if (!src) {
        if (!warned.current && process.env.NODE_ENV !== "production") {
            warned.current = true;
            console.warn(
                "[CartItemCard] هیچ فیلد عکسی پیدا نشد. کلیدهای موجود:",
                source && typeof source === "object" ? Object.keys(source as Record<string, unknown>) : source,
            );
            console.warn("[CartItemCard] source کامل:", source);
        }

        return (
            <div
                className={`flex h-full w-full items-center justify-center ${className}`}
                style={{ background: T.smoke, color: T.ink3 }}
                aria-label={alt}
                role="img"
            >
                <span className="text-[16px] font-light tracking-[0.1em]">
                    {alt?.trim()?.charAt(0) ?? "—"}
                </span>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => {
                console.log("[ProductImage] image loaded successfully:", src);
            }}
            onError={() => {
                console.warn("[ProductImage] image failed to load, trying next candidate:", src);
                setIndex((i) => i + 1);
            }}
            className={`h-full w-full object-cover ${className}`}
            width={450}
            height={450}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  AnimatedPrice                                                      */
/* ------------------------------------------------------------------ */

function AnimatedPrice({
    priceStr,
    prevStr,
    increasing,
    priceKey,
    size = 16,
}: {
    priceStr: string;
    prevStr: string;
    increasing: boolean;
    priceKey: number;
    size?: number;
}) {
    return (
        <div className="flex items-baseline justify-center gap-2" dir="ltr">
            <span
                className="relative inline-flex font-light tabular-nums"
                style={{
                    fontSize: `${size}px`,
                    color: T.ink1,
                    letterSpacing: "0.03em",
                }}
            >
                {priceStr.split("").map((char, i) => {
                    const rIdx = priceStr.length - 1 - i;
                    const prevIdx = prevStr.length - 1 - rIdx;
                    const prevChar = prevIdx >= 0 ? prevStr[prevIdx] : "";
                    const changed = prevChar !== char;
                    const delay = `${rIdx * 35}ms`;

                    const base: React.CSSProperties = {
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    };

                    return (
                        <span
                            key={`${priceKey}-${rIdx}`}
                            className="relative inline-block overflow-hidden"
                            style={{
                                width: char === "," ? "0.32em" : "0.64em",
                                height: "1.3em",
                            }}
                        >
                            {changed && prevChar ? (
                                <>
                                    <span
                                        className={increasing ? "ci-price-out-down" : "ci-price-out-up"}
                                        style={{ ...base, animationDelay: delay, zIndex: 1 }}
                                    >
                                        {prevChar}
                                    </span>
                                    <span
                                        className={increasing ? "ci-price-in-down" : "ci-price-in-up"}
                                        style={{ ...base, animationDelay: delay, zIndex: 2 }}
                                    >
                                        {char}
                                    </span>
                                </>
                            ) : (
                                <span style={base}>{char}</span>
                            )}
                        </span>
                    );
                })}
            </span>
            <span
                className="font-light tracking-[0.1em]"
                style={{ fontSize: `${Math.max(10, size * 0.62)}px`, color: T.ink3 }}
            >
                t
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */

type Variant = {
    id: string | number;
    volume_ml?: number;
    price?: number;
    stock_qty?: number;
    [key: string]: unknown;
};

export default function CartItemCard({
    item,
    loading,
    optimisticQuantity,
    itemError,
    onRemove,
}: CartItemCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<string | number>(
        item.variant_id ?? "",
    );
    const [selectedVariantStock, setSelectedVariantStock] = useState(item.stock_qty ?? 0);
    const [selectedVariantPrice, setSelectedVariantPrice] = useState(
        Number(item.unit_price || 0),
    );
    const [editQuantity, setEditQuantity] = useState(item.quantity);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [animQty, setAnimQty] = useState(editQuantity);
    const [prevAnimQty, setPrevAnimQty] = useState(editQuantity);
    const [qtyIncreasing, setQtyIncreasing] = useState(true);

    const editLineTotal = editQuantity * selectedVariantPrice;
    const [animPriceStr, setAnimPriceStr] = useState(() =>
        stripCurrency(formatPrice(editLineTotal)),
    );
    const [prevPriceStr, setPrevPriceStr] = useState(() =>
        stripCurrency(formatPrice(editLineTotal)),
    );
    const [priceIncreasing, setPriceIncreasing] = useState(true);
    const [priceKey, setPriceKey] = useState(0);
    const prevPriceRef = useRef({
        str: stripCurrency(formatPrice(editLineTotal)),
        num: editLineTotal,
    });

    useEffect(() => {
        console.log("[CartItemCard] item received:", item);
        console.log("[CartItemCard] item keys:", Object.keys(item ?? {}));
        console.log("[CartItemCard] item.product_image:", item?.product_image);
        console.log("[CartItemCard] item.product_slug:", item?.product_slug);
        console.log("[CartItemCard] item.product_name:", item?.product_name);
    }, [item]);

    useEffect(() => {
        if (editQuantity !== animQty) {
            setQtyIncreasing(editQuantity > animQty);
            setPrevAnimQty(animQty);
            setAnimQty(editQuantity);
        }
    }, [editQuantity, animQty]);

    useEffect(() => {
        const total = editQuantity * selectedVariantPrice;
        const formatted = stripCurrency(formatPrice(total));
        if (formatted !== prevPriceRef.current.str) {
            setPriceIncreasing(total > prevPriceRef.current.num);
            setPrevPriceStr(prevPriceRef.current.str);
            setAnimPriceStr(formatted);
            setPriceKey((k) => k + 1);
            prevPriceRef.current = { str: formatted, num: total };
        }
    }, [editQuantity, selectedVariantPrice]);

    useEffect(() => {
        document.body.style.overflow = isEditOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isEditOpen]);

    const modalRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLHeadingElement | null>(null);
    const mobileLineRef = useRef<HTMLDivElement | null>(null);
    const desktopLineRef = useRef<HTMLDivElement | null>(null);
    const leftColRef = useRef<HTMLDivElement | null>(null);
    const rightColRef = useRef<HTMLDivElement | null>(null);
    const buttonsRef = useRef<HTMLDivElement | null>(null);
    const closeRef = useRef<HTMLButtonElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    const displayQuantity = optimisticQuantity ?? item.quantity;
    const displayLineTotal = Number(item.unit_price || 0) * displayQuantity;

    const fetchVariants = async () => {
        try {
            setLoadingVariants(true);
            setError("");

            console.log("[CartItemCard] fetching product by slug:", item.product_slug);

            const res = await fetch(
                `/api/v1/products?slug=${encodeURIComponent(item.product_slug)}`,
                { credentials: "include", headers: { Accept: "application/json" } },
            );

            console.log("[CartItemCard] fetchVariants status:", res.status);

            const json = await res.json();
            console.log("[CartItemCard] fetchVariants raw response:", json);

            const products = json?.data?.items ?? json?.data ?? json;
            const productArray = Array.isArray(products) ? products : [products];

            console.log("[CartItemCard] normalized productArray:", productArray);

            const product = productArray.find(
                (p: { slug: string }) => p?.slug === item.product_slug,
            );

            console.log("[CartItemCard] matched product from /products:", product);
            console.log("[CartItemCard] cart item image:", item.product_image);
            console.log("[CartItemCard] matched product main_image:", product?.main_image);
            console.log("[CartItemCard] matched product images:", product?.images);
            console.log("[CartItemCard] matched product variants:", product?.variants);

            if (!product) {
                setError("محصول پیدا نشد");
                return;
            }

            const variantsList: Variant[] = product?.variants ?? [];
            console.log("[CartItemCard] extracted variantsList:", variantsList);

            setVariants(variantsList);

            const current = item.variant_id
                ? variantsList.find((v) => String(v.id) === String(item.variant_id))
                : null;

            const target = current ?? variantsList[0];

            console.log("[CartItemCard] current variant:", current);
            console.log("[CartItemCard] target variant:", target);

            if (target) {
                setSelectedVariantId(target.id);
                setSelectedVariantStock(target.stock_qty ?? 0);
                setSelectedVariantPrice(Number(target.price ?? item.unit_price ?? 0));
            }
        } catch (err) {
            setError("خطا در بارگذاری انواع محصول");
            console.error("[CartItemCard] fetchVariants error:", err);
        } finally {
            setLoadingVariants(false);
        }
    };

    const openModal = () => {
        const qty = displayQuantity;
        const price = Number(item.unit_price || 0);
        const formatted = stripCurrency(formatPrice(qty * price));

        console.log("[CartItemCard] openModal item:", item);
        console.log("[CartItemCard] openModal product_image:", item.product_image);
        console.log("[CartItemCard] openModal product_slug:", item.product_slug);

        setSelectedVariantId(item.variant_id ?? "");
        setSelectedVariantStock(item.stock_qty ?? 0);
        setSelectedVariantPrice(price);
        setEditQuantity(qty);
        setAnimQty(qty);
        setPrevAnimQty(qty);
        setAnimPriceStr(formatted);
        setPrevPriceStr(formatted);
        prevPriceRef.current = { str: formatted, num: qty * price };
        setError("");
        setIsEditOpen(true);
        fetchVariants();
    };

    useLayoutEffect(() => {
        if (!isEditOpen) return;

        const targets = [
            overlayRef.current,
            modalRef.current,
            titleRef.current,
            mobileLineRef.current,
            desktopLineRef.current,
            leftColRef.current,
            rightColRef.current,
            buttonsRef.current,
            closeRef.current,
        ].filter(Boolean);

        if (prefersReducedMotion) {
            gsap.set(targets, {
                clearProps: "all",
                opacity: 1,
                y: 0,
                scaleX: 1,
                scaleY: 1,
            });
            return;
        }

        const isDesktop =
            typeof window !== "undefined" &&
            window.matchMedia("(min-width: 1024px)").matches;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.fromTo(
                overlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.45, ease: "power2.out" },
            );
            tl.fromTo(
                modalRef.current,
                { y: 26, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6 },
                "<",
            );

            if (isDesktop) {
                tl.fromTo(
                    titleRef.current,
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5 },
                    "-=0.28",
                );
                tl.fromTo(
                    desktopLineRef.current,
                    { scaleY: 0, opacity: 0 },
                    { scaleY: 1, opacity: 1, duration: 0.75, ease: "power2.inOut" },
                    "-=0.18",
                );
                tl.fromTo(
                    [rightColRef.current, leftColRef.current],
                    { y: 12, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.09 },
                    "-=0.45",
                );
            } else {
                tl.fromTo(
                    mobileLineRef.current,
                    { scaleX: 0, opacity: 0 },
                    { scaleX: 1, opacity: 1, duration: 0.85, ease: "power2.inOut" },
                    "-=0.2",
                );
                tl.fromTo(
                    titleRef.current,
                    { y: 8, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5 },
                    "-=0.3",
                );
                tl.fromTo(
                    rightColRef.current,
                    { y: 12, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.55 },
                    "-=0.2",
                );
            }

            tl.fromTo(
                buttonsRef.current,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5 },
                "-=0.3",
            );
            tl.fromTo(
                closeRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.4 },
                "-=0.35",
            );
        });

        return () => ctx.revert();
    }, [isEditOpen, prefersReducedMotion]);

    const closeModal = () => {
        if (!modalRef.current || prefersReducedMotion) {
            setIsEditOpen(false);
            return;
        }
        gsap.to(modalRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.35,
            ease: "power3.inOut",
        });
        gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 0.35,
            onComplete: () => setIsEditOpen(false),
        });
    };

    useEffect(() => {
        if (!isEditOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isEditOpen]);

    const formattedVariant = (() => {
        if (!item.variant_label) return null;
        const m = item.variant_label.match(/\d+/);
        return m ? `${m[0]} ml` : item.variant_label;
    })();

    const increaseQty = () => {
        if (editQuantity < selectedVariantStock) setEditQuantity((q) => q + 1);
    };

    const decreaseQty = () => {
        if (editQuantity > 1) setEditQuantity((q) => q - 1);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            console.log("[CartItemCard] handleSave payload:", {
                variant_id: selectedVariantId,
                quantity: editQuantity,
            });

            const res = await fetch(`/api/v1/cart/items/${item.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variant_id: selectedVariantId,
                    quantity: editQuantity,
                }),
            });

            console.log("[CartItemCard] handleSave response status:", res.status);

            if (!res.ok) throw new Error(`خطا در بروزرسانی (${res.status})`);

            const result = await res.json();
            console.log("[CartItemCard] handleSave response json:", result);

            closeModal();
            window.location.reload();
        } catch (err: unknown) {
            console.error("[CartItemCard] handleSave error:", err);
            setError(err instanceof Error ? err.message : "خطا در ذخیره");
        } finally {
            setSaving(false);
        }
    };

    const qtyBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const sortedVariants = [...variants].sort(
        (a, b) =>
            (String(a.id) === String(item.variant_id) ? 0 : 1) -
            (String(b.id) === String(item.variant_id) ? 0 : 1),
    );

    return (
        <>
            <article
                className="flex flex-col items-center border-b py-12 text-center last:border-b-0 lg:flex-row lg:items-stretch lg:gap-8 lg:py-10 lg:text-right"
                style={{ borderColor: T.hairline }}
            >
                <Link
                    href={`/products/${item.product_id}`}
                    className="relative block aspect-square w-full max-w-[260px] overflow-hidden lg:order-1 lg:w-[120px] lg:max-w-[120px] lg:shrink-0 lg:self-center"
                    style={{ background: T.smoke, borderRadius: T.radiusMd }}
                >
                    <ProductImage source={item} alt={item.product_name} />
                </Link>

                <div className="flex w-full flex-col items-center lg:order-2 lg:flex-1 lg:items-start lg:self-stretch">
                    <Link
                        href={`/products/${item.product_id}`}
                        className="mt-7 text-[14px] font-light leading-[1.8] tracking-[0.05em] transition-opacity duration-300 hover:opacity-60 lg:mt-0"
                        style={{ color: T.ink1 }}
                    >
                        {item.product_name}
                    </Link>

                    {formattedVariant && (
                        <p
                            dir="ltr"
                            className="mt-2 text-[10.5px] font-light tracking-[0.16em]"
                            style={{ color: T.ink3 }}
                        >
                            {formattedVariant}
                        </p>
                    )}

                    <div className="mt-6 lg:hidden">
                        <p
                            className="text-[17px] font-light tabular-nums tracking-[0.04em]"
                            style={{ color: T.ink1 }}
                        >
                            {formatPrice(displayLineTotal)}
                            <span
                                className="ml-2 text-[10px] font-light tracking-[0.08em]"
                                style={{ color: T.ink3 }}
                            >
                                t
                            </span>
                        </p>
                    </div>

                    <div className="hidden lg:block lg:flex-1" />

                    <div className="mt-7 flex items-center gap-5 lg:mt-0">
                        <button
                            onClick={onRemove}
                            disabled={loading}
                            className="text-[11px] font-normal tracking-[0.14em] transition-colors duration-300 hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-30"
                            style={{ color: T.ink2 }}
                        >
                            حذف
                        </button>
                        <span
                            aria-hidden="true"
                            className="h-3 w-px"
                            style={{ background: T.hairline }}
                        />
                        <button
                            onClick={openModal}
                            className="text-[11px] font-normal tracking-[0.14em] transition-colors duration-300 hover:text-[#1A1A1A]"
                            style={{ color: T.ink2 }}
                        >
                            ویرایش
                        </button>
                    </div>

                    {itemError && (
                        <p
                            className="mt-3 text-[11px] font-light leading-[1.9]"
                            style={{ color: T.danger }}
                        >
                            {itemError}
                        </p>
                    )}
                </div>

                <div className="hidden lg:order-3 lg:flex lg:shrink-0 lg:items-center lg:self-stretch">
                    <p
                        className="text-[17px] font-light tabular-nums tracking-[0.04em]"
                        style={{ color: T.ink1 }}
                    >
                        {formatPrice(displayLineTotal)}
                        <span
                            className="ml-2 text-[10px] font-light tracking-[0.08em]"
                            style={{ color: T.ink3 }}
                        >
                            t
                        </span>
                    </p>
                </div>
            </article>

            {isEditOpen && (
                <div
                    ref={overlayRef}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-8"
                    style={{ background: T.scrim, backdropFilter: "blur(2px)" }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="ویرایش سفارش"
                >
                    <div
                        ref={modalRef}
                        className="ci-noscroll ci-modal relative w-full max-w-[440px] overflow-y-auto px-7 pb-9 pt-8 lg:max-w-[900px] lg:px-14 lg:pb-12 lg:pt-11"
                        style={{
                            background: T.modalBg,
                            border: `1px solid ${T.hairline}`,
                            boxShadow: "0 24px 70px -30px rgba(26,26,26,0.22)",
                            borderRadius: T.radiusLg,
                        }}
                    >
                        <button
                            ref={closeRef}
                            onClick={closeModal}
                            className="absolute right-0 top-0 z-[100] p-4 transition-colors duration-300 hover:text-[#1A1A1A] lg:p-5"
                            style={{ color: T.ink3 }}
                            aria-label="بستن"
                        >
                            <FiX size={19} strokeWidth={1.2} />
                        </button>

                        <h3
                            ref={titleRef}
                            className="text-center text-[11px] font-medium tracking-[0.28em] lg:text-[12px]"
                            style={{ color: T.ink3 }}
                        >
                            ویرایش
                        </h3>

                        <div className="mx-auto mt-5 w-[88%] overflow-hidden lg:hidden">
                            <div
                                ref={mobileLineRef}
                                className="h-px w-full origin-center"
                                style={{ background: T.hairline }}
                            />
                        </div>

                        <div className="mt-7 lg:mt-10 lg:flex lg:items-stretch lg:gap-14">
                            <div
                                ref={rightColRef}
                                className="flex flex-col items-center lg:flex-1 lg:justify-center"
                            >
                                <div className="flex w-full flex-col items-center lg:hidden">
                                    <div
                                        className="relative aspect-square w-[142px] overflow-hidden"
                                        style={{ background: T.smoke, borderRadius: T.radiusMd }}
                                    >
                                        <ProductImage source={item} alt={item.product_name} />
                                    </div>

                                    <h4
                                        className="mt-5 text-center text-[14.5px] font-light leading-[1.75] tracking-[0.05em]"
                                        style={{ color: T.ink1 }}
                                    >
                                        {item.product_name}
                                    </h4>

                                    <div className="mt-2.5">
                                        <AnimatedPrice
                                            priceStr={animPriceStr}
                                            prevStr={prevPriceStr}
                                            increasing={priceIncreasing}
                                            priceKey={priceKey}
                                            size={16}
                                        />
                                    </div>
                                </div>

                                <span
                                    className="mt-8 block text-center text-[10.5px] font-medium tracking-[0.22em] lg:mt-0 lg:text-[11px]"
                                    style={{ color: T.ink3 }}
                                >
                                    انتخاب نوع محصول
                                </span>

                                {error && (
                                    <p
                                        className="mt-3 text-center text-[11.5px] font-light leading-[1.85]"
                                        style={{ color: T.danger }}
                                    >
                                        {error}
                                    </p>
                                )}

                                <div className="mt-5 w-full lg:mt-6">
                                    {loadingVariants ? (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-[52px] w-[52px] animate-pulse lg:h-[58px] lg:w-[58px]"
                                                    style={{
                                                        background: T.smoke,
                                                        borderRadius: T.radiusSm,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {sortedVariants.map((variant) => {
                                                const isSelected =
                                                    String(variant.id) === String(selectedVariantId);
                                                const qty = variant.stock_qty ?? 0;
                                                const isOutOfStock = qty <= 0;

                                                return (
                                                    <button
                                                        key={variant.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isOutOfStock) return;
                                                            setSelectedVariantId(variant.id);
                                                            setSelectedVariantStock(qty);
                                                            setSelectedVariantPrice(
                                                                Number(variant.price ?? 0),
                                                            );
                                                            if (editQuantity > qty) setEditQuantity(qty);
                                                        }}
                                                        disabled={isOutOfStock}
                                                        aria-pressed={isSelected}
                                                        title={isOutOfStock ? "ناموجود" : undefined}
                                                        className={[
                                                            "flex h-[52px] w-[52px] items-center justify-center transition-all duration-300 lg:h-[58px] lg:w-[58px]",
                                                            isOutOfStock
                                                                ? "cursor-not-allowed opacity-35 line-through"
                                                                : "cursor-pointer",
                                                        ].join(" ")}
                                                        style={{
                                                            background: isSelected ? T.smokeDeep : T.smoke,
                                                            border: `1px solid ${
                                                                isSelected ? T.ink3 : T.hairline
                                                            }`,
                                                            color: T.ink1,
                                                            borderRadius: T.radiusSm,
                                                        }}
                                                    >
                                                        <span
                                                            dir="ltr"
                                                            className="text-[12px] font-light leading-tight tracking-[0.05em] lg:text-[12.5px]"
                                                        >
                                                            {variant.volume_ml
                                                                ? `${variant.volume_ml} ml`
                                                                : "—"}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-8 lg:mt-9">
                                    <button
                                        onClick={increaseQty}
                                        disabled={editQuantity >= selectedVariantStock}
                                        aria-label="افزایش تعداد"
                                        className="transition-opacity duration-300 hover:opacity-50 disabled:cursor-not-allowed disabled:opacity-20"
                                        style={{ color: T.ink1 }}
                                    >
                                        <FiPlus size={15} strokeWidth={1.4} />
                                    </button>

                                    <span
                                        className="relative flex items-center justify-center overflow-hidden text-[16px] font-light tabular-nums lg:text-[17px]"
                                        style={{ width: "2ch", height: "1.5em", color: T.ink1 }}
                                    >
                                        <span
                                            key={`qty-out-${prevAnimQty}`}
                                            className={
                                                qtyIncreasing ? "ci-qty-out-down" : "ci-qty-out-up"
                                            }
                                            style={qtyBase}
                                        >
                                            {prevAnimQty}
                                        </span>
                                        <span
                                            key={`qty-in-${animQty}`}
                                            className={
                                                qtyIncreasing ? "ci-qty-in-down" : "ci-qty-in-up"
                                            }
                                            style={qtyBase}
                                        >
                                            {animQty}
                                        </span>
                                    </span>

                                    <button
                                        onClick={decreaseQty}
                                        disabled={editQuantity <= 1}
                                        aria-label="کاهش تعداد"
                                        className="transition-opacity duration-300 hover:opacity-50 disabled:cursor-not-allowed disabled:opacity-20"
                                        style={{ color: T.ink1 }}
                                    >
                                        <FiMinus size={15} strokeWidth={1.4} />
                                    </button>
                                </div>
                            </div>

                            <div
                                ref={desktopLineRef}
                                aria-hidden="true"
                                className="hidden w-px origin-center self-stretch lg:block"
                                style={{ background: T.hairline }}
                            />

                            <div
                                ref={leftColRef}
                                className="hidden flex-col items-center justify-center lg:flex lg:flex-1"
                            >
                                <div
                                    className="relative aspect-square w-full max-w-[248px] overflow-hidden"
                                    style={{ background: T.smoke, borderRadius: T.radiusMd }}
                                >
                                    <ProductImage source={item} alt={item.product_name} />
                                </div>

                                <h4
                                    className="mt-6 text-center text-[16px] font-light leading-[1.75] tracking-[0.05em]"
                                    style={{ color: T.ink1 }}
                                >
                                    {item.product_name}
                                </h4>

                                <div className="mt-3">
                                    <AnimatedPrice
                                        priceStr={animPriceStr}
                                        prevStr={prevPriceStr}
                                        increasing={priceIncreasing}
                                        priceKey={priceKey}
                                        size={18}
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            ref={buttonsRef}
                            className="mx-auto mt-9 w-full lg:mt-11 lg:max-w-[420px]"
                        >
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="ci-primary h-12 w-full text-[12px] font-normal tracking-[0.16em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45 lg:h-[52px] lg:text-[12.5px]"
                                style={{
                                    background: T.smoky,
                                    color: T.onSmoky,
                                    border: `1px solid ${T.smokyEdge}`,
                                    boxShadow: "0 8px 24px -16px rgba(26,26,26,0.45)",
                                    borderRadius: T.radiusMd,
                                }}
                            >
                                {saving ? "در حال ذخیره …" : "تایید و بروزرسانی"}
                            </button>

                            <button
                                onClick={closeModal}
                                className="mt-4 h-10 w-full text-[11.5px] font-normal tracking-[0.16em] transition-colors duration-300 hover:text-[#1A1A1A]"
                                style={{ color: T.ink3 }}
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .ci-modal {
                    max-height: calc(100dvh - 1.5rem);
                }
                @media (min-width: 1024px) {
                    .ci-modal {
                        max-height: calc(100dvh - 4rem);
                    }
                }

                .ci-noscroll {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    overscroll-behavior: contain;
                }
                .ci-noscroll::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }

                .ci-primary:hover:not(:disabled) {
                    background: ${T.smokyHover} !important;
                    box-shadow: 0 10px 26px -16px rgba(26, 26, 26, 0.5) !important;
                }
                .ci-primary:active:not(:disabled) {
                    background: ${T.smokyHover} !important;
                    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.18) !important;
                }

                .ci-price-out-up { animation: priceDigitOutUp 0.3s ease-out both; }
                .ci-price-in-up { animation: priceDigitInUp 0.3s ease-out both; }
                .ci-price-out-down { animation: priceDigitOutDown 0.3s ease-out both; }
                .ci-price-in-down { animation: priceDigitInDown 0.3s ease-out both; }

                @keyframes priceDigitOutUp { from { transform: translateY(0%); } to { transform: translateY(-100%); } }
                @keyframes priceDigitInUp { from { transform: translateY(100%); } to { transform: translateY(0%); } }
                @keyframes priceDigitOutDown { from { transform: translateY(0%); } to { transform: translateY(100%); } }
                @keyframes priceDigitInDown { from { transform: translateY(-100%); } to { transform: translateY(0%); } }

                .ci-qty-out-up { animation: qtySlideOutUp 0.3s ease-out both; }
                .ci-qty-in-up { animation: qtySlideInUp 0.3s ease-out both; }
                .ci-qty-out-down { animation: qtySlideOutDown 0.3s ease-out both; }
                .ci-qty-in-down { animation: qtySlideInDown 0.3s ease-out both; }

                @keyframes qtySlideOutUp { from { transform: translateY(0%); } to { transform: translateY(-100%); } }
                @keyframes qtySlideInUp { from { transform: translateY(100%); } to { transform: translateY(0%); } }
                @keyframes qtySlideOutDown { from { transform: translateY(0%); } to { transform: translateY(100%); } }
                @keyframes qtySlideInDown { from { transform: translateY(-100%); } to { transform: translateY(0%); } }

                @media (prefers-reduced-motion: reduce) {
                    .ci-price-out-up, .ci-price-in-up, .ci-price-out-down, .ci-price-in-down,
                    .ci-qty-out-up, .ci-qty-in-up, .ci-qty-out-down, .ci-qty-in-down {
                        animation: none !important;
                    }
                }
            `}</style>
        </>
    );
}
