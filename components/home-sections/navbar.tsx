"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft, ArrowUpLeft, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useAmbientSound } from "@/components/maison/MaisonAmbientSound";
import MaisonSoundBars from "@/components/maison/MaisonSoundBars";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import { useCartCount } from "@/context/CartCountContext";
import { useGuestCart } from "@/lib/fertini-guest-cart";
import { useProductSearch } from "@/components/hooks/useProductSearch";

const menuLinks = [
  { href: "/", label: "صفحه اصلی", sub: "FERTINI / HOME" },
  { href: "/products", label: "مجموعه عطرها", sub: "THE COLLECTION" },
  { href: "/journal", label: "ژورنال رایحه", sub: "THE JOURNAL" },
  { href: "/about", label: "درباره ما", sub: "OUR STORY" },
] as const;

export default function LuxuryNavbar() {
  const pathname = usePathname();
  const { cartCount } = useCartCount();
  const { count: guestCartCount } = useGuestCart();
  const displayedCartCount = cartCount + guestCartCount;
  const { enabled: soundEnabled, playing: soundPlaying, toggle: toggleSound } = useAmbientSound();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { products, loading, error, hasSearched } = useProductSearch(query, {
    enabled: searchOpen, limit: 8, debounceMs: 250,
  });

  const dismiss = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(dismiss);
    return () => window.cancelAnimationFrame(id);
  }, [pathname, dismiss]);

  const overlayOpen = menuMounted || searchOpen;
  useEffect(() => {
    if (!overlayOpen) return;
    const releaseScroll = lockDocumentScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        lastTriggerRef.current?.focus();
      }
      if (event.key === "Tab") {
        const panel = document.querySelector<HTMLElement>(".maison-active-overlay");
        if (!panel) return;
        const focusable = [...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])')].filter(el => el.offsetParent !== null);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { releaseScroll(); document.removeEventListener("keydown", onKeyDown); };
  }, [overlayOpen, dismiss]);

  useEffect(() => {
    if (searchOpen) {
      const id = window.requestAnimationFrame(() => searchRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen || !menuPanelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(".maison-menu-entry", { y: 27, opacity: 0 },
        { y: 0, opacity: 1, duration: .73, stagger: .075, ease: "power3.out", clearProps: "transform,opacity" });
    }, menuPanelRef);
    return () => context.revert();
  }, [menuOpen]);

  function openMenu(event: React.MouseEvent<HTMLButtonElement>) {
    lastTriggerRef.current = event.currentTarget;
    setSearchOpen(false);
    setQuery("");
    setMenuMounted(true);
    setMenuOpen(true);
  }
  useEffect(() => {
    if (!menuMounted || menuOpen) return;
    const timeout=window.setTimeout(()=>setMenuMounted(false),580);
    return ()=>window.clearTimeout(timeout);
  },[menuMounted,menuOpen]);
  function openSearch(event: React.MouseEvent<HTMLButtonElement>) {
    lastTriggerRef.current = event.currentTarget;
    setMenuOpen(false);
    setMenuMounted(false);
    setSearchOpen(true);
  }

  return (
    <>
      <header className={"maison-header " + (scrolled ? "maison-header--scrolled" : "")} dir="rtl">
        <div className="maison-header__inner">
          <div className="maison-header__right">
            <button type="button" className="maison-icon-button maison-menu-trigger" onClick={openMenu} aria-label="باز کردن منو" aria-expanded={menuOpen} aria-controls="maison-menu">
              <Menu size={21} strokeWidth={1.3} />
            </button>
            {soundEnabled && <button type="button" className={"maison-icon-button fertini-header-sound fertini-header-sound--mobile"+(soundPlaying?" is-playing":"")} onClick={toggleSound}
              aria-label={soundPlaying ? "قطع موسیقی" : "پخش موسیقی محیط"} aria-pressed={soundPlaying}>
              <MaisonSoundBars />
            </button>}
            <nav className="maison-header__navigation" aria-label="ناوبری اصلی">
              <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>خانه</Link>
              <Link href="/products" aria-current={pathname === "/products" ? "page" : undefined}>عطرها</Link>
              <Link href="/journal" aria-current={pathname?.startsWith("/journal") ? "page" : undefined}>ژورنال</Link>
            </nav>
          </div>
          <Link href="/" className="maison-header__brand" aria-label="FERTINI — صفحه اصلی" dir="ltr">
            <strong>FERTINI</strong><span>THE FRAGRANCE HOUSE</span>
          </Link>
          <div className="maison-header__left">
            {soundEnabled && <button type="button" className={"maison-icon-button fertini-header-sound fertini-header-sound--desktop"+(soundPlaying?" is-playing":"")} onClick={toggleSound}
              aria-label={soundPlaying ? "قطع موسیقی" : "پخش موسیقی محیط"} aria-pressed={soundPlaying}
              title={soundPlaying ? "Sound on" : "Sound off"}>
              <MaisonSoundBars />
            </button>}
            <button type="button" className="maison-icon-button" aria-label="جستجوی عطرها" aria-expanded={searchOpen} onClick={openSearch}><Search size={20} strokeWidth={1.3} /></button>
            <Link href="/account" className="maison-icon-button maison-header__account" aria-label="حساب کاربری"><UserRound size={20} strokeWidth={1.3} /></Link>
            <Link href="/cart" className="maison-icon-button maison-header__cart" aria-label={"سبد خرید، " + displayedCartCount + " محصول"}>
              <ShoppingBag size={20} strokeWidth={1.3} />
              {displayedCartCount > 0 && <span className="maison-header__count" aria-hidden="true">{displayedCartCount > 99 ? "+99" : displayedCartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {menuMounted && (
        <div id="maison-menu" className={"maison-overlay maison-active-overlay maison-overlay--menu"+(menuOpen?" is-open":" is-closing") } role="dialog" aria-modal="true" aria-label="منوی فروشگاه">
          <button type="button" className="maison-overlay__backdrop" tabIndex={-1} aria-label="بستن منو" onClick={dismiss}/>
          <div className="maison-menu" ref={menuPanelRef}>
            <div className="maison-menu__head">
              <span className="maison-overline" lang="en" dir="ltr">FERTINI / INDEX</span>
              <button type="button" className="maison-icon-button" onClick={dismiss} aria-label="بستن منو"><X size={23} strokeWidth={1.2}/></button>
            </div>
            <nav aria-label="فهرست کامل سایت" className="maison-menu__links">
              {menuLinks.map((item, index) => (
                <Link key={item.href} href={item.href} onClick={dismiss} className="maison-menu-entry">
                  <span className="maison-menu__number" lang="en">{String(index+1).padStart(2,"0")}</span>
                  <span className="maison-menu__text">{item.label}<small lang="en" dir="ltr">{item.sub}</small></span>
                </Link>
              ))}
            </nav>
            <p className="maison-menu__foot" lang="en" dir="ltr">A QUIET STUDY OF SCENT — FERTINI 2026</p>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="maison-overlay maison-active-overlay" role="dialog" aria-modal="true" aria-label="جستجوی عطرها">
          <button type="button" className="maison-overlay__backdrop" onClick={dismiss} aria-label="بستن جستجو" tabIndex={-1} />
          <section className="maison-search" dir="rtl">
            <div className="maison-search__head">
              <span className="maison-overline" lang="en" dir="ltr">THE FRAGRANCE INDEX</span>
              <button type="button" className="maison-icon-button" onClick={dismiss} aria-label="بستن جستجو"><X size={23} strokeWidth={1.3}/></button>
            </div>
            <div className="maison-search__field">
              <Search size={21} strokeWidth={1.3} aria-hidden="true"/>
              <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)}
                placeholder="چه رایحه‌ای در ذهن دارید؟" type="search" inputMode="search" autoComplete="off"
                aria-label="جستجو در مجموعه عطرها" aria-controls="maison-search-results" />
              {query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="پاک کردن جستجو"><X size={17}/></button>}
            </div>
            <div id="maison-search-results" className="maison-search__results" aria-live="polite">
              {!query.trim() && <p>نام عطر یا برند موردنظرتان را بنویسید.</p>}
              {loading && query.trim() && <p>در حال جستجو در مجموعه…</p>}
              {!loading && error && <p role="alert">جستجو در دسترس نیست. دوباره تلاش کنید.</p>}
              {!loading && !error && hasSearched && products.length === 0 && <p>رایحه‌ای با این نام پیدا نشد.</p>}
              {!loading && !error && products.map((product, index) => (
                <Link key={product.id} href={"/products/" + product.id} onClick={dismiss} className="maison-search__result">
                  <span lang="en" dir="ltr" className="maison-search__result-index">{String(index+1).padStart(2,"0")}</span>
                  <span className="maison-search__result-name">{product.name}<small>{product.volumesMl?.length ? product.volumesMl.join(" / ") + " ml" : "FERTINI COLLECTION"}</small></span>
                  <ArrowLeft size={17} strokeWidth={1.2}/>
                </Link>
              ))}
            </div>
            <Link href="/products" onClick={dismiss} className="maison-search__all">مشاهده تمام عطرها <ArrowUpLeft size={17} strokeWidth={1.2}/></Link>
          </section>
        </div>
      )}
    </>
  );
}
