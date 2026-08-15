"use client";

import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";

import type { NavItem } from "./navbar.types";

type CategoryApiItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: number | boolean | string;
  created_at: string;
  updated_at: string;
  parent_ids?: number[] | null;
  parent_names?: string[] | null;
  has_children?: boolean | number;
};

type CategoriesResponse = {
  success: boolean;
  message: string;
  data: CategoryApiItem[];
};

type CategoryTreeNode = {
  id: number;
  name: string;
  slug: string;
  href: string;
  children: CategoryTreeNode[];
};

type CustomerProfile = {
  first_name?: string;
  last_name?: string;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function normalizeBoolean(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  return Boolean(value);
}

function normalizeParentIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

function isActiveCategory(item: CategoryApiItem): boolean {
  return normalizeBoolean(item.is_active);
}

function buildCategoryTree(items: CategoryApiItem[]): CategoryTreeNode[] {
  const activeItems = items.filter(isActiveCategory);

  const itemById = new Map<number, CategoryApiItem>();
  activeItems.forEach((item) => {
    itemById.set(Number(item.id), {
      ...item,
      parent_ids: normalizeParentIds(item.parent_ids),
    });
  });

  const childrenByParentId = new Map<number, CategoryApiItem[]>();

  activeItems.forEach((rawItem) => {
    const item = {
      ...rawItem,
      parent_ids: normalizeParentIds(rawItem.parent_ids),
    };

    item.parent_ids.forEach((parentId) => {
      if (!itemById.has(parentId)) return;

      const currentChildren = childrenByParentId.get(parentId) ?? [];
      const exists = currentChildren.some(
        (child) => Number(child.id) === Number(item.id),
      );

      if (!exists) {
        currentChildren.push(item);
      }

      childrenByParentId.set(parentId, currentChildren);
    });
  });

  const createNode = (
    item: CategoryApiItem,
    visited = new Set<number>(),
  ): CategoryTreeNode => {
    const currentId = Number(item.id);

    if (visited.has(currentId)) {
      return {
        id: currentId,
        name: item.name,
        slug: item.slug,
        href: `/category/${item.slug}`,
        children: [],
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(currentId);

    const rawChildren = childrenByParentId.get(currentId) ?? [];

    const children = rawChildren
      .filter((child) => !nextVisited.has(Number(child.id)))
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((child) => createNode(child, nextVisited));

    return {
      id: currentId,
      name: item.name,
      slug: item.slug,
      href: `/category/${item.slug}`,
      children,
    };
  };

  const roots = activeItems
    .map((item) => ({
      ...item,
      parent_ids: normalizeParentIds(item.parent_ids),
    }))
    .filter((item) => item.parent_ids.length === 0)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((item) => createNode(item));

  return roots;
}

function isCategoryTreeActive(
  node: CategoryTreeNode,
  isActive: (href: string) => boolean,
): boolean {
  if (isActive(node.href)) return true;
  return node.children.some((child) => isCategoryTreeActive(child, isActive));
}

function isCategoryNavItem(item: NavItem): boolean {
  const label = item.label?.toLowerCase?.() ?? "";
  const href = item.href?.toLowerCase?.() ?? "";

  return (
    label.includes("دسته") ||
    label.includes("category") ||
    href.includes("category") ||
    href.includes("categories") ||
    href.includes("categor")
  );
}

/** فاصله‌ی افقی خط راهنما - مقدار منفی کمتر یعنی خط به راست (جلوتر) می‌رود */
const LINE_HORIZONTAL_OFFSET = 0; // از 10- به 0 تغییر (خط جلوی گزینه‌ها)

/** تودرفتگی کل دراپ‌داون نسبت به گزینه‌ی اصلی */
const DROPDOWN_INDENT = 38; // از 22 به 38 افزایش

/** کنواس مشترک برای اندازه‌گیری متریک فونت */
let glyphMeasureCanvas: HTMLCanvasElement | null = null;

/**
 * فاصله‌ی واقعی حروف از لبه‌ی بالا و پایینِ جعبه‌ی خط را برمی‌گرداند.
 */
function getTextInsets(el: HTMLElement): { top: number; bottom: number } {
  const cs = getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize) || 0;
  const parsedLineHeight = parseFloat(cs.lineHeight);
  const lineHeight = Number.isFinite(parsedLineHeight)
    ? parsedLineHeight
    : fontSize * 1.2;

  const fallback = Math.max(0, (lineHeight - fontSize) / 2);
  const fallbackResult = { top: fallback, bottom: fallback };

  const text = (el.textContent ?? "").trim();
  if (typeof document === "undefined" || !text || fontSize === 0) {
    return fallbackResult;
  }

  if (!glyphMeasureCanvas) {
    glyphMeasureCanvas = document.createElement("canvas");
  }

  const ctx = glyphMeasureCanvas.getContext("2d");
  if (!ctx) return fallbackResult;

  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;

  const metrics = ctx.measureText(text);
  const fontAscent = metrics.fontBoundingBoxAscent;
  const fontDescent = metrics.fontBoundingBoxDescent;
  const glyphAscent = metrics.actualBoundingBoxAscent;
  const glyphDescent = metrics.actualBoundingBoxDescent;

  const usable = [fontAscent, fontDescent, glyphAscent, glyphDescent].every(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  if (!usable) return fallbackResult;

  const contentHeight = fontAscent + fontDescent;
  const halfLeading = (lineHeight - contentHeight) / 2;
  const baselineFromTop = halfLeading + fontAscent;

  return {
    top: Math.max(0, baselineFromTop - glyphAscent),
    bottom: Math.max(0, lineHeight - (baselineFromTop + glyphDescent)),
  };
}

function CategoryAccordionItem({
  node,
  level = 0,
  isActive,
  onClose,
}: {
  node: CategoryTreeNode;
  level?: number;
  isActive: (href: string) => boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const childrenWrapRef = useRef<HTMLDivElement | null>(null);
  const firstRunRef = useRef(true);

  const hasChildren = node.children.length > 0;
  const active = isCategoryTreeActive(node, isActive);

  useEffect(() => {
    if (active && hasChildren) {
      setExpanded(true);
    }
  }, [active, hasChildren]);

const measureLine = () => {
  const wrap = childrenWrapRef.current;
  const line = lineRef.current;
  if (!wrap || !line) return;

  const rows = Array.from(
    wrap.querySelectorAll<HTMLElement>(":scope > div > [data-cat-row]"),
  );
  if (rows.length === 0) return;

  const firstLabel = rows[0].querySelector<HTMLElement>("[data-cat-label]");
  const lastLabel = rows[rows.length - 1].querySelector<HTMLElement>("[data-cat-label]");
  if (!firstLabel || !lastLabel) return;

  const wrapTop = wrap.getBoundingClientRect().top;
  const firstRect = firstLabel.getBoundingClientRect();
  const lastRect = lastLabel.getBoundingClientRect();

  // فقط از بالا 3 پیکسل کم می‌کنیم
  const top = firstRect.top - wrapTop + 3;
  const bottom = lastRect.bottom - wrapTop;

  gsap.set(line, { top, height: Math.max(0, bottom - top) });
};
  useEffect(() => {
    const wrap = childrenWrapRef.current;
    if (!wrap || !expanded || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => measureLine());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [expanded]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const line = lineRef.current;
    const wrap = childrenWrapRef.current;

    if (!content || !wrap) return;

    const childEls = Array.from(wrap.children) as HTMLElement[];
    const targets = [content, ...(line ? [line] : []), ...childEls];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf(targets);

    if (reduced) {
      gsap.set(content, {
        height: expanded ? "auto" : 0,
        opacity: expanded ? 1 : 0,
      });
      if (expanded) measureLine();
      if (line) gsap.set(line, { scaleY: expanded ? 1 : 0 });
      gsap.set(childEls, {
        opacity: expanded ? 1 : 0,
        y: 0,
        filter: "blur(0px)",
      });
      firstRunRef.current = false;
      return;
    }

    if (expanded) {
      gsap.set(content, { height: "auto", opacity: 1 });
      const targetHeight = content.scrollHeight;

      measureLine();

      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      fonts?.ready?.then(() => {
        if (lineRef.current) measureLine();
      });

      const tl = gsap.timeline();

      tl.fromTo(
        content,
        { height: 0 },
        {
          height: targetHeight,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => gsap.set(content, { height: "auto" }),
        },
        0,
      );

      if (line) {
        tl.fromTo(
          line,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.72, ease: "power2.out" },
          0,
        );
      }

      tl.fromTo(
        childEls,
        { opacity: 0, y: -6, filter: "blur(2.5px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.46,
          ease: "power3.out",
          stagger: 0.07,
        },
        0.32,
      );
    } else if (firstRunRef.current) {
      gsap.set(content, { height: 0, opacity: 0 });
      if (line) gsap.set(line, { scaleY: 0 });
      gsap.set(childEls, { opacity: 0, y: -6, filter: "blur(2.5px)" });
    } else {
      const tl = gsap.timeline();

      tl.to(
        childEls,
        {
          opacity: 0,
          y: -4,
          filter: "blur(2px)",
          duration: 0.2,
          ease: "power2.in",
          stagger: { each: 0.035, from: "end" },
        },
        0,
      );

      if (line) {
        tl.to(line, { scaleY: 0, duration: 0.3, ease: "power2.inOut" }, 0.08);
      }

      tl.to(
        content,
        { height: 0, opacity: 0, duration: 0.34, ease: "power2.inOut" },
        0.1,
      );
    }

    firstRunRef.current = false;
  }, [expanded]);

  return (
    <div className="w-full">
      <div
        data-cat-row
        className="flex items-center justify-between gap-3 py-[6px]"
        style={{ paddingRight: `${level * 16}px` }}
      >
        <Link href={node.href} onClick={onClose} className="group min-w-0 flex-1">
          <span className="flex min-w-0 items-center">
            <span
              data-cat-label
              className={`block truncate font-extralight leading-[1.75] transition-all duration-500 ${level === 0
                  ? "text-[15.25px] tracking-[-0.02em]"
                  : level === 1
                    ? "text-[14.25px] tracking-[-0.015em]"
                    : "text-[13.2px] tracking-[-0.01em]"
                } ${active
                  ? "text-[#33383C]"
                  : "text-[#706C66] group-hover:text-[#33383C]"
                }`}
            >
              {node.name}
            </span>
          </span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            aria-label={
              expanded ? `بستن زیرمنوی ${node.name}` : `باز کردن زیرمنوی ${node.name}`
            }
            aria-expanded={expanded}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#706C66] transition-all duration-300 hover:bg-black/[0.035] hover:text-[#33383C] active:scale-95"
          >
            <div
              className={`transform transition-transform duration-300 ${expanded ? "rotate-45" : "rotate-0"
                }`}
            >
              <Plus className="h-4 w-4" strokeWidth={1.35} />
            </div>
          </button>
        )}
      </div>

      {hasChildren && (
        <div
          ref={contentRef}
          className="overflow-hidden"
          style={{ height: 0, opacity: 0 }}
        >
          {/* تودرفتگی بیشتر کل بخش دراپ داون جهت جلوتر رفتن از گزینه والد */}
          <div style={{ paddingRight: `${DROPDOWN_INDENT}px` }}>
            <div className="relative">
              {/* خط راهنمای درختی - با right: 0 دقیقاً جلوی گزینه‌ها قرار می‌گیرد */}
              <div
                ref={lineRef}
                aria-hidden="true"
                className="pointer-events-none absolute w-[0.5px] origin-top bg-[#706C66]/40"
                style={{
                  top: 0,
                  height: 0,
                  right: `${LINE_HORIZONTAL_OFFSET}px`,
                  transform: "scaleY(0)",
                }}
              />

              <div ref={childrenWrapRef}>
                {node.children.map((child) => (
                  <CategoryAccordionItem
                    key={child.id}
                    node={child}
                    level={level + 1}
                    isActive={isActive}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileMenuOverlay({
  isOpen,
  setIsOpen,
  menuRef,
  panelRef,
  navItems,
  isActive,
  vazirClassName,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  vazirClassName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<"main" | "categories">("main");

  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<CustomerProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [, setMobile] = useState("");
  const [, setPassword] = useState("");
  const [, setLoginError] = useState("");

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const mainItemsContainerRef = useRef<HTMLDivElement | null>(null);
  const expandedContentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const setDrawerRef = (node: HTMLDivElement | null) => {
    drawerRef.current = node;

    if (menuRef) {
      (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const setExpandedContentRef = (key: string, node: HTMLDivElement | null) => {
    expandedContentRefs.current[key] = node;
  };

  const prepareItems = (container: HTMLDivElement | null) => {
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll(".menu-item"),
    ) as HTMLElement[];

    gsap.killTweensOf(items);

    gsap.set(items, {
      opacity: 0,
      y: -12,
      filter: "blur(3px)",
    });
  };

  const animateItems = (container: HTMLDivElement | null) => {
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll(".menu-item"),
    ) as HTMLElement[];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf(items);

    if (reduced) {
      gsap.set(items, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      });
      return;
    }

    gsap.fromTo(
      items,
      {
        opacity: 0,
        y: -10,
        filter: "blur(2.5px)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
        stagger: {
          each: 0.055,
          from: "start",
        },
        overwrite: "auto",
      },
    );
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOverlayVisible(true);
    } else {
      setUserDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);

        const res = await fetch("/api/v1/categories", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("خطا در دریافت دسته‌بندی‌ها");
        }

        const json: CategoriesResponse = await res.json();

        if (!json.success) {
          throw new Error(json.message || "خطا در دریافت دسته‌بندی‌ها");
        }

        if (!ignore) {
          setCategories(Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        if (!ignore && (error as Error).name !== "AbortError") {
          setCategoriesError(
            error instanceof Error ? error.message : "خطای نامشخص",
          );
          setCategories([]);
        }
      } finally {
        if (!ignore) {
          setCategoriesLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchCategories();
    }

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadUserProfile = async () => {
      try {
        const res = await fetch("/api/v1/customers/auth/me", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (active) setUserProfile(null);
          return;
        }

        const resData: ApiResponse<CustomerProfile> = await res.json();

        if (active) {
          setUserProfile(resData.success && resData.data ? resData.data : null);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && active) {
          console.error(error);
          setUserProfile(null);
        }
      } finally {
        if (active) setLoadingUser(false);
      }
    };

    if (isOpen) {
      setLoadingUser(true);
      loadUserProfile();
    }

    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    const triggerLogin = searchParams.get("openLogin");

    if (triggerLogin === "true" && !loadingUser && !userProfile) {
      setUserDropdownOpen(true);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("openLogin");

      const cleanUrl =
        pathname + (nextParams.toString() ? `?${nextParams.toString()}` : "");

      router.replace(cleanUrl);
    }
  }, [loadingUser, pathname, router, searchParams, userProfile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
        setTimeout(() => {
          setMobile("");
          setPassword("");
          setLoginError("");
        }, 150);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!drawerRef.current) return;

    gsap.set(drawerRef.current, {
      x: "100%",
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    if (!drawerRef.current) return;

    const drawer = drawerRef.current;
    gsap.killTweensOf(drawer);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isOpen) {
      prepareItems(mainItemsContainerRef.current);

      gsap.fromTo(
        drawer,
        { x: "100%", opacity: 1 },
        {
          x: "0%",
          opacity: 1,
          duration: reduced ? 0 : 0.82,
          ease: "power3.out",
        },
      );

      gsap.delayedCall(reduced ? 0 : 0.36, () => {
        animateItems(mainItemsContainerRef.current);
      });
    } else if (overlayVisible) {
      gsap.to(drawer, {
        x: "100%",
        opacity: 1,
        duration: reduced ? 0 : 0.75,
        ease: "power2.inOut",
        onComplete: () => {
          setExpandedItem(null);
          setActiveScreen("main");
          setOverlayVisible(false);
        },
      });
    }
  }, [isOpen, overlayVisible]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    navItems.forEach((item) => {
      const categoryItem = isCategoryNavItem(item);

      const hasChildren = !!item.children?.length && !categoryItem;

      if (!hasChildren) return;

      const content = expandedContentRefs.current[item.href];
      if (!content) return;

      gsap.killTweensOf(content);

      const isExpanded = expandedItem === item.href;

      if (reduced) {
        gsap.set(content, {
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        });
        return;
      }

      if (isExpanded) {
        gsap.set(content, { height: "auto" });
        const targetHeight = content.scrollHeight;

        gsap.fromTo(
          content,
          { height: 0, opacity: 0 },
          {
            height: targetHeight,
            opacity: 1,
            duration: 0.42,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(content, { height: "auto" });
            },
          },
        );
      } else {
        gsap.to(content, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }
    });
  }, [expandedItem, navItems]);

  if (!mounted || !overlayVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      dir="rtl"
      className={`${vazirClassName} fixed inset-0 z-[9999] min-[920px]:hidden`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div className="absolute inset-0 bg-black/[0.12] backdrop-blur-[10px]" />

      <div className="absolute inset-3 sm:inset-4">
        <div
          ref={setDrawerRef}
          className="h-full w-full overflow-hidden rounded-[10px] bg-[#F5F4F3] shadow-[0_34px_120px_rgba(0,0,0,0.13)] ring-1 ring-black/[0.055]"
          style={{ willChange: "transform, opacity" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-end px-5 pb-2 pt-5 sm:px-7 sm:pb-3 sm:pt-7">
              <button
                type="button"
                aria-label="بستن منو"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#33383C] transition-all duration-500 hover:rotate-90 hover:bg-black/[0.025] hover:text-[#33383C] active:scale-95"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.3} />
              </button>
            </div>

            <div
              className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-7 pt-2 sm:px-7 sm:pb-9 sm:pt-3"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="relative h-full w-full">
                {/* SCREEN: MAIN MENU */}
                <div
                  className={`w-full transition-all duration-500 ease-out-expo ${activeScreen === "main"
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none absolute inset-0"
                    }`}
                >
                  <nav
                    ref={mainItemsContainerRef}
                    className="flex w-full flex-col items-stretch gap-[clamp(17px,3vh,30px)] pb-[clamp(18px,3vh,34px)] pt-[clamp(14px,2.3vh,26px)]"
                  >
                    {navItems.map((item) => {
                      const categoryItem = isCategoryNavItem(item);

                      const active =
                        isActive(item.href) ||
                        item.children?.some((child) => isActive(child.href));

                      if (categoryItem) {
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => setActiveScreen("categories")}
                            className="menu-item group flex items-center justify-between text-right opacity-0"
                          >
                            <span className="text-[18.5px] font-extralight leading-[1.55] tracking-[-0.028em] text-[#33383C]">
                              {item.label}
                            </span>
                            <ArrowLeft
                              className="h-[18px] w-[18px] text-[#33383C] transition-transform duration-300 group-hover:-translate-x-1"
                              strokeWidth={1.5}
                            />
                          </button>
                        );
                      }

                      if (item.children?.length) {
                        const isExpanded = expandedItem === item.href;
                        return (
                          <div
                            key={item.href}
                            className="menu-item rounded-2xl bg-transparent opacity-0"
                          >
                            <div className="flex items-center justify-between gap-3 py-0">
                              <Link
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="group min-w-0 flex-1"
                              >
                                <span
                                  className={`block text-[18.5px] font-extralight leading-[1.55] tracking-[-0.028em] transition-all duration-500 text-[#33383C]`}
                                >
                                  {item.label}
                                </span>
                              </Link>

                              <button
                                type="button"
                                aria-label={
                                  expandedItem === item.href
                                    ? `بستن زیرمنوی ${item.label}`
                                    : `باز کردن زیرمنوی ${item.label}`
                                }
                                aria-expanded={expandedItem === item.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setExpandedItem(
                                    expandedItem === item.href ? null : item.href
                                  );
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#33383C] transition-all duration-300 hover:bg-black/[0.035] active:scale-95"
                              >
                                <div
                                  className={`transform transition-transform duration-300 ${isExpanded ? "rotate-45" : "rotate-0"
                                    }`}
                                >
                                  <Plus className="h-4 w-4" strokeWidth={1.35} />
                                </div>
                              </button>
                            </div>

                            <div
                              ref={(node) => setExpandedContentRef(item.href, node)}
                              className="overflow-hidden"
                              style={{ height: 0, opacity: 0 }}
                            >
                              <div className="pb-1 pr-2 pt-3">
                                <div className="flex flex-col gap-[2px]">
                                  {item.children.map((child) => {
                                    return (
                                      <Link
                                        key={child.href}
                                        href={child.href}
                                        onClick={() => setIsOpen(false)}
                                        className="group block rounded-xl py-[7px] pr-3 transition-colors duration-300 hover:bg-black/[0.025]"
                                      >
                                        <span className="flex min-w-0 items-center gap-2.5">
                                          <span
                                            className={`mt-[1px] h-[4px] w-[4px] shrink-0 rounded-full transition-all duration-500 bg-[#706C66]`}
                                          />

                                          <span
                                            className={`block truncate text-[14.75px] font-extralight leading-[1.75] tracking-[-0.016em] transition-all duration-500 text-[#706C66]`}
                                          >
                                            {child.label}
                                          </span>
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="menu-item group opacity-0"
                        >
                          <span className="block text-[18.5px] font-extralight leading-[1.55] tracking-[-0.028em] text-[#33383C]">
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* SCREEN: CATEGORIES (FADE ANIMATION) */}
                <div
                  className={`w-full transition-all duration-500 ease-out-expo pb-8 ${activeScreen === "categories"
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none absolute inset-0"
                    }`}
                >
                  <div className="flex items-center gap-3 pb-6 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveScreen("main")}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[#33383C] transition-all duration-300 hover:bg-black/[0.03] active:scale-95"
                    >
                      <ArrowRight className="h-5 w-5" strokeWidth={1.6} />
                    </button>

                    <span className="text-[17px] font-light tracking-[-0.02em] text-[#33383C]">
                      دسته‌بندی‌ها
                    </span>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    {categoriesLoading ? (
                      <div className="flex items-center gap-2 py-3 text-[#706C66]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[13px] font-extralight">
                          در حال دریافت دسته‌بندی‌ها...
                        </span>
                      </div>
                    ) : categoriesError ? (
                      <div className="py-3 text-[13px] font-extralight text-[#706C66]">
                        {categoriesError}
                      </div>
                    ) : categoryTree.length === 0 ? (
                      <div className="py-3 text-[13px] font-extralight text-[#706C66]">
                        دسته‌بندی‌ای برای نمایش وجود ندارد.
                      </div>
                    ) : (
                      categoryTree.map((category) => (
                        <CategoryAccordionItem
                          key={category.id}
                          node={category}
                          isActive={isActive}
                          onClose={() => setIsOpen(false)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        .ease-out-expo {
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>,
    document.body,
  );
}