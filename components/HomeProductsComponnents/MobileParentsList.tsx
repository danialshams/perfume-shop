"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Grid2X2, X } from "lucide-react";

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
    topParents: Category[];
    activeParentId: number | null;
    childrenByParent: Map<number, Category[]>;
    clearAll: () => void;
    closeMobileCategoriesSheet: () => void;
    openMobileChildrenSheet: (parentId: number) => void;
    handleParentSelect: (parentId: number, hasChildren: boolean) => void;
};

const springFast = {
    type: "spring" as const,
    stiffness: 520,
    damping: 42,
    mass: 0.65,
};

const listVariants = {
    initial: { opacity: 1 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.018,
            delayChildren: 0.025,
        },
    },
    exit: {
        opacity: 1,
    },
};

const itemVariants = {
    initial: {
        opacity: 0,
        y: 7,
        scale: 0.99,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: 4,
        scale: 0.995,
    },
};

const checkVariants = {
    initial: {
        opacity: 0,
        scale: 0.7,
        x: 4,
    },
    animate: {
        opacity: 1,
        scale: 1,
        x: 0,
    },
    exit: {
        opacity: 0,
        scale: 0.7,
        x: 4,
    },
};

export default function MobileParentsList({
    topParents,
    activeParentId,
    childrenByParent,
    clearAll,
    closeMobileCategoriesSheet,
    openMobileChildrenSheet,
    handleParentSelect,
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={springFast}
        >
            <div className="mb-4 flex items-center justify-between gap-4 px-0.5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.62)] text-[#111827]">
                        <Grid2X2 size={15} strokeWidth={1.95} />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold tracking-[-0.025em] text-[#0f172a]">
                            دسته‌بندی‌ها
                        </h3>
                    </div>
                </div>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={closeMobileCategoriesSheet}
                    className="flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.62)] text-[#475569] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.9)]"
                    aria-label="بستن"
                >
                    <X size={18} strokeWidth={2.05} />
                </motion.button>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#f2f5f8] bg-[rgba(255,255,255,0.76)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                <div className="max-h-[min(58vh,560px)] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <motion.div
                        variants={listVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="divide-y divide-[rgba(238,242,247,0.88)]"
                    >
                        <motion.button
                            variants={itemVariants}
                            type="button"
                            whileTap={{ scale: 0.99 }}
                            onClick={clearAll}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-right transition-all duration-200 ${
                                !activeParentId
                                    ? "bg-[rgba(15,23,42,0.032)] text-[#0f172a]"
                                    : "bg-transparent text-[#5f6b7d] hover:bg-[rgba(15,23,42,0.022)] hover:text-[#0f172a]"
                            }`}
                        >
                            <span className="text-[13px] font-semibold tracking-[-0.014em]">
                                همه
                            </span>

                            <AnimatePresence>
                                {!activeParentId && (
                                    <motion.div
                                        variants={checkVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={springFast}
                                    >
                                        <Check
                                            size={15}
                                            strokeWidth={2.35}
                                            className="shrink-0 text-[#111827]"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {topParents.map((parent) => {
                            const children = childrenByParent.get(parent.id) ?? [];
                            const hasChildren = children.length > 0;
                            const isActive = activeParentId === parent.id;

                            return (
                                <motion.button
                                    key={parent.id}
                                    variants={itemVariants}
                                    type="button"
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {
                                        if (hasChildren) {
                                            openMobileChildrenSheet(parent.id);
                                        } else {
                                            handleParentSelect(parent.id, false);
                                        }
                                    }}
                                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-right transition-all duration-200 ${
                                        isActive
                                            ? "bg-[rgba(15,23,42,0.032)] text-[#0f172a]"
                                            : "bg-transparent text-[#5f6b7d] hover:bg-[rgba(15,23,42,0.022)] hover:text-[#0f172a]"
                                    }`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-[13px] font-semibold tracking-[-0.014em]">
                                            {parent.name}
                                        </span>
                                    </span>

                                    <span className="flex shrink-0 items-center gap-2">
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.span
                                                    variants={checkVariants}
                                                    initial="initial"
                                                    animate="animate"
                                                    exit="exit"
                                                    transition={springFast}
                                                >
                                                    <Check
                                                        size={15}
                                                        strokeWidth={2.35}
                                                        className="shrink-0 text-[#111827]"
                                                    />
                                                </motion.span>
                                            )}
                                        </AnimatePresence>

                                        {hasChildren && (
                                            <ChevronLeft
                                                size={16}
                                                strokeWidth={2}
                                                className="text-[#94a3b8]"
                                            />
                                        )}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
