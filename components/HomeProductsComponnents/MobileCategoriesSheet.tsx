"use client";

import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
} from "framer-motion";
import { CheckIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import ClientOnlyPortal from "./ClientOnlyPortal";

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
  topParents: Category[];
  activeParentId: number | null;
  activeChildId: number | null;
  childrenByParent: Map<number, Category[]>;
  mobileCategoryPath: number[];
  mobileRootCategoryId: number | null;
  mobileCurrentCategory: Category | null;
  mobileCurrentChildren: Category[];
  clearAll: () => void;
  closeMobileCategoriesSheet: () => void;
  openMobileChildrenSheet: (categoryId: number) => void;
  goBackMobileCategoryLevel: () => void;
  handleMobileCategorySelect: (
    categoryId: number,
    rootParentId: number,
  ) => void;
};

type AccordionListProps = {
  items: Category[];
  level?: number;
  rootParentId?: number;
  revealReady: boolean;
  activeParentId: number | null;
  activeChildId: number | null;
  childrenByParent: Map<number, Category[]>;
  expandedIds: Set<number>;
  onToggle: (categoryId: number) => void;
  onSelect: (categoryId: number, rootParentId: number) => void;
};

const enterEase = [0.22, 1, 0.36, 1] as const;
const exitEase = [0.64, 0, 0.78, 0] as const;

const DISMISS_RATIO = 0.2;
const DISMISS_FALLBACK_DISTANCE = 120;
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

const childrenVariants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: 0.5,
        ease: enterEase,
      },
      opacity: {
        duration: 0.34,
        delay: 0.06,
        ease: "easeOut" as const,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.4,
        ease: exitEase,
      },
      opacity: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
  },
};

function CategoryAccordionList({
  items,
  level = 0,
  rootParentId,
  revealReady,
  activeParentId,
  activeChildId,
  childrenByParent,
  expandedIds,
  onToggle,
  onSelect,
}: AccordionListProps) {
  if (!items.length) return null;

  return (
    <div
      className={`
        w-full
        ${level === 0 ? "flex min-h-full flex-col justify-evenly" : ""}
      `}
    >
      {items.map((category, index) => {
        const children = childrenByParent.get(category.id) ?? [];
        const hasChildren = category.has_children || children.length > 0;
        const isExpanded = expandedIds.has(category.id);
        const currentRootId = rootParentId ?? category.id;

        const isActive =
          category.id === activeParentId || category.id === activeChildId;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 7 }}
            animate={
              revealReady
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    y: 7,
                  }
            }
            transition={{
              duration: 0.48,
              delay: Math.min(index * 0.035 + level * 0.025, 0.24),
              ease: enterEase,
            }}
            className="relative w-full"
          >
            <div
              className={`
                group relative flex min-h-[56px] w-full items-center justify-between
                transition-colors duration-300
                ${isActive ? "bg-[#F8F8F8]" : "bg-transparent"}
              `}
              style={{
                paddingRight: `${15 + level * 17}px`,
                paddingLeft: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(category.id, currentRootId)}
                className="flex min-w-0 flex-1 items-center self-stretch py-4 text-right"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className={`
                    block truncate tracking-[-0.018em] transition-colors duration-300
                    ${
                      level === 0
                        ? "text-[13.25px] font-[450] leading-[1.85] text-[#383535]"
                        : "text-[12.25px] font-normal leading-[1.9] text-[#706c66]"
                    }
                    ${isActive ? "text-[#383535]" : ""}
                  `}
                >
                  {category.name}
                </span>
              </button>

              <div className="mr-2.5 flex shrink-0 items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.25, ease: enterEase }}
                      className="flex h-5 w-5 items-center justify-center text-[#706c66]"
                      aria-hidden="true"
                    >
                      <CheckIcon size={12.5} weight="regular" />
                    </motion.span>
                  )}
                </AnimatePresence>

                {hasChildren && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(category.id);
                    }}
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full
                      border-0 text-[#706c66] transition-colors duration-300
                      ${isExpanded ? "bg-[#F8F8F8]" : "bg-transparent"}
                    `}
                    aria-label={
                      isExpanded
                        ? `بستن زیرمجموعه ${category.name}`
                        : `نمایش زیرمجموعه ${category.name}`
                    }
                    aria-expanded={isExpanded}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <motion.span
                      animate={{ rotate: isExpanded ? 45 : 0 }}
                      transition={{
                        duration: 0.38,
                        ease: enterEase,
                      }}
                      className="flex items-center justify-center text-[#706c66]"
                    >
                      <PlusIcon size={14} weight="regular" />
                    </motion.span>
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {hasChildren && isExpanded && children.length > 0 && (
                <motion.div
                  key={`children-${category.id}`}
                  variants={childrenVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden bg-[#F8F8F8]"
                >
                  <div>
                    <CategoryAccordionList
                      items={children}
                      level={level + 1}
                      rootParentId={currentRootId}
                      revealReady={revealReady}
                      activeParentId={activeParentId}
                      activeChildId={activeChildId}
                      childrenByParent={childrenByParent}
                      expandedIds={expandedIds}
                      onToggle={onToggle}
                      onSelect={onSelect}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MobileCategoriesSheet(props: Props) {
  const {
    open,
    topParents,
    activeParentId,
    activeChildId,
    childrenByParent,
    mobileCurrentChildren,
    clearAll,
    closeMobileCategoriesSheet,
    handleMobileCategorySelect,
  } = props;

  const [categoryRevealReady, setCategoryRevealReady] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const revealFrameRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  const rootItems = topParents.length > 0 ? topParents : mobileCurrentChildren;

  const hasActiveSelection =
    activeParentId !== null || activeChildId !== null;

  useEffect(() => {
    if (!open) {
      setCategoryRevealReady(false);
      setExpandedIds(new Set());
      setIsSheetDragging(false);
      return;
    }

    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (activeParentId !== null) {
        next.add(activeParentId);
      }

      if (activeChildId !== null) {
        for (const [parentId, children] of childrenByParent.entries()) {
          if (children.some((child) => child.id === activeChildId)) {
            next.add(parentId);
          }
        }
      }

      return next;
    });

    return () => {
      if (revealFrameRef.current !== null) {
        window.cancelAnimationFrame(revealFrameRef.current);
        revealFrameRef.current = null;
      }
    };
  }, [open, activeParentId, activeChildId, childrenByParent]);

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
        closeMobileCategoriesSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMobileCategoriesSheet]);

  const handleSheetAnimationComplete = () => {
    if (!open) return;

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
    }

    revealFrameRef.current = window.requestAnimationFrame(() => {
      setCategoryRevealReady(true);
      revealFrameRef.current = null;
    });
  };

  const handleToggleCategory = (categoryId: number) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  };

  const handleClearAll = () => {
    clearAll();
    setExpandedIds(new Set());
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsSheetDragging(false);

    const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0;

    const dismissDistance =
      sheetHeight > 0
        ? sheetHeight * DISMISS_RATIO
        : DISMISS_FALLBACK_DISTANCE;

    const shouldClose =
      info.offset.y > dismissDistance || info.velocity.y > DISMISS_VELOCITY;

    if (shouldClose) {
      setCategoryRevealReady(false);
      closeMobileCategoriesSheet();
    }
  };

  return (
    <ClientOnlyPortal>
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          setIsSheetDragging(false);
          setCategoryRevealReady(false);
        }}
      >
        {open && (
          <motion.div
            key="mobile-categories-root"
            className="fixed inset-0 z-[99999] isolate lg:hidden"
            dir="rtl"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="بستن دسته‌بندی"
              variants={overlayVariants}
              onClick={closeMobileCategoriesSheet}
              className="absolute inset-0 z-0 block h-full w-full border-0 p-0"
              style={{
                WebkitTapHighlightColor: "transparent",
                willChange: "background-color, backdrop-filter",
              }}
            />

            <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center px-2 pb-2 pt-6 sm:px-3 sm:pb-3">
              <motion.div
                ref={sheetRef}
                key="mobile-categories-sheet"
                initial={{
                  y: 760,
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
                      ease: "easeOut" as const,
                    },
                    scale: {
                      duration: 0.74,
                      ease: enterEase,
                    },
                  },
                }}
                exit={{
                  y: 760,
                  opacity: 0,
                  scale: 0.982,
                  transition: {
                    y: {
                      duration: 0.28,
                      ease: exitEase,
                    },
                    opacity: {
                      duration: 0.18,
                      ease: "easeOut" as const,
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
                onAnimationComplete={handleSheetAnimationComplete}
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
                    onClick={closeMobileCategoriesSheet}
                    aria-label="بستن"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/25 text-[#F8F8F8] shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur-[18px] transition-transform duration-200 active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <XIcon size={15} weight="regular" />
                  </button>
                </div>

                <div className="flex h-[min(84dvh,760px)] max-h-[calc(100dvh-72px)] flex-col overflow-hidden rounded-[10px] border border-[#dad6d0] bg-[#F5F4F3] shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
                  <div className="shrink-0 border-b border-[#dad6d0] bg-[#F5F4F3] px-5 pb-5 pt-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="برای بستن، پنجره دسته‌بندی را به پایین بکشید"
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
                          opacity: isSheetDragging ? 1 : 1,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: enterEase,
                        }}
                        className="h-[2px] rounded-full bg-[#F5F4F3]"
                      />
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                      <div />

                      <h3 className="text-center text-[13.25px] font-[500] leading-6 tracking-[-0.025em] text-[#33383C]">
                        دسته‌بندی
                      </h3>

                      <div className="flex justify-end">
                        <AnimatePresence initial={false}>
                          {hasActiveSelection && (
                            <motion.button
                              type="button"
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.25 }}
                              onClick={handleClearAll}
                              className="text-[10.5px] font-normal leading-5 tracking-[-0.01em] text-[#706c66] transition-colors duration-300 active:text-[#383535]"
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                              پاک کردن
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F5F4F3] px-3 pb-5 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {rootItems.length > 0 ? (
                      <CategoryAccordionList
                        items={rootItems}
                        revealReady={categoryRevealReady}
                        activeParentId={activeParentId}
                        activeChildId={activeChildId}
                        childrenByParent={childrenByParent}
                        expandedIds={expandedIds}
                        onToggle={handleToggleCategory}
                        onSelect={handleMobileCategorySelect}
                      />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex h-40 items-center justify-center text-[12px] font-normal text-[#706c66]"
                      >
                        دسته‌بندی‌ای برای نمایش وجود ندارد
                      </motion.div>
                    )}
                  </div>

                  <div className="h-[max(env(safe-area-inset-bottom),10px)] shrink-0 bg-[#F5F4F3]" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientOnlyPortal>
  );
}
