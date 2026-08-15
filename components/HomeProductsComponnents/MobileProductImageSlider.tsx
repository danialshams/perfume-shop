"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Dir = "next" | "prev" | null;

const EDGE_RESISTANCE = 0.22;
const MOVE_CANCEL_CLICK_THRESHOLD = 5;
const SWIPE_THRESHOLD_RATIO = 0.15;

const SETTLE_MS = 450;

const SETTLE_TRANSITION =
  "clip-path 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease";

const MOBILE_SLIDE_OFFSET = 14;

export default function MobileProductImageSlider({
  images,
  productName,
  onClick,
}: {
  images: string[];
  productName: string;
  onClick: () => void;
}) {
  const safeImages = useMemo(() => {
    if (!images?.length) return ["/images/placeholder.jpg"];

    const filtered = images
      .map((image) => String(image || "").trim())
      .filter(Boolean);

    return filtered.length ? filtered : ["/images/placeholder.jpg"];
  }, [images]);

  const totalImages = safeImages.length;

  const [currentIndex, setCurrentIndex] = useState(0);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleDir, setSettleDir] = useState<Dir>(null);

  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  const widthRef = useRef(0);
  const startXRef = useRef(0);
  const deltaRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const previousImagesRef = useRef("");
  const settleTimeoutRef = useRef<number | null>(null);

  const updateWidth = () => {
    if (!containerRef.current) return;
    widthRef.current = containerRef.current.offsetWidth;
  };

  useEffect(() => {
    updateWidth();

    const handleResize = () => {
      updateWidth();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const key = safeImages.join("|");

    if (previousImagesRef.current !== key) {
      previousImagesRef.current = key;

      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }

      setCurrentIndex(0);
      setDragOffset(0);
      setIsDragging(false);
      setIsSettling(false);
      setSettleDir(null);

      deltaRef.current = 0;
      movedRef.current = false;
      activePointerIdRef.current = null;
    }
  }, [safeImages]);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalImages - 1;

  const resetMovedAfterAnimation = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        movedRef.current = false;
      });
    });
  };

  const finishDrag = () => {
    const width = widthRef.current || 1;
    const threshold = width * SWIPE_THRESHOLD_RATIO;
    const delta = deltaRef.current;

    const goNext = delta < -threshold && canGoNext;
    const goPrev = delta > threshold && canGoPrev;

    activePointerIdRef.current = null;
    setIsDragging(false);

    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }

    if (goNext || goPrev) {
      const dir: Dir = goNext ? "next" : "prev";
      const targetIndex = goNext ? currentIndex + 1 : currentIndex - 1;
      const targetOffset = goNext ? -width : width;

      setSettleDir(dir);
      setIsSettling(true);

      requestAnimationFrame(() => {
        deltaRef.current = targetOffset;
        setDragOffset(targetOffset);
      });

      settleTimeoutRef.current = window.setTimeout(() => {
        setCurrentIndex(targetIndex);

        deltaRef.current = 0;
        setDragOffset(0);

        setIsSettling(false);
        setSettleDir(null);

        settleTimeoutRef.current = null;

        resetMovedAfterAnimation();
      }, SETTLE_MS);

      return;
    }

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

      resetMovedAfterAnimation();
    }, SETTLE_MS);
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
  }, [isDragging, canGoPrev, canGoNext, currentIndex]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (totalImages <= 1) return;

    if (event.pointerType === "mouse" && event.button !== 0) return;

    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;

      setIsSettling(false);
      setSettleDir(null);
      setDragOffset(0);

      deltaRef.current = 0;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ø¨Ø¹Ø¶ÛŒ Ù…Ø±ÙˆØ±Ú¯Ø±Ù‡Ø§ Ù…Ù…Ú©Ù† Ø§Ø³Øª pointer capture Ø±Ø§ Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ Ù†Ú©Ù†Ù†Ø¯.
    }

    updateWidth();

    activePointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    deltaRef.current = 0;
    movedRef.current = false;

    setIsDragging(true);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (movedRef.current) {
      event.preventDefault();
      return;
    }

    onClick();
  };

  const handleImageLoad = (src: string) => {
    setLoadedMap((prev) => {
      if (prev[src]) return prev;

      return {
        ...prev,
        [src]: true,
      };
    });
  };

  const dragRatio = widthRef.current ? dragOffset / widthRef.current : 0;
  const absDragRatio = Math.min(Math.abs(dragRatio), 1);

  const dragDir: Dir = dragOffset < 0 ? "next" : dragOffset > 0 ? "prev" : null;
  const activeDir: Dir = isDragging ? dragDir : isSettling ? settleDir : null;

  const nextIndex = activeDir === "next" && canGoNext ? currentIndex + 1 : null;
  const prevIndex = activeDir === "prev" && canGoPrev ? currentIndex - 1 : null;

  const revealPercent = absDragRatio * 100;
  const slideProgress = (1 - absDragRatio) * MOBILE_SLIDE_OFFSET;

  const indicatorSegmentWidth = totalImages > 0 ? 100 / totalImages : 100;
  const baseIndicatorLeft = currentIndex * indicatorSegmentWidth;

  let indicatorLeft = baseIndicatorLeft;
  let indicatorWidth = indicatorSegmentWidth;

  const indicatorDir: Dir = isDragging ? dragDir : isSettling ? settleDir : null;

  const indicatorProgress = isDragging
    ? Math.min(Math.abs(dragRatio), 1)
    : isSettling && settleDir
      ? 1
      : 0;

  if (indicatorDir === "next" && canGoNext) {
    if (isSettling) {
      indicatorLeft = baseIndicatorLeft + indicatorSegmentWidth;
      indicatorWidth = indicatorSegmentWidth;
    } else {
      indicatorLeft = baseIndicatorLeft;
      indicatorWidth = indicatorSegmentWidth * (1 + indicatorProgress);
    }
  } else if (indicatorDir === "prev" && canGoPrev) {
    if (isSettling) {
      indicatorLeft = baseIndicatorLeft - indicatorSegmentWidth;
      indicatorWidth = indicatorSegmentWidth;
    } else {
      indicatorLeft = baseIndicatorLeft - indicatorSegmentWidth * indicatorProgress;
      indicatorWidth = indicatorSegmentWidth * (1 + indicatorProgress);
    }
  }

  indicatorLeft = Math.max(indicatorLeft, 0);
  indicatorWidth = Math.min(indicatorWidth, 100 - indicatorLeft);

  return (
    <div
      className="
        min-w-0
bg-[#F8F8F8]        px-[0.25px]
        sm:px-[0.25px]
        md:px-[0.25px]
        lg:px-0
      "
    >
      <div
        ref={containerRef}
        className="
          relative
          overflow-hidden
          rounded-none
bg-[#F8F8F8]          touch-pan-y
          select-none
        "
        onPointerDown={totalImages > 1 ? handlePointerDown : undefined}
        onClick={handleClick}
      >
        <div className="relative aspect-[0.665/1] overflow-hidden bg-[#F8F8F8]">
          {safeImages.map((image, index) => {
            const isActive = index === currentIndex;
            const isNext = index === nextIndex;
            const isPrev = index === prevIndex;

            const isLoaded = Boolean(loadedMap[image]);

            let style: CSSProperties = {
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 1 : 0,
              transition:
                isDragging || isSettling ? "none" : "opacity 0.2s ease",
            };

            if (isNext) {
              style = {
                opacity: 1,
                zIndex: 10,
                clipPath: `inset(0 0 0 ${100 - revealPercent}%)`,
                transform: `translateX(${slideProgress}%)`,
                transition: isDragging ? "none" : SETTLE_TRANSITION,
              };
            }

            if (isPrev) {
              style = {
                opacity: 1,
                zIndex: 10,
                clipPath: `inset(0 ${100 - revealPercent}% 0 0)`,
                transform: `translateX(-${slideProgress}%)`,
                transition: isDragging ? "none" : SETTLE_TRANSITION,
              };
            }

            return (
              <div
                key={`${image}-${index}`}
                className="absolute inset-0"
                style={style}
              >
                <div className="absolute inset-[4%]">
                  <Image
                    src={image}
                    alt={`${productName}-${index + 1}`}
                    fill
                    unoptimized
                    draggable={false}
                    priority={
                      index === 0 ||
                      index === currentIndex ||
                      index === currentIndex + 1 ||
                      index === currentIndex - 1
                    }
                    sizes="50vw"
                    onLoadingComplete={() => handleImageLoad(image)}
                    className={`
                      select-none
                      object-contain
                      transition-all
                      duration-500
                      ease-out
                      ${
                        isLoaded || isActive || isNext || isPrev
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-[1.008]"
                      }
                    `}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {totalImages > 1 && (
        <div
  className="relative w-full overflow-hidden bg-[#ededed]"
  style={{
    height: "1px",
  }}
>

            <span
  className={`
    absolute
    left-0
    top-0
    block
    bg-[#8a8a8a]
    ${
      isDragging
        ? ""
        : "transition-[left,width] duration-[520ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
    }
  `}
  style={{
    left: `${indicatorLeft}%`,
    width: `${indicatorWidth}%`,
    height: "1px",
  }}
/>

          </div>
        )}
      </div>
    </div>
  );
}
