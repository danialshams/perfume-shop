"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { MutableRefObject } from "react";

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
    openParentId: number | null;
    childrenByParent: Map<number, Category[]>;
    triggerRefs: MutableRefObject<Record<number, HTMLButtonElement | null>>;
    clearAll: () => void;
    handleParentSelect: (parentId: number, hasChildren: boolean) => void;
    toggleChildrenOverlay: (parentId: number) => void;
    updateDropdownPosition: (parentId: number) => void;
};

const springFast = {
    type: "spring" as const,
    stiffness: 520,
    damping: 42,
    mass: 0.65,
};

export default function DesktopFilterNav({
    topParents,
    activeParentId,
    openParentId,
    childrenByParent,
    triggerRefs,
    clearAll,
    handleParentSelect,
    toggleChildrenOverlay,
    updateDropdownPosition,
}: Props) {
    return (
        <div
            className="hidden items-center overflow-x-auto overflow-y-hidden scroll-smooth px-2.5 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex"
            onScroll={() => {
                if (openParentId) updateDropdownPosition(openParentId);
            }}
        >
            <motion.button
                type="button"
                whileTap={{ scale: 0.988 }}
                onClick={clearAll}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-3 text-[13px] tracking-[-0.018em] outline-none transition-all duration-300 focus:outline-none ${
                    !activeParentId
                        ? "font-semibold text-[#0f172a]"
                        : "font-medium text-[#969fad] hover:text-[#111827]"
                }`}
            >
                <span className="block leading-none">همه</span>
            </motion.button>

            {topParents.map((parent) => {
                const children = childrenByParent.get(parent.id) ?? [];
                const hasChildren = children.length > 0;
                const isActive = activeParentId === parent.id;
                const isDesktopOpen = openParentId === parent.id;

                return (
                    <div key={parent.id} className="flex shrink-0 items-center">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.988 }}
                            onClick={() => handleParentSelect(parent.id, hasChildren)}
                            className={`shrink-0 cursor-pointer rounded-full px-4 py-3 text-[13px] tracking-[-0.018em] outline-none transition-all duration-300 focus:outline-none ${
                                isActive
                                    ? "font-semibold text-[#0f172a]"
                                    : "font-medium text-[#969fad] hover:text-[#111827]"
                            }`}
                        >
                            <span className="block leading-none">{parent.name}</span>
                        </motion.button>

                        {hasChildren && (
                            <motion.button
                                type="button"
                                ref={(element) => {
                                    triggerRefs.current[parent.id] = element;
                                }}
                                whileTap={{ scale: 0.965 }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggleChildrenOverlay(parent.id);
                                }}
                                aria-expanded={isDesktopOpen}
                                aria-haspopup="menu"
                                aria-label={`نمایش زیرمجموعه ${parent.name}`}
                                className={`-mr-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full outline-none transition-all duration-300 focus:outline-none ${
                                    isDesktopOpen
                                        ? "text-[#3f4b5a]"
                                        : "text-[#c4cbd5] hover:text-[#788394]"
                                }`}
                            >
                                <motion.div
                                    animate={{ rotate: isDesktopOpen ? 180 : 0 }}
                                    transition={springFast}
                                >
                                    <ChevronDown size={11.5} strokeWidth={1.65} />
                                </motion.div>
                            </motion.button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
