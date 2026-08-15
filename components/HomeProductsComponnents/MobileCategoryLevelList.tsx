"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

type Category = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    is_active?: boolean | number;
    created_at?: string;
    updated_at?: string;
    parent_ids: number[];
    parent_names: string[];
    has_children: boolean;
};

type Props = {
    open: boolean;
    revealReady: boolean;
    items: Category[];
    activeParentId: number | null;
    activeChildId: number | null;
    childrenByParent: Map<number, Category[]>;
    onClearAll: () => void;
    onSelectCategory: (categoryId: number, rootParentId: number) => void;
};

type LevelKey = number | "root";

const checkVariants = {
    initial: { opacity: 0, scale: 0.9, x: 2 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.9, x: 2 },
};

const springSoft = {
    type: "spring" as const,
    stiffness: 280,
    damping: 28,
    mass: 0.9,
};

const levelEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const levelSlideVariants = {
    enter: (direction: 1 | -1) => ({
        x: direction > 0 ? -14 : 14,
        opacity: 0,
        filter: "blur(3px)",
    }),
    center: {
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
    },
    exit: (direction: 1 | -1) => ({
        x: direction > 0 ? 9 : -9,
        opacity: 0,
        filter: "blur(2px)",
    }),
};

export default function MobileCategoryLevelList({
    open,
    revealReady,
    items,
    activeParentId,
    activeChildId,
    childrenByParent,
    onClearAll,
    onSelectCategory,
}: Props) {
    const [focusStack, setFocusStack] = useState<Category[]>([]);
    const [navDirection, setNavDirection] = useState<1 | -1>(1);
    const [revealToken, setRevealToken] = useState(0);
    const [readyLevelKey, setReadyLevelKey] = useState<LevelKey | null>(null);

    const rowRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const levelPageRef = useRef<HTMLDivElement | null>(null);
    const revealContextRef = useRef<gsap.Context | null>(null);
    const revealTimerRef = useRef<number | null>(null);

    const selectedIds = useMemo(() => {
        const ids = new Set<number>();

        if (activeParentId) ids.add(activeParentId);
        if (activeChildId) ids.add(activeChildId);

        return ids;
    }, [activeParentId, activeChildId]);

    const currentLevelItems =
        focusStack.length === 0
            ? items
            : childrenByParent.get(focusStack[focusStack.length - 1].id) ?? [];

    const currentParent = focusStack[focusStack.length - 1] ?? null;
    const levelKey: LevelKey = currentParent ? currentParent.id : "root";

    useEffect(() => {
        if (!open) {
            if (revealTimerRef.current) {
                window.clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }

            revealContextRef.current?.revert();
            revealContextRef.current = null;
            setRevealToken(0);
            setReadyLevelKey(null);
        }
    }, [open]);

    useEffect(() => {
        if (revealTimerRef.current) {
            window.clearTimeout(revealTimerRef.current);
            revealTimerRef.current = null;
        }

        if (!open || !revealReady) {
            setReadyLevelKey(null);
            return;
        }

        setReadyLevelKey(null);

        const frame = window.requestAnimationFrame(() => {
            // Start the text reveal shortly after the new level begins moving,
            // instead of waiting for the whole page transition to finish.
            revealTimerRef.current = window.setTimeout(() => {
                setReadyLevelKey(levelKey);
                setRevealToken((prev) => prev + 1);
                revealTimerRef.current = null;
            }, 85);
        });

        return () => {
            window.cancelAnimationFrame(frame);

            if (revealTimerRef.current) {
                window.clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }
        };
    }, [open, revealReady, levelKey]);

    useLayoutEffect(() => {
        if (!open || !levelPageRef.current) return;

        const root = levelPageRef.current;
        const sequence = Array.from(
            root.querySelectorAll<HTMLElement>("[data-reveal-seq]")
        );

        if (sequence.length === 0) return;

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        revealContextRef.current?.revert();
        revealContextRef.current = null;

        if (!revealReady || readyLevelKey !== levelKey || revealToken === 0) {
            gsap.set(sequence, {
                opacity: 0,
                y: 8,
                filter: "blur(5px)",
            });
            return;
        }

        revealContextRef.current = gsap.context(() => {
            if (reduceMotion) {
                gsap.set(sequence, {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    clearProps: "opacity,transform,filter",
                });
                return;
            }

            gsap.set(sequence, {
                opacity: 0,
                y: 8,
                filter: "blur(5px)",
            });

            gsap.to(sequence, {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.34,
                ease: "power3.out",
                stagger: 0.026,
                clearProps: "opacity,transform,filter",
            });
        }, levelPageRef);

        return () => {
            revealContextRef.current?.revert();
            revealContextRef.current = null;
        };
    }, [open, revealReady, readyLevelKey, revealToken, levelKey]);

    const scrollCategoryToCenter = (categoryId: number) => {
        window.requestAnimationFrame(() => {
            window.setTimeout(() => {
                const element = rowRefs.current.get(categoryId);

                element?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                });
            }, 90);
        });
    };

    const handleOpenChildren = (item: Category) => {
        setNavDirection(1);
        setReadyLevelKey(null);
        setFocusStack((prev) => [...prev, item]);
    };

    const handleBackTo = (index: number) => {
        setNavDirection(-1);
        setReadyLevelKey(null);
        setFocusStack((prev) => prev.slice(0, index + 1));
    };

    const handleBack = () => {
        setNavDirection(-1);
        setReadyLevelKey(null);
        setFocusStack((prev) => prev.slice(0, -1));
    };

    const handleResetToRoot = () => {
        setNavDirection(-1);
        setReadyLevelKey(null);
        setFocusStack([]);
    };

    const getRootId = (item: Category) => {
        return focusStack.length > 0 ? focusStack[0].id : item.id;
    };

    const renderDivider = () => (
        <div className="pointer-events-none px-0">
            <div className="h-px w-full bg-gradient-to-l from-transparent via-black/[0.075] to-transparent" />
        </div>
    );

    const renderTopSection = () => {
        if (focusStack.length === 0) {
            return (
                <div className="bg-white py-4.5 text-right">
                    <div className="flex w-full items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="min-w-0 flex-1 bg-transparent text-right"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                            data-reveal-seq
                        >
                            <span className="block truncate text-[14.5px] font-medium tracking-[-0.01em] text-[#181818] transition-all duration-300">
                                همه
                            </span>
                        </button>

                        <div data-reveal-seq>
                            <AnimatePresence>
                                {!activeParentId && !activeChildId && (
                                    <motion.span
                                        variants={checkVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={springSoft}
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.045] text-[#181818]"
                                    >
                                        <Check size={12.5} strokeWidth={1.9} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-4" data-reveal-seq>
                        {renderDivider()}
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white pb-3.5 pt-1.5">
                <div className="mb-2.5 flex items-center justify-between" data-reveal-seq>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-1 text-[11.5px] font-medium tracking-[0.01em] text-[#181818] transition-all duration-300 active:scale-[0.99]"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        <ChevronRight size={13.5} strokeWidth={1.8} />
                        بازگشت
                    </button>
                </div>

                <div
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-right"
                    data-reveal-seq
                >
                    <button
                        type="button"
                        onClick={handleResetToRoot}
                        className="text-[11px] tracking-[0.01em] text-[#6d6d6d] transition-colors duration-300"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        همه
                    </button>

                    {focusStack.map((item, index) => {
                        const isLast = index === focusStack.length - 1;

                        return (
                            <div key={item.id} className="inline-flex items-center gap-1">
                                <ChevronLeft
                                    size={11.5}
                                    strokeWidth={1.65}
                                    className="text-black/20"
                                />

                                {isLast ? (
                                    <span className="text-[11.5px] font-medium tracking-[0.01em] text-[#787878]">
                                        {item.name}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleBackTo(index)}
                                        className="text-[11px] tracking-[0.01em] text-[#6d6d6d] transition-colors duration-300"
                                        style={{ WebkitTapHighlightColor: "transparent" }}
                                    >
                                        {item.name}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3.5" data-reveal-seq>
                    {renderDivider()}
                </div>
            </div>
        );
    };

    const renderCategoryRow = (item: Category, depth: number) => {
        const children = childrenByParent.get(item.id) ?? [];
        const hasChildren = children.length > 0;
        const rootParentId = getRootId(item);

        const isSelected =
            activeChildId === item.id ||
            (activeParentId === item.id && activeChildId === null) ||
            selectedIds.has(item.id);

        return (
            <div
                key={item.id}
                data-reveal-seq
                ref={(node) => {
                    if (node) {
                        rowRefs.current.set(item.id, node);
                    } else {
                        rowRefs.current.delete(item.id);
                    }
                }}
                className="overflow-hidden bg-white"
            >
                <div className="flex w-full items-center justify-between gap-3 bg-white">
                    <button
                        type="button"
                        onClick={() => onSelectCategory(item.id, rootParentId)}
                        className="min-w-0 flex-1 bg-transparent py-5 text-right"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        <span
                            className={[
                                "block truncate tracking-[-0.01em] transition-[color,font-weight,opacity,transform] duration-300",
                                depth === 0
                                    ? isSelected
                                        ? "text-[14.5px] font-medium text-[#141414]"
                                        : "text-[14.5px] font-medium text-[#222222]"
                                    : depth === 1
                                        ? isSelected
                                            ? "text-[13px] font-medium text-[#141414]"
                                            : "text-[13px] font-normal text-[#262626]"
                                        : isSelected
                                            ? "text-[12.5px] font-medium text-[#141414]"
                                            : "text-[12.5px] font-normal text-[#2b2b2b]",
                            ].join(" ")}
                        >
                            {item.name}
                        </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5 bg-transparent">
                        <AnimatePresence>
                            {isSelected && (
                                <motion.span
                                    variants={checkVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={springSoft}
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.045] text-[#181818]"
                                >
                                    <Check size={12.5} strokeWidth={1.9} />
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {hasChildren && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenChildren(item);
                                    scrollCategoryToCenter(item.id);
                                }}
                                aria-label="نمایش زیر دسته ها"
                                className="flex h-8 w-8 items-center justify-center bg-transparent text-[#202020] transition-all duration-300 active:scale-95"
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                <ChevronLeft size={14} strokeWidth={1.7} />
                            </button>
                        )}
                    </div>
                </div>

                {renderDivider()}
            </div>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-[#1b1b1b]">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
                <AnimatePresence mode="wait" custom={navDirection}>
                    <motion.div
                        key={levelKey}
                        custom={navDirection}
                        variants={levelSlideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            duration: 0.34,
                            ease: levelEase,
                        }}
                        className="absolute inset-0 bg-white"
                    >
                        <div
                            ref={levelPageRef}
                            className="flex h-full min-h-0 flex-col bg-white"
                        >
                            <div className="shrink-0 bg-white">{renderTopSection()}</div>

                            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
                                {currentLevelItems?.map((item) =>
                                    renderCategoryRow(item, focusStack.length)
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
