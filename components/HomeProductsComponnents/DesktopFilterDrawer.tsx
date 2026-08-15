"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "@phosphor-icons/react";
import ClientOnlyPortal from "./ClientOnlyPortal";
import type { SortOption } from "./MobileSortSheet";

type Props = {
  open: boolean;
  selectedSort: SortOption;
  activeFilterLabel: string | null;
  hasActiveFilter: boolean;
  onSelectSort: (value: SortOption) => void;
  onClearAll: () => void;
  onClose: () => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
  {
    value: "lowest",
    label: "ارزان‌ترین",
  },
  {
    value: "highest",
    label: "گران‌ترین",
  },
  {
    value: "newest",
    label: "جدیدترین",
  },
  {
    value: "bestselling",
    label: "پرفروش‌ترین",
  },
];

const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.64, 0, 0.78, 0] as const;

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

export default function DesktopFilterDrawer({
  open,
  selectedSort,
  activeFilterLabel,
  hasActiveFilter,
  onSelectSort,
  onClearAll,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;

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

  return (
    <ClientOnlyPortal>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="desktop-filter-root"
            className="fixed inset-0 z-[99999] isolate hidden lg:block"
            dir="rtl"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="بستن فیلتر و مرتب‌سازی"
              variants={overlayVariants}
              onClick={onClose}
              className="absolute inset-0 z-0 block h-full w-full border-0 p-0"
              style={{
                WebkitTapHighlightColor: "transparent",
                willChange: "background-color, backdrop-filter",
              }}
            />

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full max-w-[430px] items-stretch p-3">
              <motion.div
                key="desktop-filter-drawer"
                initial={{
                  x: -520,
                  opacity: 0,
                  scale: 0.982,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    x: {
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
                  x: -520,
                  opacity: 0,
                  scale: 0.982,
                  transition: {
                    x: {
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
                className="pointer-events-auto relative z-20 h-full w-full"
                style={{
                  transformOrigin: "left center",
                  willChange: "transform, opacity",
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* دکمه بستن در بیرون و مرکز عمودی پنل */}
                <div className="absolute right-[-56px] top-1/2 z-30 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="بستن"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur-[18px] transition-transform duration-200 hover:scale-105 active:scale-95"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <XIcon size={15} weight="regular" />
                  </button>
                </div>

                <aside
                  role="dialog"
                  aria-modal="true"
                  aria-label="فیلتر و مرتب‌سازی محصولات"
                  className="flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
                >
                  {/* Header */}
                  <div className="shrink-0 border-b border-black/[0.05] bg-white px-5 pb-5 pt-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                      <div />

                      <h3 className="text-center text-[13.25px] font-[500] leading-6 tracking-[-0.025em] text-[#111111]">
                        فیلتر و مرتب‌سازی
                      </h3>

                      <div className="flex justify-end">
                        <AnimatePresence initial={false}>
                          {hasActiveFilter && (
                            <motion.button
                              type="button"
                              initial={{
                                opacity: 0,
                                x: -4,
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                              }}
                              exit={{
                                opacity: 0,
                                x: -4,
                              }}
                              transition={{
                                duration: 0.25,
                              }}
                              onClick={onClearAll}
                              className="text-[10.5px] font-normal leading-5 tracking-[-0.01em] text-black/55 transition-colors duration-300 hover:text-black active:text-black"
                              style={{
                                WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              پاک کردن
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-3 pb-5 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <AnimatePresence initial={false}>
                      {hasActiveFilter && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          transition={{
                            height: {
                              duration: 0.42,
                              ease: enterEase,
                            },
                            opacity: {
                              duration: 0.25,
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="flex min-h-[52px] items-center justify-between border-b border-black/[0.05] px-3">
                            <span className="text-[11px] font-light tracking-[-0.01em] text-black/40">
                              فیلتر فعال
                            </span>

                            <span className="max-w-[220px] truncate text-[12px] font-normal tracking-[-0.018em] text-black/65">
                              {activeFilterLabel ?? "همه محصولات"}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex min-h-[52px] items-center px-3">
                      <span className="text-[11px] font-light tracking-[-0.01em] text-black/40">
                        مرتب‌سازی محصولات
                      </span>
                    </div>

                    <div className="w-full">
                      {sortOptions.map((option, index) => {
                        const active = selectedSort === option.value;

                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            initial={{
                              opacity: 0,
                              y: 7,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              duration: 0.48,
                              delay: Math.min(index * 0.035, 0.16),
                              ease: enterEase,
                            }}
                            onClick={() => onSelectSort(option.value)}
                            className={`
                              group relative flex min-h-[56px] w-full
                              items-center justify-between border-b
                              border-black/[0.05] px-3 text-right
                              transition-colors duration-300 last:border-b-0
                              ${
                                active
                                  ? "bg-black/[0.022]"
                                  : "bg-transparent hover:bg-black/[0.012]"
                              }
                            `}
                            style={{
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            <span
                              className={`
                                block truncate text-[13.25px] leading-[1.85]
                                tracking-[-0.018em] transition-colors duration-300
                                ${
                                  active
                                    ? "font-[450] text-black"
                                    : "font-normal text-black/70"
                                }
                              `}
                            >
                              {option.label}
                            </span>

                            <span
                              className={`
                                flex h-[18px] w-[18px] shrink-0
                                items-center justify-center rounded-full
                                border transition duration-300
                                ${
                                  active
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

                  <div className="h-[10px] shrink-0 bg-white" />
                </aside>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientOnlyPortal>
  );
}
