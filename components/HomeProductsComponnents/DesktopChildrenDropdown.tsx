"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

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
    renderedParentId: number | null;
    renderedParent: Category | null;
    renderedChildren: Category[];
    openParentId: number | null;
    activeParentId: number | null;
    activeChildId: number | null;
    dropdownPos: {
        top: number;
        left: number;
        width: number;
    };
    handleChildSelect: (parentId: number, childId: number | null) => void;
};

const springFast = {
    type: "spring" as const,
    stiffness: 520,
    damping: 42,
    mass: 0.65,
};

const dropdownVariants = {
    initial: {
        opacity: 0,
        y: -6,
        scale: 0.985,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: -6,
        scale: 0.985,
    },
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

export default function DesktopChildrenDropdown({
    renderedParentId,
    renderedParent,
    renderedChildren,
    openParentId,
    activeParentId,
    activeChildId,
    dropdownPos,
    handleChildSelect,
}: Props) {
    return (
        <AnimatePresence mode="wait">
            {renderedParentId && renderedChildren.length > 0 && openParentId && (
                <motion.div
                    key={`desktop-dropdown-${renderedParentId}`}
                    role="menu"
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={springFast}
                    className="fixed z-50 hidden overflow-hidden rounded-[28px] border border-[rgba(234,238,244,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.975),rgba(253,253,254,0.955))] shadow-[0_24px_60px_rgba(15,23,42,0.06),0_6px_18px_rgba(15,23,42,0.018),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-2xl sm:block"
                    style={{
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: Math.min(dropdownPos.width, 284),
                        willChange: "transform, opacity",
                    }}
                >
                    <div className="px-3 py-3">
                        <div className="mb-2.5 px-2 pt-0.5">
                            <h4 className="truncate text-[12px] font-semibold tracking-[-0.014em] text-[#111827]">
                                {renderedParent?.name}
                            </h4>
                        </div>

                        <div className="overflow-hidden rounded-[22px] bg-[rgba(255,255,255,0.72)]">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.993 }}
                                onClick={() => handleChildSelect(renderedParentId, null)}
                                className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-right transition-all duration-300 focus:outline-none ${
                                    activeParentId === renderedParentId && activeChildId === null
                                        ? "bg-[rgba(15,23,42,0.024)] text-[#0f172a]"
                                        : "bg-transparent text-[#727b8a] hover:bg-[rgba(15,23,42,0.012)] hover:text-[#111827]"
                                }`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-[12.5px] font-semibold tracking-[-0.012em]">
                                        همه {renderedParent?.name ?? ""}
                                    </span>
                                </span>

                                <AnimatePresence>
                                    {activeParentId === renderedParentId && activeChildId === null && (
                                        <motion.div
                                            variants={checkVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={springFast}
                                        >
                                            <Check
                                                size={12}
                                                strokeWidth={2}
                                                className="shrink-0 text-[#4b5563]"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            <div className="mx-4 h-px bg-[rgba(245,247,250,0.95)]" />

                            <div className="max-h-64 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <motion.div
                                    variants={listVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="divide-y divide-[rgba(246,248,251,0.95)]"
                                >
                                    {renderedChildren.map((child) => {
                                        const isChildActive =
                                            activeParentId === renderedParentId &&
                                            activeChildId === child.id;

                                        return (
                                            <motion.button
                                                key={child.id}
                                                variants={itemVariants}
                                                type="button"
                                                whileTap={{ scale: 0.993 }}
                                                transition={springFast}
                                                onClick={() =>
                                                    handleChildSelect(renderedParentId, child.id)
                                                }
                                                className={`flex min-h-[45px] w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-right transition-all duration-300 focus:outline-none ${
                                                    isChildActive
                                                        ? "bg-[rgba(15,23,42,0.024)] text-[#0f172a]"
                                                        : "bg-transparent text-[#727b8a] hover:bg-[rgba(15,23,42,0.012)] hover:text-[#111827]"
                                                }`}
                                            >
                                                <span className="truncate text-[12.5px] font-medium tracking-[-0.01em]">
                                                    {child.name}
                                                </span>

                                                <AnimatePresence>
                                                    {isChildActive && (
                                                        <motion.div
                                                            variants={checkVariants}
                                                            initial="initial"
                                                            animate="animate"
                                                            exit="exit"
                                                            transition={springFast}
                                                        >
                                                            <Check
                                                                size={12}
                                                                strokeWidth={2}
                                                                className="shrink-0 text-[#4b5563]"
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
