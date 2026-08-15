"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import DesktopCategoriesDrawer from "./DesktopCategoriesDrawer";
import DesktopFilterBarSkeleton from "./DesktopFilterBarSkeleton";
import DesktopFilterDrawer from "./DesktopFilterDrawer";
import FilterBarSkeleton from "./FilterBarSkeleton";
import MobileCategoriesSheet from "./MobileCategoriesSheet";
import MobileFilterHeader from "./MobileFilterHeader";
import { type SortOption } from "./MobileSortSheet";

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
  children_count?: number;
  has_children: boolean;
};

type Props = {
  categories: Category[];
  activeParentId: number | null;
  activeChildId: number | null;
  setActiveParentId: (id: number | null) => void;
  setActiveChildId: (id: number | null) => void;
  loadingCategories: boolean;
  activeFilterLabel?: string | null; // پراپ اضافه شده برای دریافت نام گروه بویایی از والد
};

const springSoft = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.75,
};

const MOBILE_SHEET_CLOSE_MS = 1225;

export default function ProductsFilterBar({
  categories,
  activeParentId,
  activeChildId,
  setActiveParentId,
  setActiveChildId,
  loadingCategories = false,
  activeFilterLabel: scentFamilyFilterLabel, // تغییر نام متغیر محلی برای عدم تداخل
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mobilePathResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  const [desktopCategoriesOpen, setDesktopCategoriesOpen] = useState(false);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);

  const [selectedSort, setSelectedSort] = useState<SortOption>("newest");
  const [mobileCategoryPath, setMobileCategoryPath] = useState<number[]>([]);
  const [desktopCategoryPath, setDesktopCategoryPath] = useState<number[]>([]);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const topParents = useMemo(() => {
    return categories.filter(
      (category) => (category.parent_ids?.length ?? 0) === 0,
    );
  }, [categories]);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, Category[]>();

    categories.forEach((category) => {
      (category.parent_ids ?? []).forEach((parentId) => {
        const current = map.get(parentId) ?? [];
        current.push(category);
        map.set(parentId, current);
      });
    });

    return map;
  }, [categories]);

  const mobileCurrentCategoryId =
    mobileCategoryPath.length > 0
      ? mobileCategoryPath[mobileCategoryPath.length - 1]
      : null;

  const mobileRootCategoryId =
    mobileCategoryPath.length > 0 ? mobileCategoryPath[0] : null;

  const mobileCurrentCategory = useMemo(() => {
    if (!mobileCurrentCategoryId) return null;
    return categoriesById.get(mobileCurrentCategoryId) ?? null;
  }, [categoriesById, mobileCurrentCategoryId]);

  const mobileCurrentChildren = mobileCurrentCategoryId
    ? childrenByParent.get(mobileCurrentCategoryId) ?? []
    : topParents;

  const desktopCurrentCategoryId =
    desktopCategoryPath.length > 0
      ? desktopCategoryPath[desktopCategoryPath.length - 1]
      : null;

  const desktopRootCategoryId =
    desktopCategoryPath.length > 0 ? desktopCategoryPath[0] : null;

  const desktopCurrentCategory = useMemo(() => {
    if (!desktopCurrentCategoryId) return null;
    return categoriesById.get(desktopCurrentCategoryId) ?? null;
  }, [categoriesById, desktopCurrentCategoryId]);

  const desktopCurrentChildren = desktopCurrentCategoryId
    ? childrenByParent.get(desktopCurrentCategoryId) ?? []
    : topParents;

  const hasActiveFilter = Boolean(activeParentId || activeChildId || scentFamilyFilterLabel);

  // محاسبه برچسب فیلتر فعال با اولویت گروه بویایی ارسال شده از والد، سپس دسته‌بندی‌ها
  const finalActiveFilterLabel = useMemo(() => {
    if (scentFamilyFilterLabel) {
      return scentFamilyFilterLabel;
    }

    if (activeChildId) {
      return categoriesById.get(activeChildId)?.name ?? null;
    }

    if (activeParentId) {
      return categoriesById.get(activeParentId)?.name ?? null;
    }

    return null;
  }, [categoriesById, activeParentId, activeChildId, scentFamilyFilterLabel]);

  const activeSortLabel = useMemo(() => {
    switch (selectedSort) {
      case "lowest":
        return "ارزان‌ترین";
      case "highest":
        return "گران‌ترین";
      case "newest":
        return "جدیدترین";
      case "bestselling":
        return "پرفروش‌ترین";
      default:
        return null;
    }
  }, [selectedSort]);

  const clearMobilePathResetTimer = () => {
    if (mobilePathResetTimerRef.current) {
      clearTimeout(mobilePathResetTimerRef.current);
      mobilePathResetTimerRef.current = null;
    }
  };

  const resetMobileCategoryPathWithDelay = () => {
    clearMobilePathResetTimer();

    mobilePathResetTimerRef.current = window.setTimeout(() => {
      setMobileCategoryPath([]);
      mobilePathResetTimerRef.current = null;
    }, MOBILE_SHEET_CLOSE_MS);
  };

  const closeMobileCategoriesSheet = () => {
    setMobileCategoriesOpen(false);
    resetMobileCategoryPathWithDelay();
  };

  const closeMobileSortSheet = () => {
    setMobileSortOpen(false);
  };

  const openMobileCategoriesSheet = () => {
    clearMobilePathResetTimer();

    setMobileSortOpen(false);
    setDesktopCategoriesOpen(false);
    setDesktopFilterOpen(false);
    setMobileCategoryPath([]);

    requestAnimationFrame(() => {
      setMobileCategoriesOpen(true);
    });
  };

  const openMobileSortSheet = () => {
    clearMobilePathResetTimer();

    setMobileCategoriesOpen(false);
    setDesktopCategoriesOpen(false);
    setDesktopFilterOpen(false);
    setMobileCategoryPath([]);

    requestAnimationFrame(() => {
      setMobileSortOpen(true);
    });
  };

  const openDesktopCategoriesDrawer = () => {
    clearMobilePathResetTimer();

    setMobileCategoriesOpen(false);
    setMobileSortOpen(false);
    setDesktopFilterOpen(false);
    setDesktopCategoryPath([]);

    requestAnimationFrame(() => {
      setDesktopCategoriesOpen(true);
    });
  };

  const closeDesktopCategoriesDrawer = () => {
    setDesktopCategoriesOpen(false);
    setDesktopCategoryPath([]);
  };

  const openDesktopFilterDrawer = () => {
    clearMobilePathResetTimer();

    setMobileCategoriesOpen(false);
    setMobileSortOpen(false);
    setDesktopCategoriesOpen(false);

    requestAnimationFrame(() => {
      setDesktopFilterOpen(true);
    });
  };

  const closeDesktopFilterDrawer = () => {
    setDesktopFilterOpen(false);
  };

  const openMobileChildrenSheet = (categoryId: number) => {
    setMobileCategoryPath((prev) => [...prev, categoryId]);
  };

  const goBackMobileCategoryLevel = () => {
    setMobileCategoryPath((prev) => prev.slice(0, -1));
  };

  const openDesktopChildrenLevel = (categoryId: number) => {
    setDesktopCategoryPath((prev) => [...prev, categoryId]);
  };

  const goBackDesktopCategoryLevel = () => {
    setDesktopCategoryPath((prev) => prev.slice(0, -1));
  };

  const closeAllOverlays = () => {
    setMobileCategoriesOpen(false);
    setMobileSortOpen(false);
    setDesktopCategoriesOpen(false);
    setDesktopFilterOpen(false);

    resetMobileCategoryPathWithDelay();
    setDesktopCategoryPath([]);
  };

  const clearAll = () => {
    setActiveParentId(null);
    setActiveChildId(null);
    closeAllOverlays();
  };

  const handleMobileCategorySelect = (
    categoryId: number,
    rootParentId: number,
  ) => {
    if (categoryId === rootParentId) {
      setActiveParentId(rootParentId);
      setActiveChildId(null);
    } else {
      setActiveParentId(rootParentId);
      setActiveChildId(categoryId);
    }

    closeAllOverlays();
  };

  const handleDesktopCategorySelect = (
    categoryId: number,
    rootParentId: number,
  ) => {
    if (categoryId === rootParentId) {
      setActiveParentId(rootParentId);
      setActiveChildId(null);
    } else {
      setActiveParentId(rootParentId);
      setActiveChildId(categoryId);
    }

    closeAllOverlays();
  };

  const handleSortSelect = (value: SortOption) => {
    setSelectedSort(value);
    closeMobileSortSheet();
    closeDesktopFilterDrawer();
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllOverlays();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (
      !mobileCategoriesOpen &&
      !mobileSortOpen &&
      !desktopCategoriesOpen &&
      !desktopFilterOpen
    ) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [
    mobileCategoriesOpen,
    mobileSortOpen,
    desktopCategoriesOpen,
    desktopFilterOpen,
  ]);

  useEffect(() => {
    return () => {
      clearMobilePathResetTimer();
    };
  }, []);

  if (loadingCategories) {
    return (
      <>
        <div className="lg:hidden">
          <FilterBarSkeleton />
        </div>

        <div className="hidden lg:block">
          <DesktopFilterBarSkeleton />
        </div>
      </>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-0 pb-1 pt-2 sm:py-5">
      <div ref={rootRef} className="relative">
        <MobileFilterHeader
          className="md:hidden px-4"
          hasActiveFilter={hasActiveFilter}
          activeFilterLabel={finalActiveFilterLabel}
          activeSortLabel={activeSortLabel}
          openMobileCategoriesSheet={openMobileCategoriesSheet}
          openMobileSortSheet={openMobileSortSheet}
        />

        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.997 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springSoft}
          className="hidden md:block px-4 lg:px-6"
        >
          <MobileFilterHeader
            className="block"
            hasActiveFilter={hasActiveFilter}
            activeFilterLabel={finalActiveFilterLabel}
            activeSortLabel={activeSortLabel}
            openDesktopCategoriesDrawer={openDesktopCategoriesDrawer}
            openDesktopFilterDrawer={openDesktopFilterDrawer}
          />
        </motion.div>

        <MobileCategoriesSheet
          open={mobileCategoriesOpen}
          topParents={topParents}
          activeParentId={activeParentId}
          activeChildId={activeChildId}
          childrenByParent={childrenByParent}
          mobileCategoryPath={mobileCategoryPath}
          mobileRootCategoryId={mobileRootCategoryId}
          mobileCurrentCategory={mobileCurrentCategory}
          mobileCurrentChildren={mobileCurrentChildren}
          clearAll={clearAll}
          closeMobileCategoriesSheet={closeMobileCategoriesSheet}
          openMobileChildrenSheet={openMobileChildrenSheet}
          goBackMobileCategoryLevel={goBackMobileCategoryLevel}
          handleMobileCategorySelect={handleMobileCategorySelect}
        />

        <DesktopCategoriesDrawer
          open={desktopCategoriesOpen}
          topParents={topParents}
          activeParentId={activeParentId}
          activeChildId={activeChildId}
          childrenByParent={childrenByParent}
          desktopCategoryPath={desktopCategoryPath}
          desktopRootCategoryId={desktopRootCategoryId}
          desktopCurrentCategory={desktopCurrentCategory}
          desktopCurrentChildren={desktopCurrentChildren}
          clearAll={clearAll}
          onClose={closeDesktopCategoriesDrawer}
          openDesktopChildrenLevel={openDesktopChildrenLevel}
          goBackDesktopCategoryLevel={goBackDesktopCategoryLevel}
          handleDesktopCategorySelect={handleDesktopCategorySelect}
        />

        <DesktopFilterDrawer
          open={desktopFilterOpen}
          selectedSort={selectedSort}
          activeFilterLabel={finalActiveFilterLabel}
          hasActiveFilter={hasActiveFilter}
          onSelectSort={handleSortSelect}
          onClearAll={clearAll}
          onClose={closeDesktopFilterDrawer}
        />
      </div>
    </section>
  );
}
