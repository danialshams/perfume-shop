"use client";

import gsap from "gsap";
import { X } from "lucide-react";
import Image from "next/image";
import React, {
    MouseEvent,
    PointerEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

type GalleryImage = {
    src: string;
    alt: string;
};

type Props = {
    productName: string;
    images: GalleryImage[];
    activeImageIndex: number;
    onChangeImage: (index: number) => void;
    onOpenLightbox: () => void;
    lightboxOpen: boolean;
    onCloseLightbox: () => void;
    onNextImage: () => void;
    onPrevImage: () => void;
    isLoading?: boolean;
};

type Dir = "next" | "prev" | null;

const EDGE_RESISTANCE = 0.22;
const MOVE_CANCEL_CLICK_THRESHOLD = 5;
const SWIPE_THRESHOLD_RATIO = 0.15;
const SETTLE_MS = 450;
const SETTLE_TRANSITION =
    "clip-path 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease";
const MOBILE_SLIDE_OFFSET = 14;
const LIGHTBOX_SLIDE_OFFSET = 14;
const MODAL_ANIMATION_DURATION = 0.5;

/* ------------------------------------------------------------------ */
/* قفل اسکرول: شمارنده‌ی سراسری تا چند مودال همدیگر را خراب نکنند      */
/* ------------------------------------------------------------------ */

let bodyLockCount = 0;
let bodyLockSnapshot: { overflow: string; paddingRight: string } | null = null;

function lockBodyScroll() {
    if (typeof document === "undefined") return;

    if (bodyLockCount === 0) {
        bodyLockSnapshot = {
            overflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight,
        };

        const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";

        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
    }

    bodyLockCount += 1;
}

function unlockBodyScroll() {
    if (typeof document === "undefined") return;

    bodyLockCount = Math.max(0, bodyLockCount - 1);

    if (bodyLockCount === 0) {
        document.body.style.overflow = bodyLockSnapshot?.overflow ?? "";
        document.body.style.paddingRight = bodyLockSnapshot?.paddingRight ?? "";
        bodyLockSnapshot = null;
    }
}

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

function ExpandArrowsIcon({
    className,
    strokeWidth = 1.9,
}: {
    className?: string;
    strokeWidth?: number;
}) {
    return (
        <svg
            className={className}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M8.5 15.5L4 20M4 20H9.5M4 20V14.5"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.5 8.5L20 4M20 4H14.5M20 4V9.5"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* اسکلتون                                                            */
/* ------------------------------------------------------------------ */
function GallerySkeleton() {
    return (
        <div className="relative -mt-[var(--page-top-pad,0px)] mx-[calc(50%-50vw)] w-screen lg:mx-0 lg:h-full lg:w-full">
            <style>{`
                @keyframes pg-sweep {
                    0% { transform: translateX(-120%); }
                    100% { transform: translateX(120%); }
                }

                @keyframes pg-track {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(320%); }
                }
            `}</style>

            <div className="relative h-[calc(95svh-103px)] w-full overflow-hidden bg-[#f2f2f2] lg:h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-[#f7f7f7] via-[#efefef] to-[#e8e8e8]" />

                <div
                    className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                    style={{ animation: "pg-sweep 1.9s ease-in-out infinite" }}
                />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#dddddd]" />

            <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
                <span
                    className="absolute top-0 block h-full w-1/3 bg-gradient-to-r from-transparent via-[#4b4742] to-transparent"
                    style={{ animation: "pg-track 1.6s ease-in-out infinite" }}
                />
            </div>
        </div>
    );
}

export default function ProductGallery({
    productName,
    images,
    activeImageIndex,
    onChangeImage,
    onOpenLightbox,
    lightboxOpen,
    onCloseLightbox,
    isLoading = false,
}: Props) {
    const lightboxRef = useRef<HTMLDivElement | null>(null);
    const modalPanelRef = useRef<HTMLDivElement | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const activeGalleryImageRef = useRef<HTMLImageElement | null>(null);
    const [indicatorFrame, setIndicatorFrame] = useState({
        left: 0,
        width: 0,
    });

    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSettling, setIsSettling] = useState(false);
    const [settleDir, setSettleDir] = useState<Dir>(null);
    const settleTimeoutRef = useRef<number | null>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const widthRef = useRef(0);
    const startXRef = useRef(0);
    const deltaRef = useRef(0);
    const activePointerIdRef = useRef<number | null>(null);
    const movedRef = useRef(false);

    const lbContainerRef = useRef<HTMLDivElement | null>(null);
    const [lbDragX, setLbDragX] = useState(0);
    const [lbDragging, setLbDragging] = useState(false);
    const [lbSettling, setLbSettling] = useState(false);
    const [lbSettleDir, setLbSettleDir] = useState<Dir>(null);
    const lbSettleTimeoutRef = useRef<number | null>(null);
    const lbStartXRef = useRef(0);
    const lbDeltaRef = useRef(0);
    const lbWidthRef = useRef(0);
    const [lightboxIndex, setLightboxIndex] = useState(activeImageIndex);
    const [isClosingLightbox, setIsClosingLightbox] = useState(false);

    const lightboxIndexRef = useRef(activeImageIndex);
    const scrollLockedRef = useRef(false);

    useEffect(() => {
        lightboxIndexRef.current = lightboxIndex;
    }, [lightboxIndex]);

    const normalizeImageSrc = (src: string) => {
        if (!src) return "";

        const trimmedSrc = String(src).trim();

        try {
            const url = new URL(trimmedSrc);

            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                return url.pathname;
            }

            return trimmedSrc;
        } catch {
            return trimmedSrc;
        }
    };

    const safeImages = useMemo(() => {
        return images
            .filter((img) => !!img?.src && !!String(img.src).trim())
            .map((img) => ({ ...img, src: normalizeImageSrc(img.src) }));
    }, [images]);

    const totalImages = safeImages.length;
    const canGoPrev = activeImageIndex > 0;
    const canGoNext = activeImageIndex < totalImages - 1;

    const lbCanGoPrev = lightboxIndex > 0;
    const lbCanGoNext = lightboxIndex < totalImages - 1;

    const updateWidth = () => {
        if (!containerRef.current) return;
        widthRef.current = containerRef.current.offsetWidth;
    };

    const updateGalleryIndicatorFrame = useCallback(() => {
        const container = containerRef.current;
        const image = activeGalleryImageRef.current;

        if (!container || !image) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
            setIndicatorFrame({
                left: 0,
                width: containerWidth,
            });
            return;
        }

        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;
        const isLargeScreen = window.matchMedia("(min-width: 1024px)").matches;

        let renderedWidth = containerWidth;
        let renderedLeft = 0;

        if (isLargeScreen) {
            if (imageRatio > containerRatio) {
                renderedWidth = containerWidth;
            } else {
                renderedWidth = containerHeight * imageRatio;
            }

            renderedLeft = 0;
        } else {
            if (imageRatio > containerRatio) {
                renderedWidth = containerHeight * imageRatio;
            } else {
                renderedWidth = containerWidth;
            }

            renderedLeft = (containerWidth - renderedWidth) / 2;
        }

        setIndicatorFrame({
            left: renderedLeft,
            width: renderedWidth,
        });
    }, []);

    const updateLightboxWidth = () => {
        lbWidthRef.current = lbContainerRef.current?.clientWidth || window.innerWidth;
    };

    useEffect(() => {
        updateWidth();
        updateGalleryIndicatorFrame();

        const handleResize = () => {
            updateWidth();
            updateGalleryIndicatorFrame();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [updateGalleryIndicatorFrame]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            updateGalleryIndicatorFrame();
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [activeImageIndex, safeImages, updateGalleryIndicatorFrame]);

    useEffect(() => {
        if (!lightboxOpen) return;

        updateLightboxWidth();

        window.addEventListener("resize", updateLightboxWidth);

        return () => {
            window.removeEventListener("resize", updateLightboxWidth);
        };
    }, [lightboxOpen]);

    useEffect(() => {
        return () => {
            if (settleTimeoutRef.current) {
                clearTimeout(settleTimeoutRef.current);
            }

            if (lbSettleTimeoutRef.current) {
                clearTimeout(lbSettleTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (lightboxOpen) {
            setLightboxIndex(activeImageIndex);
            lightboxIndexRef.current = activeImageIndex;
            setIsClosingLightbox(false);
        }
    }, [lightboxOpen, activeImageIndex]);

    useEffect(() => {
        if (!lightboxOpen) return;

        lockBodyScroll();
        scrollLockedRef.current = true;

        return () => {
            if (scrollLockedRef.current) {
                scrollLockedRef.current = false;
                unlockBodyScroll();
            }
        };
    }, [lightboxOpen]);

    useEffect(() => {
        return () => {
            if (scrollLockedRef.current) {
                scrollLockedRef.current = false;
                unlockBodyScroll();
            }
        };
    }, []);

    useIsomorphicLayoutEffect(() => {
        if (!lightboxOpen) return;

        const overlay = lightboxRef.current;
        const panel = modalPanelRef.current;

        if (!overlay || !panel) return;

        gsap.killTweensOf(overlay);
        gsap.killTweensOf(panel);

        gsap.set(overlay, {
            autoAlpha: 0,
            backdropFilter: "blur(0px)",
        });

        gsap.set(panel, {
            autoAlpha: 0,
            y: 10,
            scale: 0.98,
        });

        const timeline = gsap.timeline();

        timeline
            .to(
                overlay,
                {
                    autoAlpha: 1,
                    backdropFilter: "blur(10px)",
                    duration: MODAL_ANIMATION_DURATION,
                    ease: "power2.out",
                },
                0,
            )
            .to(
                panel,
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: MODAL_ANIMATION_DURATION,
                    ease: "power3.out",
                },
                0,
            );

        return () => {
            timeline.kill();
            gsap.killTweensOf(overlay);
            gsap.killTweensOf(panel);
        };
    }, [lightboxOpen]);

    const animateCloseLightbox = useCallback(() => {
        if (isClosingLightbox) return;

        const overlay = lightboxRef.current;
        const panel = modalPanelRef.current;

        const commitClose = () => {
            setIsClosingLightbox(false);

            if (lightboxIndexRef.current !== activeImageIndex) {
                onChangeImage(lightboxIndexRef.current);
            }

            onCloseLightbox();
        };

        if (!overlay || !panel) {
            commitClose();
            return;
        }

        setIsClosingLightbox(true);

        gsap.killTweensOf(overlay);
        gsap.killTweensOf(panel);

        gsap.to(panel, {
            autoAlpha: 0,
            y: 10,
            scale: 0.98,
            duration: MODAL_ANIMATION_DURATION,
            ease: "power3.out",
        });

        gsap.to(overlay, {
            autoAlpha: 0,
            backdropFilter: "blur(0px)",
            duration: MODAL_ANIMATION_DURATION,
            ease: "power2.out",
            onComplete: commitClose,
        });
    }, [isClosingLightbox, activeImageIndex, onChangeImage, onCloseLightbox]);

    useEffect(() => {
        if (!lightboxOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                animateCloseLightbox();
                return;
            }

            if (isClosingLightbox) return;

            if (e.key === "ArrowRight") {
                setLightboxIndex((prev) => Math.max(prev - 1, 0));
            }

            if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) => Math.min(prev + 1, totalImages - 1));
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [lightboxOpen, totalImages, isClosingLightbox, animateCloseLightbox]);

    const openLightbox = useCallback(() => {
        if (lightboxOpen || isClosingLightbox) return;
        onOpenLightbox();
    }, [lightboxOpen, isClosingLightbox, onOpenLightbox]);

    const finishDrag = () => {
        if (activePointerIdRef.current === null) return;

        activePointerIdRef.current = null;

        const width = widthRef.current || 1;
        const threshold = width * SWIPE_THRESHOLD_RATIO;
        const delta = deltaRef.current;

        const goNext = delta < -threshold && canGoNext;
        const goPrev = delta > threshold && canGoPrev;

        setIsDragging(false);

        if (settleTimeoutRef.current) {
            clearTimeout(settleTimeoutRef.current);
            settleTimeoutRef.current = null;
        }

        if (goNext || goPrev) {
            const dir: Dir = goNext ? "next" : "prev";
            const targetIndex = goNext ? activeImageIndex + 1 : activeImageIndex - 1;
            const targetOffset = goNext ? -width : width;

            setSettleDir(dir);
            setIsSettling(true);

            requestAnimationFrame(() => {
                deltaRef.current = targetOffset;
                setDragOffset(targetOffset);
            });

            settleTimeoutRef.current = window.setTimeout(() => {
                onChangeImage(targetIndex);
                deltaRef.current = 0;
                setDragOffset(0);
                setIsSettling(false);
                setSettleDir(null);
                settleTimeoutRef.current = null;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        movedRef.current = false;
                    });
                });
            }, SETTLE_MS);
        } else {
            const backDir: Dir = delta < 0 ? "next" : delta > 0 ? "prev" : null;

            setSettleDir(backDir);
            setIsSettling(true);

            requestAnimationFrame(() => {
                deltaRef.current = 0;
                setDragOffset(0);
            });

            settleTimeoutRef.current = window.setTimeout(() => {
                setIsSettling(false);
                setSettleDir(null);
                settleTimeoutRef.current = null;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        movedRef.current = false;
                    });
                });
            }, SETTLE_MS);
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (event: globalThis.PointerEvent) => {
            if (activePointerIdRef.current !== event.pointerId) return;

            const rawDelta = event.clientX - startXRef.current;

            if (Math.abs(rawDelta) > MOVE_CANCEL_CLICK_THRESHOLD) {
                movedRef.current = true;
            }

            let nextDelta = rawDelta;

            if ((rawDelta > 0 && !canGoPrev) || (rawDelta < 0 && !canGoNext)) {
                nextDelta *= EDGE_RESISTANCE;
            }

            deltaRef.current = nextDelta;
            setDragOffset(nextDelta);
        };

        const handleUp = (event: globalThis.PointerEvent) => {
            if (activePointerIdRef.current !== event.pointerId) return;
            finishDrag();
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleUp);

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleUp);
        };
    }, [isDragging, canGoPrev, canGoNext, activeImageIndex]);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (totalImages <= 1 || lightboxOpen) return;

        if (event.button !== 0 && event.pointerType === "mouse") return;

        if (settleTimeoutRef.current) {
            clearTimeout(settleTimeoutRef.current);
            settleTimeoutRef.current = null;
            setIsSettling(false);
            setSettleDir(null);
            setDragOffset(0);
        }

        event.currentTarget.setPointerCapture(event.pointerId);

        updateWidth();

        activePointerIdRef.current = event.pointerId;
        startXRef.current = event.clientX;
        deltaRef.current = 0;
        movedRef.current = false;

        setIsDragging(true);
    };

    const handlePointerRelease = (event: PointerEvent<HTMLDivElement>) => {
        if (activePointerIdRef.current !== event.pointerId) return;
        finishDrag();
    };

    const handleGalleryClick = (event: MouseEvent<HTMLDivElement>) => {
        if (movedRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        openLightbox();
    };

    const handleLbTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (totalImages <= 1 || isClosingLightbox) return;

        if (lbSettleTimeoutRef.current) {
            clearTimeout(lbSettleTimeoutRef.current);
            lbSettleTimeoutRef.current = null;
            setLbSettling(false);
            setLbSettleDir(null);
            setLbDragX(0);
        }

        lbStartXRef.current = e.touches[0].clientX;
        lbWidthRef.current = lbContainerRef.current?.clientWidth || window.innerWidth;
        lbDeltaRef.current = 0;

        setLbDragX(0);
        setLbDragging(true);
    };

    const handleLbTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!lbDragging) return;

        const rawDelta = e.touches[0].clientX - lbStartXRef.current;
        let nextDelta = rawDelta;

        if ((rawDelta > 0 && !lbCanGoPrev) || (rawDelta < 0 && !lbCanGoNext)) {
            nextDelta *= EDGE_RESISTANCE;
        }

        lbDeltaRef.current = nextDelta;
        setLbDragX(nextDelta);
    };

    const handleLbTouchEnd = () => {
        if (!lbDragging) return;

        const width = lbWidthRef.current || 1;
        const threshold = width * SWIPE_THRESHOLD_RATIO;
        const delta = lbDeltaRef.current;

        const goNext = delta <= -threshold && lbCanGoNext;
        const goPrev = delta >= threshold && lbCanGoPrev;

        setLbDragging(false);

        if (lbSettleTimeoutRef.current) {
            clearTimeout(lbSettleTimeoutRef.current);
            lbSettleTimeoutRef.current = null;
        }

        if (goNext || goPrev) {
            const dir: Dir = goNext ? "next" : "prev";
            const targetOffset = goNext ? -width : width;
            const nextIndex = goNext ? lightboxIndex + 1 : lightboxIndex - 1;

            setLbSettleDir(dir);
            setLbSettling(true);

            requestAnimationFrame(() => {
                lbDeltaRef.current = targetOffset;
                setLbDragX(targetOffset);
            });

            lbSettleTimeoutRef.current = window.setTimeout(() => {
                setLightboxIndex(nextIndex);
                lbDeltaRef.current = 0;
                setLbDragX(0);
                setLbSettling(false);
                setLbSettleDir(null);
                lbSettleTimeoutRef.current = null;
            }, SETTLE_MS);
        } else {
            const backDir: Dir = delta < 0 ? "next" : delta > 0 ? "prev" : null;

            setLbSettleDir(backDir);
            setLbSettling(true);

            requestAnimationFrame(() => {
                lbDeltaRef.current = 0;
                setLbDragX(0);
            });

            lbSettleTimeoutRef.current = window.setTimeout(() => {
                setLbSettling(false);
                setLbSettleDir(null);
                lbSettleTimeoutRef.current = null;
            }, SETTLE_MS);
        }
    };

    if (!safeImages.length && !isLoading) return null;

    const dragRatio = widthRef.current ? dragOffset / widthRef.current : 0;
    const absDragRatio = Math.min(Math.abs(dragRatio), 1);
    const dragDir: Dir = dragOffset < 0 ? "next" : dragOffset > 0 ? "prev" : null;
    const activeDir: Dir = isDragging ? dragDir : isSettling ? settleDir : null;

    const lbDragRatio = lbWidthRef.current ? lbDragX / lbWidthRef.current : 0;
    const lbAbsDragRatio = Math.min(Math.abs(lbDragRatio), 1);
    const lbDragDir: Dir = lbDragX < 0 ? "next" : lbDragX > 0 ? "prev" : null;
    const lbActiveDir: Dir = lbDragging ? lbDragDir : lbSettling ? lbSettleDir : null;

    const frameWidth = indicatorFrame.width || widthRef.current || 0;
    const frameLeft = indicatorFrame.left || 0;

    const segmentWidthPx = totalImages > 0 ? frameWidth / totalImages : frameWidth;
    const basePx = activeImageIndex * segmentWidthPx;

    let indicatorLeftPx = frameLeft + basePx;
    let indicatorWidthPx = segmentWidthPx;

    const indicatorDir: Dir = isDragging ? dragDir : isSettling ? settleDir : null;
    const indicatorProgress = isDragging
        ? Math.min(Math.abs(dragRatio), 1)
        : isSettling && settleDir
            ? 1
            : 0;

    if (indicatorDir === "next" && canGoNext) {
        if (isSettling) {
            indicatorLeftPx = frameLeft + basePx + segmentWidthPx;
            indicatorWidthPx = segmentWidthPx;
        } else {
            indicatorLeftPx = frameLeft + basePx;
            indicatorWidthPx = segmentWidthPx * (1 + indicatorProgress);
        }
    } else if (indicatorDir === "prev" && canGoPrev) {
        if (isSettling) {
            indicatorLeftPx = frameLeft + basePx - segmentWidthPx;
            indicatorWidthPx = segmentWidthPx;
        } else {
            indicatorLeftPx = frameLeft + basePx - segmentWidthPx * indicatorProgress;
            indicatorWidthPx = segmentWidthPx * (1 + indicatorProgress);
        }
    }

    indicatorLeftPx = Math.max(indicatorLeftPx, frameLeft);
    indicatorWidthPx = Math.min(
        indicatorWidthPx,
        Math.max(frameLeft + frameWidth - indicatorLeftPx, 0),
    );

    const galleryNextIndex =
        activeDir === "next" && canGoNext ? activeImageIndex + 1 : null;

    const galleryPrevIndex =
        activeDir === "prev" && canGoPrev ? activeImageIndex - 1 : null;

    const galleryRevealPercent = absDragRatio * 100;
    const lightboxRevealPercent = lbAbsDragRatio * 100;
    const gallerySlideProgress = (1 - absDragRatio) * MOBILE_SLIDE_OFFSET;
    const lightboxSlideProgress = (1 - lbAbsDragRatio) * LIGHTBOX_SLIDE_OFFSET;

    const lightboxNextIndex =
        lbActiveDir === "next" && lbCanGoNext ? lightboxIndex + 1 : null;

    const lightboxPrevIndex =
        lbActiveDir === "prev" && lbCanGoPrev ? lightboxIndex - 1 : null;

    return (
        <>
            {isLoading ? (
                <GallerySkeleton />
            ) : (
                <div className="relative -mt-[var(--page-top-pad,0px)] mx-[calc(50%-50vw)] w-screen lg:mx-0 lg:h-full lg:w-full">
                    <div
                        ref={containerRef}
                        className="relative h-[calc(95svh-103px)] w-full cursor-grab select-none overflow-hidden bg-white touch-pan-y active:cursor-grabbing lg:h-full"
                        onPointerDown={safeImages.length > 1 ? handlePointerDown : undefined}
                        onPointerUp={safeImages.length > 1 ? handlePointerRelease : undefined}
                        onPointerCancel={
                            safeImages.length > 1 ? handlePointerRelease : undefined
                        }
                        onLostPointerCapture={
                            safeImages.length > 1 ? handlePointerRelease : undefined
                        }
                        onClick={handleGalleryClick}
                    >
                        {safeImages.map((img, index) => {
                            const isActive = index === activeImageIndex;
                            const isNext = index === galleryNextIndex;
                            const isPrev = index === galleryPrevIndex;

                            let style: React.CSSProperties = {
                                opacity: isActive ? 1 : 0,
                                zIndex: isActive ? 1 : 0,
                                transition:
                                    isDragging || isSettling ? "none" : "opacity 0.2s ease",
                            };

                            if (isNext) {
                                style = {
                                    opacity: 1,
                                    zIndex: 10,
                                    clipPath: `inset(0 0 0 ${100 - galleryRevealPercent}%)`,
                                    transform: `translateX(${gallerySlideProgress}%)`,
                                    transition: isDragging ? "none" : SETTLE_TRANSITION,
                                };
                            }

                            if (isPrev) {
                                style = {
                                    opacity: 1,
                                    zIndex: 10,
                                    clipPath: `inset(0 ${100 - galleryRevealPercent}% 0 0)`,
                                    transform: `translateX(-${gallerySlideProgress}%)`,
                                    transition: isDragging ? "none" : SETTLE_TRANSITION,
                                };
                            }

                            return (
                                <div
                                    key={`${img.src}-${index}-gallery`}
                                    className="absolute inset-0"
                                    style={style}
                                >
                                    <Image
                                        ref={(node) => {
                                            if (isActive && node) {
                                                activeGalleryImageRef.current = node;
                                            }
                                        }}
                                        src={img.src}
                                        alt={img.alt || productName}
                                        fill
                                        priority={
                                            index === activeImageIndex ||
                                            index === activeImageIndex + 1 ||
                                            index === activeImageIndex - 1
                                        }
                                        onLoad={isActive ? updateGalleryIndicatorFrame : undefined}
                                        draggable={false}
                                        className="h-full w-full select-none object-contain"
                                        sizes="100vw"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox();
                        }}
                        className="absolute bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg border border-[#d5d9d5]/80 bg-[#f8f9f6]/95 text-[#333c39] backdrop-blur-xl transition-transform duration-200 active:scale-95"
                        aria-label="نمایش تمام صفحه تصویر"
                    >
                        <ExpandArrowsIcon className="h-5 w-5" strokeWidth={1.6} />
                    </button>

                    <div className="pointer-events-none absolute bottom-4 right-4 z-40 rounded-full bg-[#303735]/55 px-2.5 py-[2px] text-[10px] font-light tabular-nums tracking-[0.04em] text-white backdrop-blur-md">
                        {activeImageIndex + 1} / {safeImages.length}
                    </div>

                    {safeImages.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 z-20 h-px">
                            <div className="absolute inset-0 bg-[#dddddd]" />
                            <span
                                className={`absolute top-0 block h-full bg-gradient-to-r from-[#4a4742] via-[#2f2d2a] to-[#4a4742] ${
                                    isDragging
                                        ? ""
                                        : "transition-[left,width] duration-[520ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                                }`}
                                style={{
                                    left: `${indicatorLeftPx}px`,
                                    width: `${indicatorWidthPx}px`,
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {mounted &&
                lightboxOpen &&
                createPortal(
                    <div
                        ref={lightboxRef}
                        className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/95"
                        style={{
                            opacity: 0,
                            visibility: "hidden",
                            pointerEvents: isClosingLightbox ? "none" : "auto",
                        }}
                    >
                        <button
                            type="button"
                            onClick={animateCloseLightbox}
                            aria-label="بستن نمایش تمام صفحه"
                            className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-95"
                        >
                            <X className="h-7 w-7" strokeWidth={1.2} />
                        </button>

                        <div className="pointer-events-none absolute bottom-6 right-6 z-[100] rounded-full bg-[#303735]/50 px-2.5 py-[2px] text-[10px] font-light tabular-nums tracking-[0.04em] text-white backdrop-blur-md">
                            {lightboxIndex + 1} / {safeImages.length}
                        </div>

                        <div
                            ref={modalPanelRef}
                            className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden"
                            style={{ opacity: 0, visibility: "hidden" }}
                        >
                            <div
                                ref={lbContainerRef}
                                className="relative h-full w-full select-none overflow-hidden touch-pan-y"
                                onTouchStart={
                                    safeImages.length > 1 ? handleLbTouchStart : undefined
                                }
                                onTouchMove={safeImages.length > 1 ? handleLbTouchMove : undefined}
                                onTouchEnd={safeImages.length > 1 ? handleLbTouchEnd : undefined}
                                onTouchCancel={
                                    safeImages.length > 1 ? handleLbTouchEnd : undefined
                                }
                            >
                                {safeImages.map((img, index) => {
                                    const isActive = index === lightboxIndex;
                                    const isNext = index === lightboxNextIndex;
                                    const isPrev = index === lightboxPrevIndex;

                                    let style: React.CSSProperties = {
                                        opacity: isActive ? 1 : 0,
                                        zIndex: isActive ? 1 : 0,
                                        transition:
                                            lbDragging || lbSettling ? "none" : "opacity 0.2s ease",
                                    };

                                    if (isNext) {
                                        style = {
                                            opacity: 1,
                                            zIndex: 10,
                                            clipPath: `inset(0 0 0 ${100 - lightboxRevealPercent}%)`,
                                            transform: `translateX(${lightboxSlideProgress}%)`,
                                            transition: lbDragging ? "none" : SETTLE_TRANSITION,
                                        };
                                    }

                                    if (isPrev) {
                                        style = {
                                            opacity: 1,
                                            zIndex: 10,
                                            clipPath: `inset(0 ${100 - lightboxRevealPercent}% 0 0)`,
                                            transform: `translateX(-${lightboxSlideProgress}%)`,
                                            transition: lbDragging ? "none" : SETTLE_TRANSITION,
                                        };
                                    }

                                    return (
                                        <div
                                            key={`${img.src}-${index}-lightbox`}
                                            className="absolute inset-0"
                                            style={style}
                                        >
                                            <Image
                                                src={img.src}
                                                alt={img.alt || productName}
                                                fill
                                                draggable={false}
                                                className="select-none object-contain"
                                                sizes="100vw"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
