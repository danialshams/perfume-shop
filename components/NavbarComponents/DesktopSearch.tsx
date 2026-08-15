"use client";

import {
    Search,
    X,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
    type FocusEvent,
    type KeyboardEvent,
} from "react";

import ProductSearchResults from "./ProductSearchResults";
import { useProductSearch } from "../hooks/useProductSearch";

type DesktopSearchProps = {
    updateHeaderHidden?: (
        hidden: boolean,
    ) => void;
};

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

export default function DesktopSearch({
    updateHeaderHidden,
}: DesktopSearchProps) {
    const [open, setOpen] = useState(false);

    const [panelOpen, setPanelOpen] =
        useState(false);

    const [
        panelRendered,
        setPanelRendered,
    ] = useState(false);

    const [query, setQuery] = useState("");
    const [blur, setBlur] = useState(0);

    const containerRef =
        useRef<HTMLDivElement | null>(null);

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
        enabled: panelOpen,
        debounceMs: 350,
        limit: 10,
    });

    /*
     * انیمیشن Blur پنل.
     */
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

        if (panelOpen) {
            setPanelRendered(true);

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

        if (panelRendered) {
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
                    setPanelRendered(false);
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
    }, [panelOpen, panelRendered]);

    /*
     * قفل‌کردن اسکرول صفحه اصلی در دسکتاپ.
     *
     * overflowهای قبلی ذخیره می‌شوند تا بعد از
     * بسته‌شدن جست‌وجو عیناً بازیابی شوند.
     */
    useEffect(() => {
        if (!panelOpen) {
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
    }, [panelOpen]);

    /*
     * پاک‌کردن جست‌وجوی قبلی پس از بسته‌شدن.
     */
    useEffect(() => {
        if (panelOpen) {
            return;
        }

        setQuery("");
    }, [panelOpen]);

    const handleOpen = () => {
        updateHeaderHidden?.(false);
        setOpen(true);
    };

    const handleSearchInteraction = () => {
        updateHeaderHidden?.(false);
        setOpen(true);
        setPanelOpen(true);
    };

    const handleIconClick = () => {
        handleSearchInteraction();

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const closeSearch = () => {
        setPanelOpen(false);
        setOpen(false);
        setQuery("");
    };

    const handleMouseLeave = () => {
        const activeElement =
            document.activeElement;

        if (
            activeElement &&
            containerRef.current?.contains(
                activeElement,
            )
        ) {
            return;
        }

        closeSearch();
    };

    const handleBlur = (
        event: FocusEvent<HTMLDivElement>,
    ) => {
        const nextFocusedElement =
            event.relatedTarget as Node | null;

        if (
            nextFocusedElement &&
            containerRef.current?.contains(
                nextFocusedElement,
            )
        ) {
            return;
        }

        closeSearch();
    };

    const handleKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
    ) => {
        if (event.key !== "Escape") {
            return;
        }

        closeSearch();
        inputRef.current?.blur();
    };

    const handleClearQuery = () => {
        setQuery("");

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleProductClick = () => {
        closeSearch();
        inputRef.current?.blur();
    };

    const panelIsVisible =
        panelOpen || panelRendered;

    /*
     * هنگام loading اسکرول مخفی می‌ماند تا
     * اسکرول‌بار اسکلتون لحظه‌ای ظاهر نشود.
     *
     * بعد از دریافت محصولات overflow-auto
     * فعال می‌شود و مرورگر فقط در صورت نیاز
     * اسکرول‌بار را نشان می‌دهد.
     */
    const enablePanelScroll =
        panelOpen &&
        !loading &&
        products.length > 0;

    return (
        <div
            ref={containerRef}
            dir="rtl"
            onMouseEnter={handleOpen}
            onMouseLeave={handleMouseLeave}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="relative isolate h-10 min-w-[40px] flex-1"
        >
            <div
                tabIndex={-1}
                aria-hidden={!panelOpen}
                className={[
                    "absolute -left-2 -right-2",
                    "top-[-10px] z-0",
                    "h-[390px] overflow-hidden",
                    "rounded-[3px]",
                    "border border-white/55",
                    "bg-white/75",
                    "shadow-[0_5px_18px_rgba(0,0,0,0.045)]",
                    "origin-top",
                    "will-change-[opacity,transform,backdrop-filter]",
                    "transition-[opacity,transform,visibility]",
                    "duration-[1500ms]",
                    "ease-[cubic-bezier(0.16,1,0.3,1)]",
                    panelIsVisible
                        ? "visible pointer-events-auto"
                        : "invisible pointer-events-none",
                    panelOpen
                        ? "translate-y-0 scale-100 opacity-100"
                        : "-translate-y-2 scale-[0.99] opacity-0",
                ].join(" ")}
                style={{
                    backdropFilter: `blur(${blur * 4
                        }px) saturate(1.4)`,

                    WebkitBackdropFilter: `blur(${blur * 4
                        }px) saturate(1.4)`,

                    transition:
                        "backdrop-filter 40ms linear, -webkit-backdrop-filter 40ms linear, opacity 1500ms cubic-bezier(0.16,1,0.3,1), transform 1500ms cubic-bezier(0.16,1,0.3,1), visibility 1500ms cubic-bezier(0.16,1,0.3,1)",
                }}
            >
                <div
                    aria-hidden="true"
                    className={[
                        "pointer-events-none",
                        "absolute inset-0",
                        "bg-gradient-to-b",
                        "from-white/85",
                        "via-white/72",
                        "to-white/78",
                    ].join(" ")}
                />

                <div
                    aria-hidden="true"
                    className={[
                        "pointer-events-none",
                        "absolute inset-0",
                        "bg-white/35",
                    ].join(" ")}
                />

                <div
                    aria-hidden="true"
                    className={[
                        "pointer-events-none",
                        "absolute inset-x-0 top-0",
                        "h-px bg-white/80",
                    ].join(" ")}
                />

                <div
                    id="desktop-product-search-results"
                    className={[
                        "relative z-[1] h-full",
                        "px-4 pb-4 pt-[62px]",
                        "overscroll-contain",
                        "[scrollbar-width:thin]",
                        enablePanelScroll
                            ? "overflow-y-auto"
                            : "overflow-y-hidden",
                    ].join(" ")}
                >
                    {panelOpen && (
                        <ProductSearchResults
                            query={query}
                            products={
                                products
                            }
                            loading={loading}
                            error={error}
                            hasSearched={
                                hasSearched
                            }
                            onProductClick={
                                handleProductClick
                            }
                        />
                    )}
                </div>
            </div>

            <div
                aria-hidden="true"
                className={[
                    "pointer-events-none",
                    "absolute inset-0 z-10",
                    "rounded-[3px]",
                    "transition-[background-color,box-shadow,opacity]",
                    "duration-[1200ms]",
                    "ease-[cubic-bezier(0.16,1,0.3,1)]",
                    open
                        ? [
                            "bg-white/70",
                            "opacity-100",
                            "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
                        ].join(" ")
                        : [
                            "bg-transparent",
                            "opacity-0",
                            "shadow-none",
                        ].join(" "),
                ].join(" ")}
                style={{
                    backdropFilter: open
                        ? `blur(${Math.max(
                            blur * 1.5,
                            24,
                        )}px) saturate(1.25)`
                        : "blur(0px) saturate(1)",

                    WebkitBackdropFilter: open
                        ? `blur(${Math.max(
                            blur * 1.5,
                            24,
                        )}px) saturate(1.25)`
                        : "blur(0px) saturate(1)",

                    transition:
                        "backdrop-filter 40ms linear, -webkit-backdrop-filter 40ms linear, background-color 1200ms cubic-bezier(0.16,1,0.3,1), box-shadow 1200ms cubic-bezier(0.16,1,0.3,1), opacity 1200ms cubic-bezier(0.16,1,0.3,1)",
                }}
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
                onFocus={
                    handleSearchInteraction
                }
                onClick={
                    handleSearchInteraction
                }
                placeholder="جستجوی محصولات..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="جستجوی محصولات"
                aria-expanded={panelOpen}
                aria-controls="desktop-product-search-results"
                className={[
                    "absolute inset-0 z-20",
                    "h-full w-full",
                    "rounded-[3px]",
                    "bg-transparent",
                    "py-0 pl-[84px] pr-5",
                    "text-right text-[13px]",
                    "font-normal text-[#222]",
                    "outline-none",
                    "placeholder:text-black/35",
                    "transition-[opacity,transform]",
                    "duration-[1200ms]",
                    "ease-[cubic-bezier(0.16,1,0.3,1)]",
                    open
                        ? [
                            "pointer-events-auto",
                            "translate-x-0",
                            "opacity-100",
                        ].join(" ")
                        : [
                            "pointer-events-none",
                            "translate-x-2",
                            "opacity-0",
                        ].join(" "),
                    "[&::-webkit-search-cancel-button]:hidden",
                    "[&::-webkit-search-decoration]:hidden",
                ].join(" ")}
            />

            {query && open && (
                <button
                    type="button"
                    aria-label="پاک کردن جستجو"
                    onClick={
                        handleClearQuery
                    }
                    className={[
                        "absolute left-10",
                        "top-1/2 z-30",
                        "flex h-8 w-8",
                        "-translate-y-1/2",
                        "items-center",
                        "justify-center",
                        "rounded-[3px]",
                        "text-black/35",
                        "transition-[background-color,color,transform]",
                        "duration-300",
                        "hover:bg-black/[0.035]",
                        "hover:text-black/60",
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
                aria-label={
                    open
                        ? "تمرکز روی جستجو"
                        : "باز کردن جستجو"
                }
                aria-expanded={panelOpen}
                onClick={handleIconClick}
                className={[
                    "absolute left-0 top-0",
                    "z-30 flex h-10 w-10",
                    "items-center",
                    "justify-center",
                    "rounded-[3px]",
                    "text-[#4a4a4a]",
                    "transition-[background-color,color,transform]",
                    "duration-300",
                    "hover:bg-black/[0.025]",
                    "hover:text-[#111111]",
                    "active:scale-[0.98]",
                ].join(" ")}
            >
                <Search
                    aria-hidden="true"
                    className="h-[20px] w-[20px]"
                    strokeWidth={1.5}
                />

            </button>
        </div>
    );
}
