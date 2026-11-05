"use client";

import { useCartCount } from "@/context/CartCountContext";
import {
  ChevronDown,
  ClipboardList,
  KeyRound,
  LogOut,
  Phone,
  ShoppingBag,
  User,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiMiniHeart } from "react-icons/hi2";
import DesktopSearch from "./DesktopSearch";
import MobileSearch from "./MobileSearch";

type CustomerProfile = {
  first_name?: string;
  last_name?: string;
};

type NavbarActionsProps = {
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  updateHeaderHidden?: (hidden: boolean) => void;
  only?: "cart" | "menu" | "user" | "search";
  className?: string;
  userProfile: CustomerProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<CustomerProfile | null>>;
  loadingUser: boolean;
  loadUserProfile: () => Promise<CustomerProfile | null>;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const CART_BADGE_RED = "#7a1f24";

const MOBILE_LENGTH = 11;
const MOBILE_REGEX = /^09\d{9}$/;

const normalizeMobileNumber = (value: string) => {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "")
    .slice(0, MOBILE_LENGTH);
};

function TwoLineMenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 8H28"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path
        d="M9 16H27"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

function CartBadge({
  count,
  animate,
}: {
  count: number | string;
  animate: boolean;
}) {
  const isPill = String(count).length > 1;

  return (
    <span
      className={[
        "pointer-events-none absolute left-[0px] top-[2px] z-20",
        "grid place-items-center",
        isPill ? "h-[18px] min-w-[24px] px-[6px]" : "h-[18px] w-[18px]",
        "rounded-full",
        "text-[9.5px] font-medium text-white tabular-nums",
        "tracking-[-0.01em]",
        animate ? "badge-pop" : "",
      ].join(" ")}
      style={{
        backgroundColor: CART_BADGE_RED,
        boxShadow:
          "0 1px 5px rgba(122, 31, 36, 0.20), inset 0 0 0 0.5px rgba(255,255,255,0.18)",
      }}
    >
      <span className="block translate-y-[1.4px] leading-none">{count}</span>
    </span>
  );
}

export default function NavbarActions({
  isOpen,
  setIsOpen,
  updateHeaderHidden,
  only,
  userProfile,
  setUserProfile,
  loadingUser,
  loadUserProfile,
}: NavbarActionsProps) {
  const { cartCount } = useCartCount();

  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCountRef = useRef<number | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastEntering, setToastEntering] = useState(false);

  const [logoutModalMounted, setLogoutModalMounted] = useState(false);
  const [logoutModalActive, setLogoutModalActive] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const logoutModalTimerRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimersRef = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearToastTimers = () => {
    toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    toastTimersRef.current = [];
  };

  const getFullName = (profile: CustomerProfile | null) => {
    if (!profile) return "کاربر عزیز";

    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

    return fullName || profile.first_name || profile.last_name || "کاربر عزیز";
  };

  const showWelcomeToast = (profile: CustomerProfile) => {
    clearToastTimers();

    setToastVisible(true);
    setToastEntering(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToastEntering(true);
      });
    });

    const startExitTimer = window.setTimeout(() => {
      setToastEntering(false);
    }, 3400);

    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
    }, 4200);

    toastTimersRef.current.push(startExitTimer, hideTimer);
  };

  const openLogoutModal = () => {
    if (logoutModalTimerRef.current) {
      window.clearTimeout(logoutModalTimerRef.current);
      logoutModalTimerRef.current = null;
    }

    setDropdownOpen(false);
    setLogoutModalMounted(true);
    setLogoutModalActive(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLogoutModalActive(true);
      });
    });
  };

  const closeLogoutModal = () => {
    if (logoutLoading) return;

    setLogoutModalActive(false);

    logoutModalTimerRef.current = window.setTimeout(() => {
      setLogoutModalMounted(false);
      logoutModalTimerRef.current = null;
    }, 360);
  };

  useEffect(() => {
    const triggerLogin = searchParams.get("openLogin");

    if (
      only !== "cart" &&
      only !== "menu" &&
      only !== "search" &&
      triggerLogin === "true" &&
      !userProfile &&
      !loadingUser
    ) {
      setDropdownOpen(true);

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("openLogin");

      const cleanPath =
        window.location.pathname +
        (newParams.toString() ? `?${newParams.toString()}` : "");

      router.replace(cleanPath);
    }
  }, [searchParams, userProfile, loadingUser, router, only]);

  useEffect(() => {
    return () => {
      if (logoutModalTimerRef.current) {
        window.clearTimeout(logoutModalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);

        setTimeout(() => {
          setMobile("");
          setPassword("");
          setLoginError("");
        }, 200);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const prev = prevCartCountRef.current;

    if (prev === null) {
      prevCartCountRef.current = cartCount;
      return;
    }

    if (cartCount !== prev) {
      setAnimateCart(true);

      const timer = window.setTimeout(() => {
        setAnimateCart(false);
      }, 650);

      prevCartCountRef.current = cartCount;

      return () => window.clearTimeout(timer);
    }

    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    clearToastTimers();

    return () => clearToastTimers();
  }, []);

  useEffect(() => {
    const body = document.body;

    if (logoutModalMounted) {
      const prevOverflow = body.style.overflow;
      body.style.overflow = "hidden";

      return () => {
        body.style.overflow = prevOverflow;
      };
    }
  }, [logoutModalMounted]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      const res = await fetch("/api/v1/customers/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        setUserProfile(null);
        setDropdownOpen(false);
        setLogoutModalActive(false);
        setLogoutModalMounted(false);
        setMobile("");
        setPassword("");
        setLoginError("");

        router.replace("/");
        router.refresh();
      } else {
        if (res.ok) {
          setUserProfile(null);
          setDropdownOpen(false);
          setLogoutModalActive(false);
          setLogoutModalMounted(false);
          router.replace("/");
          router.refresh();
        } else {
          console.error("خروج موفقیت‌آمیز نبود یا ساختار پاسخ نامعتبر بود.");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginError("");

    const normalizedMobile = normalizeMobileNumber(mobile);

    if (!normalizedMobile || !password) {
      setLoginError("لطفاً شماره موبایل و رمز عبور را وارد کنید.");
      return;
    }

    if (normalizedMobile.length !== MOBILE_LENGTH) {
      setLoginError("شماره موبایل باید دقیقاً ۱۱ رقم باشد.");
      return;
    }

    if (!MOBILE_REGEX.test(normalizedMobile)) {
      setLoginError("شماره موبایل معتبر نیست. شماره باید با ۰۹ شروع شود.");
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch("/api/v1/customers/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile: normalizedMobile, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setLoginError("پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید.");
        setLoginLoading(false);
        return;
      }

      const data: ApiResponse<CustomerProfile> = await res.json();

      if (res.ok && data.success) {
        const profile = await loadUserProfile();

        setDropdownOpen(false);
        setMobile("");
        setPassword("");
        setLoginError("");

        if (pathname === "/login") {
          router.replace("/account");
        } else {
          router.refresh();
        }

        if (profile) {
          showWelcomeToast(profile);
        }
      } else {
        setLoginError(data.message || "اطلاعات ورود نادرست است.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("خطای ارتباط با سرور رخ داده است.");
    } finally {
      setLoginLoading(false);
    }
  };

  const displayCount = cartCount > 99 ? "99+" : cartCount;

  const desktopIconClass =
    "group relative flex h-10 w-10 items-center justify-center rounded-full text-[#33383C] transition-all duration-300 hover:bg-[#33383C]/[0.03] hover:text-[#33383C]";

  const mobileCartClass =
    "group relative -mx-1 flex h-10 w-8 items-center justify-center overflow-visible text-[#33383C] transition-all duration-300 active:scale-95";

  const CartButton = (
    <Link
      href="/cart"
      aria-label="سبد خرید"
      className={only === "cart" ? mobileCartClass : desktopIconClass}
    >
      <ShoppingBag
        className={`h-[20px] w-[20px] text-[#33383C] ${animateCart ? "cart-shake" : ""}`}
        strokeWidth={1.5}
      />

      {cartCount > 0 && (
        <CartBadge count={displayCount} animate={animateCart} />
      )}
    </Link>
  );

  const MenuButton = (
    <button
      type="button"
      aria-label={isOpen ? "بستن منو" : "باز کردن منو"}
      aria-expanded={isOpen}
      onClick={() => {
        updateHeaderHidden?.(false);
        setIsOpen?.((prev) => !prev);
      }}
      className="relative flex h-11 w-11 appearance-none items-center justify-center text-[#33383C] transition-all duration-300 active:scale-95 focus:outline-none"
    >
      <span
        className={[
          "absolute transition-all duration-300",
          isOpen
            ? "rotate-90 scale-75 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        ].join(" ")}
      >
        <TwoLineMenuIcon className="h-6 w-6 text-[#33383C]" />
      </span>

      <span
        className={[
          "absolute transition-all duration-300",
          isOpen
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-75 opacity-0",
        ].join(" ")}
      >
        <X className="h-5 w-5 text-[#33383C]" strokeWidth={1.9} />
      </span>
    </button>
  );

  const DropdownContent = () => {
    if (userProfile) {
      const isAccountPage =
        pathname === "/account" || pathname.startsWith("/account?");

      return (
        <div className="p-1.5">
          {!isAccountPage && (
            <>
              <Link
                href="/account"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 text-right text-[11.75px] font-light tracking-[-0.01em] text-[#33383C] transition-colors hover:bg-[#33383C]/[0.025] hover:text-[#33383C]"
              >
                <User
                  className="h-3.5 w-3.5 text-[#33383C]"
                  strokeWidth={1.45}
                />
                <span className="truncate">مشاهده پروفایل</span>
              </Link>

              <Link
                href="/account?tab=orders"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 text-right text-[11.75px] font-light tracking-[-0.01em] text-[#33383C] transition-colors hover:bg-[#33383C]/[0.025] hover:text-[#33383C]"
              >
                <ClipboardList
                  className="h-3.5 w-3.5 text-[#33383C]"
                  strokeWidth={1.45}
                />
                <span className="truncate">لیست سفارش‌ها</span>
              </Link>

              <div className="my-1 border-t border-[#DAD6D0]" />
            </>
          )}

          {/* قرمز شدن متن و آیکون دکمه خروج */}
          <button
            type="button"
            onClick={openLogoutModal}
            className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 text-right text-[11.75px] font-light tracking-[-0.01em] text-[#7a1f24] transition-colors hover:bg-[#7a1f24]/[0.05]"
          >
            <LogOut className="h-3.5 w-3.5 text-[#7a1f24]" strokeWidth={1.45} />
            <span className="truncate">خروج از حساب</span>
          </button>
        </div>
      );
    }

    return (
      <div className="p-4">
        <form onSubmit={handleQuickLogin} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-light tracking-[-0.01em] text-[#33383C]">
              شماره موبایل
            </label>

            <div className="relative">
              <Phone
                className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#33383C]"
                strokeWidth={1.35}
              />

              {/* بردر ظریف‌تر با ضخامت border-[0.5px] */}
              <input
                type="tel"
                inputMode="numeric"
                maxLength={MOBILE_LENGTH}
                pattern="09[0-9]{9}"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={mobile}
                onChange={(e) => {
                  setMobile(normalizeMobileNumber(e.target.value));
                  setLoginError("");
                }}
                className="luxury-login-input direction-ltr w-full rounded-md border-[0.5px] border-[#DAD6D0] bg-white py-2 pl-3 pr-8 text-left text-[12px] font-light tracking-[-0.01em] text-[#33383C] outline-none transition-all placeholder:text-[#33383C]/50 focus:border-[#33383C] focus:bg-white focus:ring-1 focus:ring-[#33383C]/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-light tracking-[-0.01em] text-[#33383C]">
              رمز عبور
            </label>

            <div className="relative">
              <KeyRound
                className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#33383C]"
                strokeWidth={1.35}
              />

              {/* بردر ظریف‌تر با ضخامت border-[0.5px] */}
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="luxury-login-input direction-ltr w-full rounded-md border-[0.5px] border-[#DAD6D0] bg-white py-2 pl-3 pr-8 text-left text-[12px] font-light tracking-[-0.01em] text-[#33383C] outline-none transition-all placeholder:text-[#33383C]/50 focus:border-[#33383C] focus:bg-white focus:ring-1 focus:ring-[#33383C]/10"
              />
            </div>
          </div>

          {loginError && (
            <p className="text-[10.5px] font-light leading-relaxed tracking-[-0.01em] text-[#33383C]">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-md bg-[#2C2926] py-2.5 text-center text-[12px] font-light tracking-[-0.01em] text-[#F8F8F8] transition-all duration-300 hover:bg-[#2C2926]/90 active:scale-[0.99] disabled:bg-[#DAD6D0] disabled:text-[#33383C]/50 disabled:shadow-none"
          >
            {loginLoading ? "در حال ورود..." : "ورود"}
          </button>
        </form>

        <div className="my-3.5 border-t border-[#DAD6D0]" />

        {/* بردر ظریف دکمه ثبت نام با border-[0.5px] */}
        <Link
          href="/login"
          onClick={() => setDropdownOpen(false)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border-[0.5px] border-dashed border-[#DAD6D0] bg-white py-2 text-center text-[11.5px] font-light tracking-[-0.01em] text-[#33383C] transition-colors hover:border-[#33383C] hover:text-[#33383C]"
        >
          <span>حساب کاربری ندارید؟</span>
          <UserPlus className="h-3.5 w-3.5 text-[#33383C]" strokeWidth={1.4} />
        </Link>
      </div>
    );
  };

  const UserAuthButton = () => {
    if (loadingUser) {
      return <div className="h-9 w-16 animate-pulse rounded-full bg-[#F8F8F8]" />;
    }

    const fullName = `${userProfile?.first_name ?? ""} ${userProfile?.last_name ?? ""}`.trim();

    const mobileDisplayName = userProfile
      ? userProfile.first_name || userProfile.last_name || "حساب کاربری"
      : null;

    const desktopDisplayName = userProfile
      ? fullName ||
      userProfile.first_name ||
      userProfile.last_name ||
      "حساب کاربری"
      : null;

    return (
      <div className="relative inline-block text-right" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={[
            "inline-flex items-center justify-center text-[#33383C] transition-all duration-300",
            userProfile
              ? "gap-1 px-3 py-2 text-[12px] min-[1080px]:gap-1 min-[1080px]:px-3"
              : "h-10 w-10",
          ].join(" ")}
        >
          {!userProfile ? (
            <User className="h-[20px] w-[20px] text-[#33383C]" strokeWidth={1.5} />
          ) : (
            <>
              <span className="max-w-[72px] truncate text-[12.25px] font-light tracking-[-0.015em] text-[#33383C] min-[920px]:hidden">
                {mobileDisplayName}
              </span>

              <span className="hidden max-w-[120px] truncate text-[12.25px] font-light tracking-[-0.015em] text-[#33383C] min-[920px]:inline">
                {desktopDisplayName}
              </span>

              <ChevronDown
                className={`h-3.5 w-3.5 text-[#33383C] transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""
                  }`}
                strokeWidth={1.55}
              />
            </>
          )}
        </button>

        {/* بردر ظریف دراپ‌دان با border-[0.5px] */}
        <div
          className={[
            "absolute left-0 top-full mt-7 z-50 origin-top-left rounded-lg border-[0.5px] border-[#DAD6D0] bg-[#F8F8F8] shadow-[0_18px_45px_rgba(0,0,0,0.075)] ring-1 ring-black/[0.025] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            userProfile
              ? "w-max min-w-[155px] max-w-[240px]"
              : "w-[230px] max-w-[calc(100vw-24px)]",
            dropdownOpen
              ? "visible translate-y-0 scale-100 opacity-100"
              : "pointer-events-none invisible -translate-y-1.5 scale-[0.98] opacity-0",
          ].join(" ")}
        >
          {DropdownContent()}
        </div>
      </div>
    );
  };

  const toastFullName = getFullName(userProfile);

  // بردر ظریف توست با border-[0.5px]
  const ToastElement =
    mounted && toastVisible
      ? createPortal(
        <div className="pointer-events-none fixed left-0 right-0 top-[72px] z-[120] flex justify-center px-4">
          <div
            className={[
              "pointer-events-auto min-w-[260px] max-w-[92vw] rounded-2xl border-[0.5px] border-[#DAD6D0] bg-[#F8F8F8] px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.08)]",
              "transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              toastEntering
                ? "translate-y-0 opacity-100"
                : "-translate-y-14 opacity-0",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="text-[13px] font-medium tracking-[-0.01em] text-[#33383C]">
                {toastFullName}، به فرتینی خوش اومدی
              </span>
              <HiMiniHeart className="shrink-0 text-[16px] text-[#33383C]" />
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  // بردر ظریف مودال و دکمه انصراف با border-[0.5px]
  const LogoutModal =
    mounted && logoutModalMounted
      ? createPortal(
        <div
          className={[
            "fixed inset-0 z-[130]",
            logoutModalActive ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "absolute inset-0 bg-[rgba(32,30,28,0.16)] backdrop-blur-[6px]",
              "transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              "will-change-opacity transform-gpu [backface-visibility:hidden]",
              logoutModalActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={closeLogoutModal}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-4 sm:px-5 sm:pb-5">
            <div
              role="dialog"
              aria-modal="true"
              className={[
                "pointer-events-auto w-full max-w-[430px] rounded-lg border-[0.5px] border-[#DAD6D0] bg-[#F8F8F8] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.075)] ring-1 ring-black/[0.025]",
                "transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "will-change-transform transform-gpu [backface-visibility:hidden]",
                logoutModalActive
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-5 scale-[0.985] opacity-0",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="min-w-0 flex-1 text-right text-[12px] font-light leading-7 tracking-[-0.01em] text-[#33383C]">
                  مطمئنی می‌خوای از حسابت خارج بشی؟
                </p>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={closeLogoutModal}
                    disabled={logoutLoading}
                    className="rounded-md border-[0.5px] border-[#DAD6D0] bg-white px-4 py-2 text-[12px] font-light tracking-[-0.01em] text-[#33383C] transition-all duration-300 hover:border-[#33383C] hover:text-[#33383C] disabled:opacity-50"
                  >
                    انصراف
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="rounded-md bg-[#2C2926] px-4 py-2 text-[12px] font-light tracking-[-0.01em] text-[#F8F8F8] transition-all duration-300 hover:bg-[#2C2926]/90 active:scale-[0.99] disabled:bg-[#DAD6D0] disabled:text-[#33383C]/50 disabled:shadow-none"
                  >
                    {logoutLoading ? "در حال خروج..." : "خروج"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  const CartStyles = (
    <style jsx>{`
      @keyframes cartShake {
        0% {
          transform: rotate(0deg) scale(1);
        }
        20% {
          transform: rotate(-8deg) scale(1.02);
        }
        40% {
          transform: rotate(6deg) scale(1.02);
        }
        60% {
          transform: rotate(-4deg) scale(1.01);
        }
        80% {
          transform: rotate(2deg) scale(1.01);
        }
        100% {
          transform: rotate(0deg) scale(1);
        }
      }

      @keyframes badgePop {
        0% {
          transform: scale(1);
        }
        42% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      .cart-shake {
        animation: cartShake 0.46s ease-in-out;
        transform-origin: top center;
        will-change: transform;
      }

      .badge-pop {
        animation: badgePop 0.34s ease-out;
        transform-origin: center;
        will-change: transform;
      }
    `}</style>
  );

  const LoginInputStyles = (
    <style jsx global>{`
      .luxury-login-input {
        background-color: #ffffff !important;
        color: #33383C;
        caret-color: #33383C;
        box-shadow: inset 0 0 0 9999px #ffffff !important;
        -webkit-text-fill-color: #33383C !important;
        transition:
          border-color 220ms ease,
          box-shadow 220ms ease,
          background-color 9999s ease-in-out 0s;
      }

      .luxury-login-input:-webkit-autofill,
      .luxury-login-input:-webkit-autofill:hover,
      .luxury-login-input:-webkit-autofill:focus,
      .luxury-login-input:-webkit-autofill:active {
        background-color: #ffffff !important;
        background-image: none !important;
        box-shadow:
          inset 0 0 0 9999px #ffffff,
          0 0 0 0.5px #DAD6D0 !important;
        -webkit-box-shadow:
          inset 0 0 0 9999px #ffffff,
          0 0 0 0.5px #DAD6D0 !important;
        -webkit-text-fill-color: #33383C !important;
        caret-color: #33383C;
      }

      .luxury-login-input:focus {
        background-color: #ffffff !important;
        box-shadow:
          inset 0 0 0 9999px #ffffff,
          0 0 0 1px #33383C !important;
      }
    `}</style>
  );

  if (only === "search") {
    return (
      <>
        {LoginInputStyles}
        {ToastElement}
        {LogoutModal}
        <MobileSearch updateHeaderHidden={updateHeaderHidden} />
      </>
    );
  }

  if (only === "cart") {
    return (
      <>
        {CartStyles}
        {LoginInputStyles}
        {ToastElement}
        {LogoutModal}
        {CartButton}
      </>
    );
  }

  if (only === "menu") {
    return (
      <>
        {LoginInputStyles}
        {ToastElement}
        {LogoutModal}
        <div className="flex items-center gap-0.5">
          {MenuButton}
          
        </div>
      </>
    );
  }

  if (only === "user") {
    return (
      <>
        {LoginInputStyles}
        {ToastElement}
        {LogoutModal}
        {UserAuthButton()}
      </>
    );
  }

  return (
    <>
      {CartStyles}
      {LoginInputStyles}
      {ToastElement}
      {LogoutModal}

      <div className="min-[920px]:hidden">
        <div className="flex items-center gap-1.5">
          <MobileSearch updateHeaderHidden={updateHeaderHidden} />
          {UserAuthButton()}
        </div>
      </div>

      <div className="hidden w-full min-w-0 items-center gap-1 min-[920px]:flex min-[1080px]:gap-1.5">
        <DesktopSearch updateHeaderHidden={updateHeaderHidden} />

        <div className="flex shrink-0 items-center gap-1 min-[1080px]:gap-1.5">
          {UserAuthButton()}
          {CartButton}
        </div>
      </div>
    </>
  );
}
