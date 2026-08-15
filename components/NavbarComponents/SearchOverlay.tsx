"use client";

import {
    Search,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";

import { createPortal } from "react-dom";

import ProductSearchResults from "./ProductSearchResults";
import { useProductSearch } from "../hooks/useProductSearch";

type SearchOverlayProps = {
    open: boolean;
    onClose: () => void;
    mode: "mobile" | "desktop";
    anchorRect?: DOMRect | null;
};

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.min(
        Math.max(value, min),
        max,
    );
}

const BLUR_IN = [
    0.2, 0.5, 0.9, 1.4, 2, 2.7, 3.5,
    4.4, 5.4, 6.4, 7.5, 8.5, 9.5,
    10.5, 11.5, 12.5, 13.4, 14.2,
    14.9, 15.4, 15.7, 15.85, 15.92,
    15.96, 15.98, 15.99, 16, 16, 16,
    16,
];

const BLUR_OUT = [...BLUR_IN].reverse();
const STEP_MS = 30;

export default function SearchOverlay({
    open,
    onClose,
    mode,
    anchorRect,
}: SearchOverlayProps) {
    const [mounted, setMounted] =
        useState(false);

    const [rendered, setRendered] =
        useState(open);

    const [query, setQuery] = useState("");

    const [
        viewportWidth,
        setViewportWidth,
    ] = useState(0);

    const [
        viewportHeight,
        setViewportHeight,
    ] = useState(0);

    const [blur, setBlur] = useState(0);

    const inputRef =
        useRef<HTMLInputElement | null>(null);

    const stepTimer =
        useRef<number | null>(null);

    const unmountTimer =
        useRef<number | null>(null);

    const {
        products,
        loading,
        error,
        hasSearched,
    } = useProductSearch(query, {
        enabled: open,
        debounceMs: 350,
        limit: 10,
    });

    useEffect(() => {
        setMounted(true);

        const updateViewport = () => {
            setViewportWidth(
                window.innerWidth,
            );

            setViewportHeight(
                window.innerHeight,
            );
        };

        updateViewport();

        window.addEventListener(
            "resize",
            updateViewport,
        );

        return () => {
            window.removeEventListener(
                "resize",
                updateViewport,
            );
        };
    }, []);

    useEffect(() => {
        if (stepTimer.current !== null) {
            window.clearInterval(
                stepTimer.current,
            );

            stepTimer.current = null;
        }

        if (
            unmountTimer.current !== null
        ) {
            window.clearTimeout(
                unmountTimer.current,
            );

            unmountTimer.current = null;
        }

        if (open) {
            setRendered(true);

            let index = 0;

            setBlur(BLUR_IN[0]);

            stepTimer.current =
                window.setInterval(() => {
                    index += 1;

                    if (
                        index >= BLUR_IN.length
                    ) {
                        setBlur(
                            BLUR_IN[
                                BLUR_IN.length -
                                    1
                            ],
                        );

                        if (
                            stepTimer.current !==
                            null
                        ) {
                            window.clearInterval(
                                stepTimer.current,
                            );

                            stepTimer.current =
                                null;
                        }

                        return;
                    }

                    setBlur(
                        BLUR_IN[index],
                    );
                }, STEP_MS);

            return () => {
                if (
                    stepTimer.current !== null
                ) {
                    window.clearInterval(
                        stepTimer.current,
                    );

                    stepTimer.current = null;
                }
            };
        }

        if (rendered) {
            let index = 0;

            setBlur(BLUR_OUT[0]);

            stepTimer.current =
                window.setInterval(() => {
                    index += 1;

                    if (
                        index >= BLUR_OUT.length
                    ) {
                        setBlur(0);

                        if (
                            stepTimer.current !==
                            null
                        ) {
                            window.clearInterval(
                                stepTimer.current,
                            );

                            stepTimer.current =
                                null;
                        }

                        return;
                    }

                    setBlur(
                        BLUR_OUT[index],
                    );
                }, STEP_MS);

            unmountTimer.current =
                window.setTimeout(() => {
                    setRendered(false);
                }, BLUR_OUT.length * STEP_MS + 140);
        }

        return () => {
            if (
                stepTimer.current !== null
            ) {
                window.clearInterval(
                    stepTimer.current,
                );

                stepTimer.current = null;
            }

            if (
                unmountTimer.current !== null
            ) {
                window.clearTimeout(
                    unmountTimer.current,
                );

                unmountTimer.current = null;
            }
        };
    }, [open, rendered]);

    /*
     * پاک‌شدن عبارت قبلی بلافاصله پس از بسته‌شدن.
     */
    useEffect(() => {
        if (open) {
            return;
        }

        setQuery("");
    }, [open]);

    useEffect(() => {
        if (!open || !rendered) {
            return;
        }

        const timeoutId = window.setTimeout(
            () => {
                inputRef.current?.focus();
            },
            180,
        );

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [open, rendered, mode]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleDocumentKeyDown = (
            event: globalThis.KeyboardEvent,
        ) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleDocumentKeyDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleDocumentKeyDown,
            );
        };
    }, [open, onClose]);

    /*
     * قفل‌کردن اسکرول صفحه اصلی برای تمام Overlayها.
     */
    useEffect(() => {
        if (!open || !rendered) {
            return;
        }

        const body = document.body;
        const html =
            document.documentElement;

        const previousBodyOverflow =
            body.style.overflow;

        const previousBodyOverscroll =
            body.style.overscrollBehavior;

        const previousHtmlOverflow =
            html.style.overflow;

        const previousHtmlOverscroll =
            html.style.overscrollBehavior;

        body.style.overflow = "hidden";
        html.style.overflow = "hidden";

        body.style.overscrollBehavior =
            "none";

        html.style.overscrollBehavior =
            "none";

        return () => {
            body.style.overflow =
                previousBodyOverflow;

            body.style.overscrollBehavior =
                previousBodyOverscroll;

            html.style.overflow =
                previousHtmlOverflow;

            html.style.overscrollBehavior =
                previousHtmlOverscroll;
        };
    }, [open, rendered]);

    const desktopPosition = useMemo(() => {
        const preferredWidth = 695;
        const preferredHeight = 500;

        const horizontalPadding = 16;
        const verticalPadding = 16;

        if (
            !mounted ||
            mode !== "desktop"
        ) {
            return {
                top: 88,
                left: 16,
                width: preferredWidth,
                height: preferredHeight,
                originX: "100%",
                originY: "0%",
            };
        }

        const safeWidth = Math.max(
            0,
            Math.min(
                preferredWidth,
                viewportWidth -
                    horizontalPadding * 2,
            ),
        );

        const safeHeight = Math.max(
            0,
            Math.min(
                preferredHeight,
                viewportHeight -
                    verticalPadding * 2,
            ),
        );

        if (!anchorRect) {
            return {
                top: clamp(
                    88,
                    verticalPadding,
                    Math.max(
                        verticalPadding,
                        viewportHeight -
                            safeHeight -
                            verticalPadding,
                    ),
                ),

                left: clamp(
                    viewportWidth -
                        safeWidth -
                        24,
                    horizontalPadding,
                    Math.max(
                        horizontalPadding,
                        viewportWidth -
                            safeWidth -
                            horizontalPadding,
                    ),
                ),

                width: safeWidth,
                height: safeHeight,
                originX: "100%",
                originY: "0%",
            };
        }

        const preferredLeft =
            anchorRect.right - safeWidth;

        const left = clamp(
            preferredLeft,
            horizontalPadding,
            Math.max(
                horizontalPadding,
                viewportWidth -
                    safeWidth -
                    horizontalPadding,
            ),
        );

        const preferredTop =
            anchorRect.bottom + 12;

        const top = clamp(
            preferredTop,
            verticalPadding,
            Math.max(
                verticalPadding,
                viewportHeight -
                    safeHeight -
                    verticalPadding,
            ),
        );

        const maxOriginX = Math.max(
            36,
            safeWidth - 36,
        );

        const maxOriginY = Math.max(
            18,
            Math.min(48, safeHeight - 18),
        );

        return {
            top,
            left,
            width: safeWidth,
            height: safeHeight,

            originX: `${clamp(
                anchorRect.right -
                    left -
                    18,
                36,
                maxOriginX,
            )}px`,

            originY: `${clamp(
                anchorRect.top +
                    anchorRect.height / 2 -
                    top,
                18,
                maxOriginY,
            )}px`,
        };
    }, [
        mounted,
        mode,
        anchorRect,
        viewportWidth,
        viewportHeight,
    ]);

    if (!mounted || !rendered) {
        return null;
    }

    const hasQuery =
        query.trim().length > 0;

    const handleClear = () => {
        setQuery("");

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleInputKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === "Escape") {
            onClose();
        }
    };

    const mobileContent = (
        <div
            dir="rtl"
            className={[
                "flex w-full flex-col",
                "max-h-[calc(100dvh-32px)]",
            ].join(" ")}
        >
            <div
                className={[
                    "flex h-12 w-full",
                    "shrink-0 items-center",
                    "rounded-[9px]",
                    "border border-black/5",
                    "bg-white px-3",
                    "shadow-[0_10px_28px_rgba(0,0,0,0.05)]",
                ].join(" ")}
            >
                <Search
                    aria-hidden="true"
                    className={[
                        "ml-2 h-[18px]",
                        "w-[18px] shrink-0",
                        "text-[#777]",
                    ].join(" ")}
                    strokeWidth={1.8}
                />

                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => {
                        setQuery(
                            event.target.value,
                        );
                    }}
                    onKeyDown={
                        handleInputKeyDown
                    }
                    placeholder="جستجوی محصولات..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="جستجوی محصولات"
                    className={[
                        "h-full min-w-0 flex-1",
                        "bg-transparent",
                        "text-right text-[14px]",
                        "font-normal text-[#222]",
                        "outline-none",
                        "placeholder:text-[#8d8d8d]",
                        "[&::-webkit-search-cancel-button]:hidden",
                        "[&::-webkit-search-decoration]:hidden",
                    ].join(" ")}
                />

                <div className="mr-2 flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={handleClear}
                        tabIndex={
                            hasQuery ? 0 : -1
                        }
                        aria-hidden={!hasQuery}
                        className={[
                            "whitespace-nowrap",
                            "px-1 text-[11px]",
                            "font-medium",
                            "text-[#555]",
                            "transition-opacity",
                            "duration-200",
                            "ease-out",
                            hasQuery
                                ? "pointer-events-auto opacity-100"
                                : "pointer-events-none opacity-0",
                        ].join(" ")}
                    >
                        پاک کردن
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن جستجو"
                        className={[
                            "flex h-9 w-9",
                            "items-center",
                            "justify-center",
                            "rounded-[8px]",
                            "text-[#444]",
                            "transition-[background-color,transform]",
                            "duration-200",
                            "hover:bg-black/[0.04]",
                            "active:scale-95",
                        ].join(" ")}
                    >
                        <X
                            aria-hidden="true"
                            className="h-[18px] w-[18px]"
                            strokeWidth={1.9}
                        />
                    </button>
                </div>
            </div>

            <div
                className={[
                    "mt-3 min-h-0 w-full",
                    "flex-1 overflow-y-auto",
                    "overscroll-contain",
                    "px-1 pb-5 pt-1",
                    "[-webkit-overflow-scrolling:touch]",
                    /*
                     * مخفی‌کردن کامل اسکرول‌بار
                     * موبایل و تبلت.
                     */
                    "[scrollbar-width:none]",
                    "[-ms-overflow-style:none]",
                    "[&::-webkit-scrollbar]:hidden",
                ].join(" ")}
            >
                <ProductSearchResults
                    query={query}
                    products={products}
                    loading={loading}
                    error={error}
                    hasSearched={
                        hasSearched
                    }
                    onProductClick={
                        onClose
                    }
                />
            </div>
        </div>
    );

    const desktopContent = (
        <div
            dir="rtl"
            className={[
                "flex h-full w-full",
                "flex-col overflow-hidden",
                "p-4",
            ].join(" ")}
        >
            <div
                className={[
                    "flex h-14 w-full",
                    "shrink-0 items-center",
                    "rounded-[12px]",
                    "border border-white/20",
                    "bg-white/60 px-4",
                    "shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
                ].join(" ")}
            >
                <Search
                    aria-hidden="true"
                    className={[
                        "ml-3 h-[20px]",
                        "w-[20px] shrink-0",
                        "text-black/40",
                    ].join(" ")}
                    strokeWidth={1.9}
                />

                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => {
                        setQuery(
                            event.target.value,
                        );
                    }}
                    onKeyDown={
                        handleInputKeyDown
                    }
                    placeholder="جستجوی محصولات..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="جستجوی محصولات"
                    className={[
                        "h-full min-w-0 flex-1",
                        "bg-transparent",
                        "text-right text-[15px]",
                        "font-normal text-[#222]",
                        "outline-none",
                        "placeholder:text-black/30",
                        "[&::-webkit-search-cancel-button]:hidden",
                        "[&::-webkit-search-decoration]:hidden",
                    ].join(" ")}
                />

                {hasQuery && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="پاک کردن جستجو"
                        className={[
                            "ml-1 flex h-8 w-8",
                            "shrink-0 items-center",
                            "justify-center",
                            "rounded-[8px]",
                            "text-black/35",
                            "transition-[background-color,transform]",
                            "hover:bg-black/5",
                            "active:scale-95",
                        ].join(" ")}
                    >
                        <X
                            aria-hidden="true"
                            className="h-4 w-4"
                            strokeWidth={1.8}
                        />
                    </button>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="بستن جستجو"
                    className={[
                        "flex h-8 w-8",
                        "shrink-0 items-center",
                        "justify-center",
                        "rounded-[8px]",
                        "text-black/40",
                        "transition-[background-color,transform]",
                        "hover:bg-black/5",
                        "active:scale-95",
                    ].join(" ")}
                >
                    <X
                        aria-hidden="true"
                        className="h-[19px] w-[19px]"
                        strokeWidth={1.8}
                    />
                </button>
            </div>

            <div
                className={[
                    "mt-4 min-h-0 flex-1",
                    "overflow-y-auto",
                    "overscroll-contain",
                    "px-1 pb-2 pt-1",
                    "[scrollbar-width:thin]",
                ].join(" ")}
            >
                <ProductSearchResults
                    query={query}
                    products={products}
                    loading={loading}
                    error={error}
                    hasSearched={
                        hasSearched
                    }
                    onProductClick={
                        onClose
                    }
                />
            </div>
        </div>
    );

    if (mode === "mobile") {
        return createPortal(
            <div
                className="fixed inset-0 z-[100]"
                role="dialog"
                aria-modal="true"
                aria-label="جستجوی محصولات"
            >
                <div
                    onClick={onClose}
                    aria-hidden="true"
                    className={[
                        "absolute inset-0",
                        "transition-colors",
                        "duration-[720ms]",
                        "ease-[cubic-bezier(0.22,1,0.36,1)]",
                        open
                            ? "bg-white/50"
                            : "bg-white/0",
                    ].join(" ")}
                    style={{
                        backdropFilter: `blur(${blur}px)`,

                        WebkitBackdropFilter: `blur(${blur}px)`,

                        transition:
                            "backdrop-filter 40ms linear, -webkit-backdrop-filter 40ms linear, background-color 720ms cubic-bezier(0.22,1,0.36,1)",

                        willChange:
                            "backdrop-filter",
                    }}
                />

                <div
                    aria-hidden="true"
                    className={[
                        "pointer-events-none",
                        "absolute inset-0",
                        "bg-gradient-to-b",
                        "from-white/25",
                        "via-transparent",
                        "to-white/10",
                        "transition-opacity",
                        "duration-[720ms]",
                        "ease-[cubic-bezier(0.22,1,0.36,1)]",
                        open
                            ? "opacity-100"
                            : "opacity-0",
                    ].join(" ")}
                />

                <div
                    className={[
                        "absolute inset-x-0",
                        "top-0 px-4 pt-4",
                        "transition-all",
                        "duration-[520ms]",
                        "delay-[120ms]",
                        "ease-[cubic-bezier(0.22,1,0.36,1)]",
                        open
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-2 opacity-0",
                    ].join(" ")}
                    style={{
                        willChange:
                            "transform, opacity",
                    }}
                >
                    {mobileContent}
                </div>
            </div>,
            document.body,
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div
                onClick={onClose}
                aria-hidden="true"
                className="absolute inset-0"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-label="جستجوی محصولات"
                className={[
                    "absolute overflow-hidden",
                    "rounded-[12px]",
                    "border border-white/40",
                    "bg-white/40",
                    "shadow-[0_20px_40px_rgba(0,0,0,0.1)]",
                    "transition-[transform,opacity]",
                    "duration-[620ms]",
                    "delay-[40ms]",
                    "ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open
                        ? "scale-100 opacity-100"
                        : "scale-[0.98] opacity-0",
                ].join(" ")}
                style={{
                    top: desktopPosition.top,
                    left: desktopPosition.left,
                    width:
                        desktopPosition.width,
                    height:
                        desktopPosition.height,

                    backdropFilter: `blur(${
                        blur * 2
                    }px) saturate(180%)`,

                    WebkitBackdropFilter: `blur(${
                        blur * 2
                    }px) saturate(180%)`,

                    transformOrigin: `${desktopPosition.originX} ${desktopPosition.originY}`,

                    willChange:
                        "transform, opacity, backdrop-filter",
                }}
            >
                {desktopContent}
            </div>
        </div>,
        document.body,
    );
}
