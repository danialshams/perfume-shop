"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
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
  desktopCategoryPath: number[];
  desktopRootCategoryId: number | null;
  desktopCurrentCategory: Category | null;
  desktopCurrentChildren: Category[];
  clearAll: () => void;
  onClose: () => void;
  openDesktopChildrenLevel: (categoryId: number) => void;
  goBackDesktopCategoryLevel: () => void;
  handleDesktopCategorySelect: (
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
    <div className="w-full">
      {items.map((category, index) => {
        const children = childrenByParent.get(category.id) ?? [];

        const hasChildren =
          category.has_children || children.length > 0;

        const isExpanded = expandedIds.has(category.id);

        const currentRootId =
          rootParentId ?? category.id;

        const isActive =
          category.id === activeParentId ||
          category.id === activeChildId;

        return (
          <motion.div
            key={category.id}
            initial={{
              opacity: 0,
              y: 7,
            }}
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
              delay: Math.min(
                index * 0.035 + level * 0.025,
                0.24,
              ),
              ease: enterEase,
            }}
            className="relative"
          >
            <div
              className={`
                group relative flex min-h-[56px] w-full
                items-center justify-between border-b
                transition-colors duration-300
                ${
                  level === 0
                    ? "border-black/[0.05]"
                    : "border-black/[0.035]"
                }
                ${
                  isActive
                    ? "bg-black/[0.022]"
                    : "bg-transparent"
                }
              `}
              style={{
                paddingRight: `${15 + level * 17}px`,
                paddingLeft: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(category.id, currentRootId);
                }}
                className="flex min-w-0 flex-1 items-center self-stretch py-4 text-right"
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  className={`
                    block truncate tracking-[-0.018em]
                    transition-colors duration-300
                    ${
                      level === 0
                        ? "text-[13.25px] font-[450] leading-[1.85]"
                        : "text-[12.25px] font-normal leading-[1.9]"
                    }
                    ${
                      isActive
                        ? "text-black"
                        : "text-black/70"
                    }
                  `}
                >
                  {category.name}
                </span>
              </button>

              <div className="mr-2.5 flex shrink-0 items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{
                        opacity: 0,
                        scale: 0.7,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.7,
                      }}
                      transition={{
                        duration: 0.25,
                        ease: enterEase,
                      }}
                      className="flex h-5 w-5 items-center justify-center text-black/55"
                      aria-hidden="true"
                    >
                      <CheckIcon
                        size={12.5}
                        weight="regular"
                      />
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
                      flex h-8 w-8 items-center justify-center
                      rounded-full border-0 transition-colors duration-300
                      ${
                        isExpanded
                          ? "bg-black/[0.045] text-black"
                          : "bg-transparent text-black/55"
                      }
                    `}
                    aria-label={
                      isExpanded
                        ? `بستن زیرمجموعه ${category.name}`
                        : `نمایش زیرمجموعه ${category.name}`
                    }
                    aria-expanded={isExpanded}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <motion.span
                      animate={{
                        rotate: isExpanded ? 45 : 0,
                      }}
                      transition={{
                        duration: 0.38,
                        ease: enterEase,
                      }}
                      className="flex items-center justify-center"
                    >
                      <PlusIcon
                        size={14}
                        weight="regular"
                      />
                    </motion.span>
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {hasChildren &&
                isExpanded &&
                children.length > 0 && (
                  <motion.div
                    key={`children-${category.id}`}
                    variants={childrenVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden bg-[#fafafa]"
                  >
                    <div className="border-r border-black/[0.045]">
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

export default function DesktopCategoriesDrawer(props: Props) {
  const {
    open,
    topParents,
    activeParentId,
    activeChildId,
    childrenByParent,
    desktopCurrentChildren,
    clearAll,
    onClose,
    handleDesktopCategorySelect,
  } = props;

  const [categoryRevealReady, setCategoryRevealReady] =
    useState(false);

  const [expandedIds, setExpandedIds] =
    useState<Set<number>>(new Set());

  const revealFrameRef = useRef<number | null>(null);

  const rootItems =
    topParents.length > 0
      ? topParents
      : desktopCurrentChildren;

  const hasActiveSelection =
    activeParentId !== null ||
    activeChildId !== null;

  useEffect(() => {
    if (!open) {
      setCategoryRevealReady(false);
      setExpandedIds(new Set());
      return;
    }

    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (activeParentId !== null) {
        next.add(activeParentId);
      }

      if (activeChildId !== null) {
        for (const [
          parentId,
          children,
        ] of childrenByParent.entries()) {
          const containsActiveChild = children.some(
            (child) => child.id === activeChildId,
          );

          if (containsActiveChild) {
            next.add(parentId);
          }
        }
      }

      return next;
    });

    return () => {
      if (revealFrameRef.current !== null) {
        window.cancelAnimationFrame(
          revealFrameRef.current,
        );

        revealFrameRef.current = null;
      }
    };
  }, [
    open,
    activeParentId,
    activeChildId,
    childrenByParent,
  ]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  const handleDrawerAnimationComplete = () => {
    if (!open) return;

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(
        revealFrameRef.current,
      );
    }

    revealFrameRef.current =
      window.requestAnimationFrame(() => {
        setCategoryRevealReady(true);
        revealFrameRef.current = null;
      });
  };

  const handleToggleCategory = (
    categoryId: number,
  ) => {
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

  return (
    <ClientOnlyPortal>
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          setCategoryRevealReady(false);
          setExpandedIds(new Set());
        }}
      >
        {open && (
          <motion.div
            key="desktop-categories-root"
            className="fixed inset-0 z-[99999] isolate hidden lg:block"
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
              onClick={onClose}
              className="absolute inset-0 z-0 block h-full w-full border-0 p-0"
              style={{
                WebkitTapHighlightColor:
                  "transparent",
                willChange:
                  "background-color, backdrop-filter",
              }}
            />

            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-full max-w-[450px] items-stretch p-3">
              <motion.div
                key="desktop-categories-drawer"
                initial={{
                  x: 540,
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
                      ease: "easeOut" as const,
                    },
                    scale: {
                      duration: 0.74,
                      ease: enterEase,
                    },
                  },
                }}
                exit={{
                  x: 540,
                  opacity: 0,
                  scale: 0.982,
                  transition: {
                    x: {
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
                onAnimationComplete={
                  handleDrawerAnimationComplete
                }
                className="pointer-events-auto relative z-20 h-full w-full"
                style={{
                  transformOrigin: "right center",
                  willChange: "transform, opacity",
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                {/* دکمه بستن در بیرون و مرکز عمودی پنل */}
                <div className="absolute left-[-56px] top-1/2 z-30 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="بستن"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur-[18px] transition-transform duration-200 hover:scale-105 active:scale-95"
                    style={{
                      WebkitTapHighlightColor:
                        "transparent",
                    }}
                  >
                    <XIcon
                      size={15}
                      weight="regular"
                    />
                  </button>
                </div>

                <aside
                  role="dialog"
                  aria-modal="true"
                  aria-label="دسته‌بندی محصولات"
                  className="maison-filter-panel flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
                >
                  {/* Header */}
                  <div className="shrink-0 border-b border-black/[0.05] bg-white px-5 pb-5 pt-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                      <div />

                      <h3 className="text-center text-[13.25px] font-[500] leading-6 tracking-[-0.025em] text-[#111111]">
                        دسته‌بندی
                      </h3>

                      <div className="flex justify-end">
                        <AnimatePresence initial={false}>
                          {hasActiveSelection && (
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
                              onClick={handleClearAll}
                              className="text-[10.5px] font-normal leading-5 tracking-[-0.01em] text-black/55 transition-colors duration-300 hover:text-black active:text-black"
                              style={{
                                WebkitTapHighlightColor:
                                  "transparent",
                              }}
                            >
                              پاک کردن
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-3 pb-5 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {rootItems.length > 0 ? (
                      <CategoryAccordionList
                        items={rootItems}
                        revealReady={
                          categoryRevealReady
                        }
                        activeParentId={
                          activeParentId
                        }
                        activeChildId={
                          activeChildId
                        }
                        childrenByParent={
                          childrenByParent
                        }
                        expandedIds={expandedIds}
                        onToggle={
                          handleToggleCategory
                        }
                        onSelect={
                          handleDesktopCategorySelect
                        }
                      />
                    ) : (
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        className="flex h-40 items-center justify-center text-[12px] font-normal text-black/40"
                      >
                        دسته‌بندی‌ای برای نمایش وجود ندارد
                      </motion.div>
                    )}
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
