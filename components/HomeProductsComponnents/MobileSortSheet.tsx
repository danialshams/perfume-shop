"use client";

import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
} from "framer-motion";
import { XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import ClientOnlyPortal from "./ClientOnlyPortal";

export type SortOption = "lowest" | "highest" | "newest" | "bestselling";

type Props = {
  open: boolean;
  selectedSort: SortOption;
  onSelectSort: (value: SortOption) => void;
  onClose: () => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "lowest", label: "ارزان‌ترین" },
  { value: "highest", label: "گران‌ترین" },
  { value: "newest", label: "جدیدترین" },
  { value: "bestselling", label: "پرفروش‌ترین" },
];

const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.64, 0, 0.78, 0] as const;

const DISMISS_RATIO = 0.2;
const DISMISS_FALLBACK_DISTANCE = 90;
const DISMISS_VELOCITY = 720;

const overlayVariants = {
  hidden: {
    backgroundColor: "rgba(220, 226, 234, 0)",
    backdropFilter: "blur(0px) saturate(100%)",
    WebkitBackdropFilter: "blur(0px) saturate(100%)",
  },
  visible: {
    backgroundColor: "rgba(220, 226, 234, 0.42)",
    backdropFilter: "blur(24px) saturate(145%)",
    WebkitBackdropFilter: "blur(24px) saturate(145%)",
    transition: {
      duration: 0.72,
      ease: enterEase,
    },
  },
  exit: {
    backgroundColor: "rgba(220, 226, 234, 0)",
    backdropFilter: "blur(0px) saturate(100%)",
    WebkitBackdropFilter: "blur(0px) saturate(100%)",
    transition: {
      duration: 0.28,
      ease: exitEase,
    },
  },
};

export default function MobileSortSheet({
  open,
  selectedSort,
  onSelectSort,
  onClose,
}: Props) {
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) {
      setIsSheetDragging(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsSheetDragging(false);

    const sheetHeight =
      sheetRef.current?.getBoundingClientRect().height ?? 0;

    const dismissDistance =
      sheetHeight > 0
        ? sheetHeight * DISMISS_RATIO
        : DISMISS_FALLBACK_DISTANCE;

    const shouldClose =
      info.offset.y > dismissDistance ||
      info.velocity.y > DISMISS_VELOCITY;

    if (shouldClose) {
      onClose();
    }
  };

  return (
    <ClientOnlyPortal>
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          setIsSheetDragging(false);
        }}
      >
        {open && (
          <motion.div
            key="mobile-sort-root"
            className="fixed inset-0 z-[99999] isolate lg:hidden"
            dir="rtl"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="بستن مرتب‌سازی"
              variants={overlayVariants}
              onClick={onClose}
              className="absolute inset-0 z-0 block h-full w-full border-0 p-0"
              style={{
                WebkitTapHighlightColor: "transparent",
                willChange: "background-color, backdrop-filter",
              }}
            />

            <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center px-2 pb-2 pt-6 sm:px-3 sm:pb-3">
              <motion.div
                ref={sheetRef}
                key="mobile-sort-sheet"
                initial={{
                  y: 520,
                  opacity: 0,
                  scale: 0.982,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    y: {
                      duration: 0.88,
                      ease: enterEase,
                    },
                    opacity: {
                      duration: 0.34,
                      ease: "easeOut",
                    },
                    scale: {
                      duration: 0.74,
                      ease: enterEase,
                    },
                  },
                }}
                exit={{
                  y: 520,
                  opacity: 0,
                  scale: 0.982,
                  transition: {
                    y: {
                      duration: 0.28,
                      ease: exitEase,
                    },
                    opacity: {
                      duration: 0.18,
                      ease: "easeOut",
                    },
                    scale: {
                      duration: 0.24,
                      ease: exitEase,
                    },
                  },
                }}
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{
                  top: 0,
                  bottom: 0,
                }}
                dragElastic={{
                  top: 0.025,
                  bottom: 0.28,
                }}
                dragMomentum={false}
                dragTransition={{
                  bounceStiffness: 520,
                  bounceDamping: 42,
                }}
                onDragStart={() => setIsSheetDragging(true)}
                onDragEnd={handleDragEnd}
                className="pointer-events-auto relative z-20 w-full max-w-none sm:max-w-[620px]"
                onClick={(event) => event.stopPropagation()}
                style={{
                  transformOrigin: "bottom center",
                  willChange: "transform, opacity",
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="mb-3 flex justify-center">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="بستن"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur-[18px] transition-transform duration-200 active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <XIcon size={15} weight="regular" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-[10px] border border-white/70 bg-[#F5F4F3] shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
                  <div className="shrink-0 border-b border-black/[0.05] bg-[#F5F4F3] px-5 pb-5 pt-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="برای بستن، پنجره مرتب‌سازی را به پایین بکشید"
                      onPointerDown={(event) => {
                        dragControls.start(event);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                        }
                      }}
                      className="flex h-10 w-full touch-none cursor-grab select-none items-center justify-center active:cursor-grabbing"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <motion.div
                        animate={{
                          width: isSheetDragging ? 38 : 32,
                          opacity: isSheetDragging ? 0.28 : 0.15,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: enterEase,
                        }}
                        className="h-[2px] rounded-full bg-black"
                      />
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                      <div />

                      <h3 className="text-center text-[13.25px] font-[500] leading-6 tracking-[-0.025em] text-[#111111]">
                        مرتب‌سازی محصولات
                      </h3>

                      <div />
                    </div>
                  </div>

                  <div className="bg-[#F5F4F3] px-3 pb-4 pt-2">
                    <div className="w-full">
                      {sortOptions.map((option, index) => {
                        const active = selectedSort === option.value;

                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            initial={{ opacity: 0, y: 7 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.48,
                              delay: Math.min(index * 0.035, 0.16),
                              ease: enterEase,
                            }}
                            onClick={() => onSelectSort(option.value)}
                            className={`
                              group relative flex min-h-[56px] w-full items-center justify-between
                              border-b border-black/[0.05] bg-transparent px-3 text-right
                              transition-colors duration-300 last:border-b-0
                              ${active ? "bg-black/[0.022]" : "bg-transparent"}
                            `}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            <span
                              className={`
                                block truncate text-[13.25px] leading-[1.85]
                                tracking-[-0.018em] transition-colors duration-300
                                ${active
                                  ? "font-[450] text-black"
                                  : "font-normal text-black/70"
                                }
                              `}
                            >
                              {option.label}
                            </span>

                            <span
                              className={`
    flex h-[18px] w-[18px] shrink-0 items-center justify-center
    rounded-full border transition duration-300
    ${active
                                  ? "border-[#62666b]"
                                  : "border-[#62666b]/30"
                                }
  `}
                            >
                              <motion.span
                                animate={{
                                  scale: active ? 1 : 0.5,
                                  opacity: active ? 1 : 0,
                                }}
                                transition={{
                                  duration: 0.28,
                                  ease: enterEase,
                                }}
                                className="h-[7px] w-[7px] rounded-full bg-[#62666b]"
                              />
                            </span>

                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-[max(env(safe-area-inset-bottom),10px)] shrink-0 bg-white" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientOnlyPortal>
  );
}
