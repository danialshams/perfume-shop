"use client";

import localFont from "next/font/local";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useNavbarAnimations } from "../hooks/useNavbarAnimations";
import { useNavbarKeyboard } from "../hooks/useNavbarKeyboard";
import { useNavbarOutsideClick } from "../hooks/useNavbarOutsideClick";
import { useNavbarScroll } from "../hooks/useNavbarScroll";
import BrandLogo from "../NavbarComponents/BrandLogo";
import DesktopNavLinks from "../NavbarComponents/DesktopNavLinks";
import MobileMenuOverlay from "../NavbarComponents/MobileMenuOverlay";
import { navItems } from "../NavbarComponents/navbar.data";
import NavbarActions from "../NavbarComponents/NavbarActions";
import MusicVisualizer from "../NavbarComponents/MusicVisualizer";

type CustomerProfile = {
  first_name?: string;
  last_name?: string;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const vazir = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Vazirmatn-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
});

export default function LuxuryNavbar() {
  const pathname = usePathname();

  const desktopRootRef = useRef<HTMLElement | null>(null);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  const mobileRootRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /**
   * Ø§ÛŒÙ† refÙ‡Ø§ Ø¨Ø±Ø§ÛŒ hookÙ‡Ø§ÛŒ Ù‚Ø¨Ù„ÛŒ Ù†Ú¯Ù‡ Ø¯Ø§Ø´ØªÙ‡ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯ ØªØ§ Ø³Ø§Ø®ØªØ§Ø± ÙØ¹Ù„ÛŒ navbar
   * Ø¨Ø¯ÙˆÙ† Ù†ÛŒØ§Ø² Ø¨Ù‡ Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ hookÙ‡Ø§ Ù¾Ø§ÛŒØ¯Ø§Ø± Ø¨Ù…Ø§Ù†Ø¯.
   * Ø³Ø±Ú† Ø¬Ø¯ÛŒØ¯ ØªÙˆØ³Ø· MobileSearch / DesktopSearch Ùˆ SearchOverlay Ú©Ù†ØªØ±Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯.
   */
  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInnerRef = useRef<HTMLDivElement | null>(null);

  const topLineRef = useRef<HTMLDivElement | null>(null);

  const mobileSearchVisibleRef = useRef(false);
  const headerHiddenRef = useRef(false);

  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const [userProfile, setUserProfile] = useState<CustomerProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isGlass = isScrolled && !isOpen;

  const loadUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/customers/auth/me", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setUserProfile(null);
        return null;
      }

      const resData: ApiResponse<CustomerProfile> = await res.json();

      if (resData.success && resData.data) {
        setUserProfile(resData.data);
        return resData.data;
      }

      setUserProfile(null);
      return null;
    } catch (err) {
      console.error(err);
      setUserProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadUserProfile().finally(() => setLoadingUser(false));
  }, [loadUserProfile]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const updateMobileSearchVisible = useCallback((visible: boolean) => {
    if (mobileSearchVisibleRef.current === visible) return;

    mobileSearchVisibleRef.current = visible;
    setMobileSearchVisible(visible);
  }, []);

  const updateHeaderHidden = useCallback((hidden: boolean) => {
    if (headerHiddenRef.current === hidden) return;

    headerHiddenRef.current = hidden;
    setIsHeaderHidden(hidden);
  }, []);

  useEffect(() => {
    mobileSearchVisibleRef.current = mobileSearchVisible;
  }, [mobileSearchVisible]);

  useEffect(() => {
    headerHiddenRef.current = isHeaderHidden;
  }, [isHeaderHidden]);

  useEffect(() => {
    setIsOpen(false);
    updateHeaderHidden(false);
    updateMobileSearchVisible(false);
  }, [pathname, updateHeaderHidden, updateMobileSearchVisible]);

  useNavbarScroll({
    isOpen,
    desktopSearchRef,
    mobileSearchRef,
    mobileSearchVisibleRef,
    setIsScrolled,
    updateHeaderHidden,
  });

  useNavbarKeyboard({
    desktopSearchRef,
    mobileSearchRef,
    updateHeaderHidden,
    updateMobileSearchVisible,
    setIsOpen,
  });

  useNavbarOutsideClick({
    isOpen,
    setIsOpen,
    menuRef,
    mobileSearchRef,
    mobileSearchWrapperRef,
    mobileSearchVisibleRef,
    updateMobileSearchVisible,
  });

  useNavbarAnimations({
    desktopRootRef,
    desktopNavRef,
    mobileRootRef,
    mobileNavRef,
    panelRef,
    menuRef,
    mobileSearchWrapperRef,
    mobileSearchInnerRef,
    topLineRef,
    isOpen,
    isHeaderHidden,
    mobileSearchVisible,
  });

  useBodyScrollLock(isOpen);

  const navbarActionsAuthProps = {
    userProfile,
    setUserProfile,
    loadingUser,
    loadUserProfile,
  };

    return (
    <>
      <div
        ref={topLineRef}
        aria-hidden="true"
        className="hidden min-[920px]:block"
      />

      {/* Mobile / Tablet Header */}
      <header
        ref={mobileRootRef}
        dir="rtl"
        className={[
          vazir.className,
          "fixed left-0 right-0 top-0 z-50 min-[920px]:hidden",
          "text-[#33383C]", // اعمال رنگ دودی تیره به عنوان رنگ متن پیش‌فرض موبایل
          "transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isGlass
            ? "bg-white/20 backdrop-blur-2xl backdrop-saturate-[1.8] supports-[backdrop-filter]:bg-white/[0.14]"
            : "bg-[#F8F8F8] shadow-none backdrop-blur-0",
        ].join(" ")}
      >
        <div className="relative">
          <div
            ref={mobileNavRef}
            className="relative z-[2] flex h-[88px] items-center justify-between bg-transparent px-5 text-[#33383C]" // تضمین اعمال رنگ به آیکون‌ها و دکمه‌های ناوبری موبایل
          >
            <div className="flex items-center text-[#33383C]">
              <NavbarActions
                only="menu"
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                updateHeaderHidden={updateHeaderHidden}
                className="text-[#33383C]"
                {...navbarActionsAuthProps}
              />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 text-[#33383C]">
              <BrandLogo />
            </div>

            <div className="flex items-center gap-1.5 text-[#33383C]">
              <NavbarActions
                only="search"
                updateHeaderHidden={updateHeaderHidden}
                className="text-[#33383C]"
                {...navbarActionsAuthProps}
              />

              <NavbarActions 
                only="user" 
                className="text-[#33383C]"
                {...navbarActionsAuthProps} 
              />

              <NavbarActions 
                only="cart" 
                className="text-[#33383C]"
                {...navbarActionsAuthProps} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header
        ref={desktopRootRef}
        dir="rtl"
        className={[
          vazir.className,
          "sticky top-0 z-40 hidden w-full min-[920px]:block",
          "text-[#33383C]", // اعمال رنگ دودی تیره به عنوان رنگ متن پیش‌فرض دسکتاپ
          "transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isGlass
            ? "bg-white/20 backdrop-blur-2xl backdrop-saturate-[1.8] supports-[backdrop-filter]:bg-white/[0.14]"
            : "border-b border-[#DAD6D0]/30 bg-[#F8F8F8] shadow-none backdrop-blur-0", // تغییر رنگ border هدر دسکتاپ به رنگ بوردر ملایم پالت دوم
        ].join(" ")}
      >
        <div className="relative">
          <div ref={desktopNavRef} className="relative z-[2] w-full text-[#33383C]">
            <nav className="mx-auto w-full max-w-[1440px] px-5 min-[1100px]:px-8 min-[1280px]:px-10">
              <div
                className={[
                  "grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-300",
                  isScrolled ? "h-[74px]" : "h-[86px]",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center justify-start text-[#33383C]">
                  <DesktopNavLinks
                    navItems={navItems}
                    hoveredHref={hoveredHref}
                    setHoveredHref={setHoveredHref}
                    isActive={isActive}
                  />
                </div>

                <div className="flex items-center justify-center px-4 text-[#33383C]">
                  <BrandLogo />
                </div>

                <div className="flex min-w-0 items-center justify-end gap-5 text-[#33383C]">
                  <div className="min-w-0 flex-1 text-[#33383C]">
                    <NavbarActions
                      updateHeaderHidden={updateHeaderHidden}
                      className="text-[#33383C]"
                      {...navbarActionsAuthProps}
                    />
                  </div>

                  {/* فضای ثابت دکمه ویژوالایزر */}
                  <div className="flex w-14 shrink-0 items-center justify-center text-[#33383C]">
                    <MusicVisualizer />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="h-[72px] min-[920px]:hidden" />

      <MobileMenuOverlay
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        menuRef={menuRef}
        panelRef={panelRef}
        navItems={navItems}
        isActive={isActive}
        vazirClassName={`${vazir.className} text-[#33383C]`} // اعمال رنگ به متن‌های درون منوی موبایل
      />
    </>
  );

}
