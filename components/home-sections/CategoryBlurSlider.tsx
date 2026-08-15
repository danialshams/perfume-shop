"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ScentFamilyApiItem = {
    id: number | string;
    name: string;
    slug?: string | null;
    image_url?: string | null;
    is_active?: boolean | number | string | null;
    sort_order?: number | string | null;
};

type ScentFamiliesResponse = {
    success?: boolean;
    message?: string;
    data?:
    | ScentFamilyApiItem[]
    | {
        items?: ScentFamilyApiItem[];
        data?: ScentFamilyApiItem[];
        meta?: {
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
        };
    };
    items?: ScentFamilyApiItem[];
};

type ScentFamilyItem = {
    id: string;
    familyId: number | string;
    name: string;
    image: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const SCENT_FAMILY_TITLE = "گروه‌های بویایی";
const SCENT_FAMILY_EYEBROW = "CHAPTER 03";

const ORNAMENT_COLOR = "#DAD6D0";

const LINE_EASE = "power2.inOut";
const LINE_DURATION = 0.9;

const TEXT_EASE = "power2.out";

const CHAPTER_DURATION = 0.35;
const CHAPTER_STAGGER = 0.035;
const TITLE_DURATION = 0.5;
const TITLE_STAGGER = 0.07;

const CARDS_DURATION = 0.6;
const CARDS_STAGGER = 0.06;

const STEP_GAP = 0.06;

const LATIN_FONT_STACK =
    '"Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, system-ui, sans-serif';

function boolify(value: unknown) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return (
            normalized === "1" ||
            normalized === "true" ||
            normalized === "yes" ||
            normalized === "on"
        );
    }

    return false;
}

function normalizeScentFamilyName(value?: string | null) {
    return (value || "")
        .trim()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ");
}

function getScentFamilyImageUrl(imageUrl?: string | null) {
    const safeImageUrl = imageUrl?.trim();

    if (!safeImageUrl) {
        return "/placeholder-category.jpg";
    }

    if (
        safeImageUrl.startsWith("http://") ||
        safeImageUrl.startsWith("https://")
    ) {
        return safeImageUrl;
    }

    const normalizedPath = safeImageUrl.startsWith("/")
        ? safeImageUrl
        : `/${safeImageUrl}`;

    return `${API_BASE_URL}${normalizedPath}`;
}

function extractScentFamilies(
    response: ScentFamiliesResponse,
): ScentFamilyApiItem[] {
    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (
        response.data &&
        !Array.isArray(response.data) &&
        Array.isArray(response.data.items)
    ) {
        return response.data.items;
    }

    if (
        response.data &&
        !Array.isArray(response.data) &&
        Array.isArray(response.data.data)
    ) {
        return response.data.data;
    }

    if (Array.isArray(response.items)) {
        return response.items;
    }

    return [];
}

export default function ScentFamilyBlurGrid() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const headingRef = useRef<HTMLDivElement | null>(null);
    const lineWrapRef = useRef<HTMLDivElement | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

    const headingAnimatedRef = useRef(false);

    const [scentFamilies, setScentFamilies] = useState<ScentFamilyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const titleWords = useMemo(() => SCENT_FAMILY_TITLE.split(" "), []);

    const eyebrowChars = useMemo(() => SCENT_FAMILY_EYEBROW.split(""), []);

    useEffect(() => {
        const controller = new AbortController();

        async function loadScentFamilies() {
            try {
                setLoading(true);
                setLoadError("");

                const params = new URLSearchParams({
                    is_active: "1",
                });

                const response = await fetch(
                    `${API_BASE_URL}/api/v1/scent-families?${params.toString()}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    },
                );

                const result: ScentFamiliesResponse = await response.json();

                if (!response.ok || result.success === false) {
                    throw new Error(
                        result.message ||
                        "دریافت گروه‌های بویایی با خطا مواجه شد",
                    );
                }

                const families = extractScentFamilies(result);

                const normalizedFamilies = families
                    .filter((family) => {
                        if (
                            family.is_active === undefined ||
                            family.is_active === null
                        ) {
                            return true;
                        }

                        return boolify(family.is_active);
                    })
                    .map<ScentFamilyItem>((family) => ({
                        id: String(family.id),
                        familyId: family.id,
                        name:
                            normalizeScentFamilyName(family.name) ||
                            "بدون نام",
                        image: getScentFamilyImageUrl(family.image_url),
                    }))
                    .sort((firstFamily, secondFamily) =>
                        firstFamily.name.localeCompare(
                            secondFamily.name,
                            "fa",
                        ),
                    );

                setScentFamilies(normalizedFamilies);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                console.error("Scent families fetch error:", error);

                setScentFamilies([]);
                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "دریافت گروه‌های بویایی با خطا مواجه شد",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadScentFamilies();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const headingElement = headingRef.current;
        const sectionElement = sectionRef.current;
        const gridElement = gridRef.current;
        const lineWrapElement = lineWrapRef.current;

        if (!headingElement || !sectionElement || loading) {
            return;
        }

        const characterElements =
            headingElement.querySelectorAll<HTMLElement>(
                "[data-eyebrow-char]",
            );

        const wordElements =
            headingElement.querySelectorAll<HTMLElement>(
                "[data-title-word]",
            );

        if (!wordElements.length) {
            return;
        }

        const topLineElement =
            lineWrapElement?.querySelector<HTMLElement>("[data-top-line]") ??
            null;

        const bottomLineElement =
            lineWrapElement?.querySelector<HTMLElement>(
                "[data-bottom-line]",
            ) ?? null;

        const lineElements = [topLineElement, bottomLineElement].filter(
            (element): element is HTMLElement => Boolean(element),
        );

        const cardElements = gridElement
            ? gridElement.querySelectorAll<HTMLElement>(
                "[data-scent-family-card]",
            )
            : [];

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (prefersReducedMotion) {
            if (lineElements.length) {
                gsap.set(lineElements, {
                    height: "50%",
                    clearProps: "willChange",
                });
            }

            gsap.set(
                [
                    ...Array.from(characterElements),
                    ...Array.from(wordElements),
                ],
                {
                    opacity: 1,
                    y: 0,
                    clearProps: "transform",
                },
            );

            if (cardElements.length) {
                gsap.set(cardElements, {
                    opacity: 1,
                    y: 0,
                    filter: "none",
                    clearProps: "transform,filter",
                });
            }

            headingAnimatedRef.current = true;
            return;
        }

        const halfHeight = lineWrapElement
            ? lineWrapElement.getBoundingClientRect().height / 2
            : 40;

        if (characterElements.length) {
            gsap.set(characterElements, {
                opacity: 0,
            });
        }

        gsap.set(wordElements, {
            opacity: 0,
            y: 8,
        });

        if (cardElements.length) {
            gsap.set(cardElements, {
                opacity: 0,
                y: 12,
                filter: "blur(5px)",
            });
        }

        const timeline = gsap.timeline({
            paused: true,
            onComplete: () => {
                headingAnimatedRef.current = true;

                if (lineElements.length) {
                    gsap.set(lineElements, {
                        height: "50%",
                        clearProps: "willChange",
                    });
                }
            },
        });

        if (lineElements.length) {
            timeline.to(
                lineElements,
                {
                    height: halfHeight,
                    duration: LINE_DURATION,
                    ease: LINE_EASE,
                },
                0,
            );
        }

        if (characterElements.length) {
            timeline.to(
                characterElements,
                {
                    opacity: 1,
                    duration: CHAPTER_DURATION,
                    stagger: {
                        each: CHAPTER_STAGGER,
                        from: "start",
                    },
                    ease: "power1.out",
                },
                `>${STEP_GAP}`,
            );
        }

        timeline.to(
            wordElements,
            {
                opacity: 1,
                y: 0,
                duration: TITLE_DURATION,
                stagger: TITLE_STAGGER,
                ease: TEXT_EASE,
            },
            `>${STEP_GAP}`,
        );

        if (cardElements.length) {
            timeline.to(
                cardElements,
                {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: CARDS_DURATION,
                    stagger: CARDS_STAGGER,
                    ease: TEXT_EASE,
                },
                `>${STEP_GAP}`,
            );
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (headingAnimatedRef.current) {
                    return;
                }

                if (
                    entry.isIntersecting &&
                    entry.intersectionRatio >= 0.2
                ) {
                    timeline.play(0);
                    observer.disconnect();
                }
            },
            {
                threshold: [0, 0.1, 0.2, 0.3],
                rootMargin: "-4% 0px -4% 0px",
            },
        );

        observer.observe(sectionElement);

        return () => {
            observer.disconnect();
            timeline.kill();
        };
    }, [loading, scentFamilies.length]);

    return (
        <section
            ref={sectionRef}
            dir="rtl"
            className="w-full bg-[#F8F8F8] py-16 sm:py-20 md:py-28 lg:py-36"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-12 lg:px-16">
                <div
                    ref={headingRef}
                    className="relative z-10 mb-12 text-center sm:mb-16 md:mb-20 lg:mb-24"
                >
                    <div
                        ref={lineWrapRef}
                        aria-hidden="true"
                        className="relative mx-auto mb-5 h-16 opacity-80 sm:mb-6 sm:h-20 md:mb-7 md:h-[88px]"
                        style={{ width: "1px" }}
                    >
                        <div
                            data-top-line="true"
                            style={{
                                position: "absolute",
                                bottom: "50%",
                                left: 0,
                                width: "100%",
                                height: 0,
                                backgroundColor: ORNAMENT_COLOR,
                                willChange: "height",
                            }}
                        />

                        <div
                            data-bottom-line="true"
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: 0,
                                width: "100%",
                                height: 0,
                                backgroundColor: ORNAMENT_COLOR,
                                willChange: "height",
                            }}
                        />
                    </div>

                    <p
                        dir="ltr"
                        lang="en"
                        aria-label={SCENT_FAMILY_EYEBROW}
                        className="flex items-center justify-center text-[9px] font-light uppercase leading-none tracking-[0.32em] text-[#DAD6D0] sm:text-[10px] sm:tracking-[0.4em]"
                        style={{
                            fontFamily: LATIN_FONT_STACK,
                            fontVariantNumeric:
                                "lining-nums tabular-nums",
                            fontFeatureSettings: '"lnum" 1, "tnum" 1',
                            unicodeBidi: "isolate",
                        }}
                    >
                        {eyebrowChars.map((character, index) => (
                            <span
                                key={`${character}-${index}`}
                                data-eyebrow-char="true"
                                aria-hidden="true"
                                className="inline-block"
                                style={{
                                    fontFamily: LATIN_FONT_STACK,
                                    fontVariantNumeric:
                                        "lining-nums tabular-nums",
                                    ...(character === " "
                                        ? { width: "0.42em" }
                                        : {}),
                                }}
                            >
                                {character === " "
                                    ? "\u00A0"
                                    : character}
                            </span>
                        ))}
                    </p>

                    <h2
                        className={[
                            "mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:mt-6 sm:gap-x-3",
                            "text-[25px] font-light leading-[1.5] tracking-[0.04em] text-[#33383C]",
                            "sm:text-[34px] md:text-[40px]",
                        ].join(" ")}
                    >
                        {titleWords.map((word, index) => (
                            <span
                                key={`${word}-${index}`}
                                data-title-word="true"
                                className="inline-block"
                            >
                                {word}
                            </span>
                        ))}
                    </h2>
                </div>

                <div
                    ref={gridRef}
                    className="grid grid-cols-2 gap-3 pb-4 sm:gap-5 md:grid-cols-3 md:gap-7 lg:grid-cols-3 lg:gap-10"
                >
                    {loading &&
                        Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="w-full animate-pulse"
                            >
                                <div className="aspect-[4/5] bg-neutral-100" />
                            </div>
                        ))}

                    {!loading &&
                        !loadError &&
                        scentFamilies.map((family) => (
                            <Link
                                key={family.id}
                                data-scent-family-card
                                href={`/products?scent_family_id=${encodeURIComponent(
                                    String(family.familyId),
                                )}`}
                                draggable={false}
                                style={{ opacity: 0 }}
                                className="group/card relative w-full select-none overflow-hidden"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                                    <Image
                                        src={family.image}
                                        alt={family.name}
                                        fill
                                        unoptimized
                                        draggable={false}
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="pointer-events-none scale-[1.03] object-cover blur-[1px] transition-all duration-[1800ms] ease-[cubic-bezier(0.15,1,0.3,1)] group-hover/card:scale-100 group-hover/card:blur-0"
                                    />

                                    <div className="absolute inset-0 bg-neutral-950/20 transition-colors duration-700 group-hover/card:bg-neutral-950/10" />

                                    <div className="absolute inset-0 flex items-center justify-center px-3 text-center sm:px-4">
                                        <h3 className="break-words text-[12px] font-light leading-6 tracking-[0.05em] text-white sm:text-[14px] md:text-[15px]">
                                            {family.name}
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        ))}

                    {!loading && loadError && (
                        <div className="col-span-2 border border-dashed border-red-200 bg-white px-5 py-10 text-center text-sm leading-7 text-red-600 md:col-span-3">
                            {loadError}
                        </div>
                    )}

                    {!loading &&
                        !loadError &&
                        scentFamilies.length === 0 && (
                            <div className="col-span-2 border border-dashed border-neutral-200 bg-white px-5 py-10 text-center text-sm leading-7 text-neutral-500 md:col-span-3">
                                هنوز گروه بویایی فعالی برای نمایش ثبت نشده
                                است.
                            </div>
                        )}
                </div>
            </div>
        </section>
    );
}
