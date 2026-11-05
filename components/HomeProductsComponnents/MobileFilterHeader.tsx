"use client";

import { FadersHorizontalIcon, ArrowsDownUpIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

type Props = {
  activeFilterLabel?: string | null;
  activeSortLabel?: string | null;
  hasActiveFilter?: boolean;
  openMobileCategoriesSheet?: () => void;
  openMobileSortSheet?: () => void;
  openDesktopCategoriesDrawer?: () => void;
  openDesktopFilterDrawer?: () => void;
  className?: string;
};
export default function MobileFilterHeader({
  activeFilterLabel, activeSortLabel, hasActiveFilter = false,
  openMobileCategoriesSheet, openMobileSortSheet,
  openDesktopCategoriesDrawer, openDesktopFilterDrawer, className = ""
}:Props) {
 const onCategories = openDesktopCategoriesDrawer ?? openMobileCategoriesSheet;
 const onSort = openDesktopFilterDrawer ?? openMobileSortSheet;
 return <div dir="rtl" className={className}>
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d1d6d1] pb-4">
   <div className="min-w-0 text-right"><p className="text-[12px] font-normal text-[#303936]">{activeFilterLabel || "همه عطرها"}</p>
   {hasActiveFilter && <p className="mt-1 text-[10px] text-[#727e75]">فیلتر فعال</p>}</div>
   <div className="flex shrink-0 items-center gap-4">
    <motion.button whileTap={{scale:.96}} type="button" onClick={onCategories} aria-label="دسته‌بندی محصولات" className="inline-flex items-center gap-2 text-[12px] text-[#53605a]"><FadersHorizontalIcon size={18} weight="light"/> دسته‌بندی</motion.button>
    <motion.button whileTap={{scale:.96}} type="button" onClick={onSort} aria-label="مرتب‌سازی محصولات" className="inline-flex items-center gap-1.5 text-[12px] text-[#53605a]"><ArrowsDownUpIcon size={17} weight="light"/>{activeSortLabel || "مرتب‌سازی"}</motion.button>
   </div>
  </div>
 </div>;
}
