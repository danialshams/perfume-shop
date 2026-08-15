"use client";

import { FadersHorizontalIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

type Props = {
  activeFilterLabel?: string | null;
  openMobileCategoriesSheet?: () => void;
  openDesktopCategoriesDrawer?: () => void;
  className?: string;
};

export default function MobileFilterHeader({
  activeFilterLabel,
  openMobileCategoriesSheet,
  openDesktopCategoriesDrawer,
  className = "",
}: Props) {
  const handleOpenCategories =
    openDesktopCategoriesDrawer ?? openMobileCategoriesSheet;

  const title = activeFilterLabel
    ? `محصولات / گروه بویایی / ${activeFilterLabel}`
    : "محصولات";

  return (
    <div dir="rtl" className={className}>
      <div className="flex items-center justify-between pb-3">
        <div className="text-right text-[13px] font-light leading-none tracking-[0.08em] text-[#7B8487]">
          {title}
        </div>

        <motion.button
          type="button"
          whileTap={{ opacity: 0.92, scale: 0.985 }}
          transition={{ duration: 0.15 }}
          onClick={handleOpenCategories}
          aria-label="باز کردن فیلترها"
          className="flex cursor-pointer items-center gap-2 text-[12px] font-light text-[#33383C] focus-visible:outline-none"
        >
          <FadersHorizontalIcon size={22} weight="regular" />
          <span>دسته بندی</span>
        </motion.button>
      </div>
    </div>
  );
}
