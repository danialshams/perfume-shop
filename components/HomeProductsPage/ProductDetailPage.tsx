"use client";

import {
  Product,
  ProductVariant,
  getDefaultVariant,
  getProductDisplayPrice,
  getProductVariants,
  getVariantImages,
  getVariantLabel,
} from "@/lib/product";
import { addCartItemApi } from "@/server/services/cart-api.service";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProductDescription from "../HomeProductsComponnents/ProductDescription";
import ProductGallery from "../HomeProductsComponnents/ProductGallery";
import ProductMobileStickyBar from "../HomeProductsComponnents/ProductMobileStickyBar";
import CinematicPurchasePanel from "../home-sections/CinematicPurchasePanel";
import ProductVoiceCard from "../HomeProductsComponnents/ProductVoiceCard";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  product: Product;
};

function getCartErrorText(message: string) {
  switch (message) {
    case "PRODUCT_VARIANT_NOT_FOUND":
      return "این مدل از محصول پیدا نشد.";
    case "OUT_OF_STOCK":
      return "این محصول در حال حاضر ناموجود است.";
    case "INSUFFICIENT_STOCK":
      return "موجودی این محصول کافی نیست.";
    default:
      return "مشکلی در افزودن به سبد خرید پیش آمد.";
  }
}

function isElementVisible(element: HTMLElement | null) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

export default function ProductDetailClient({ product }: Props) {
  const router = useRouter();
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef(0);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const defaultVariant = useMemo(() => {
    if (!product) return null;
    return getDefaultVariant(product);
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    defaultVariant,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);

  const variants = useMemo(() => {
    if (!product) return [];
    return getProductVariants(product);
  }, [product]);

  const shouldShowVariants = variants.length > 1;

  function formatVariantLabel(label: string) {
    return label
      .replace("میل", "ml")
      .replace(/^ml\s*([\d۰-۹٬,]+)$/i, "$1 ml")
      .replace(/^([\d۰-۹٬,]+)\s*ml$/i, "$1 ml");
  }

  const currentPrice =
    selectedVariant?.discount_price ??
    selectedVariant?.price ??
    getProductDisplayPrice(product);

  const currentStock = Number(
    selectedVariant?.stock_qty ?? product.total_stock ?? 0,
  );

  const currentLabel = selectedVariant
    ? formatVariantLabel(getVariantLabel(selectedVariant))
    : formatVariantLabel(product.display_variant_label || "واریانت");

  const inStock = currentStock > 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;
  const stockPercentage = Math.min((currentStock / 20) * 100, 100);

  useEffect(() => {
    setSelectedVariant(defaultVariant);
    setQuantity(1);
    setCartError(null);
  }, [defaultVariant]);

  const images = useMemo(() => {
    if (!product) return [];
    return getVariantImages(product, selectedVariant) ?? [];
  }, [product, selectedVariant]);

  useEffect(() => {
    setQuantity(1);
    setCartError(null);
  }, [selectedVariant]);

  useEffect(() => {
    if (!images.length) {
      setActiveImageIndex(0);
      setImagesLoading(false);
      return;
    }

    setImagesLoading(true);
    setActiveImageIndex((prev) => {
      if (prev > images.length - 1) return 0;
      return prev;
    });

    const img = new Image();
    img.src = images[0];
    img.onload = () => setImagesLoading(false);
    img.onerror = () => setImagesLoading(false);
  }, [images]);

  useEffect(() => {
    if (!detailsOpen) return;

    const refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 750);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [detailsOpen]);

  useEffect(() => {
    if (!detailsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailsOpen(false);
      }

      if (event.key === "Tab") {
        const focusableElements = document.querySelectorAll(
          'aside button, aside a, aside [tabindex]:not([tabindex="-1"])',
        );

        const firstElement = focusableElements[0] as HTMLElement | undefined;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement | undefined;

        if (!firstElement || !lastElement) return;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailsOpen]);

  useEffect(() => {
    if (!detailsOpen) return;

    scrollPositionRef.current = window.scrollY;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    requestAnimationFrame(() => {
      const firstFocusable = document.querySelector(
        "aside button",
      ) as HTMLElement | null;

      firstFocusable?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    };
  }, [detailsOpen]);

  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple-effect");

    button.appendChild(ripple);

    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current);
    }

    rippleTimeoutRef.current = setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    if (!variant) return;
    if (selectedVariant?.id === variant.id) return;
    setSelectedVariant(variant);
  };

  const increaseQty = () => {
    const maxStock = selectedVariant?.stock_qty ?? product?.total_stock ?? 0;
    const safeMaxStock = Math.max(Number(maxStock) || 0, 1);
    setQuantity((prev) => Math.min(prev + 1, safeMaxStock));
  };

  const decreaseQty = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      const error = new Error("NO_VARIANT_SELECTED");
      setCartError("لطفاً یک مدل از محصول را انتخاب کنید.");
      throw error;
    }

    const stockQty = Number(
      selectedVariant.stock_qty ?? product.total_stock ?? 0,
    );

    if (stockQty <= 0) {
      const error = new Error("OUT_OF_STOCK");
      setCartError("این محصول در حال حاضر ناموجود است.");
      throw error;
    }

    if (quantity > stockQty) {
      const error = new Error("INSUFFICIENT_STOCK");
      setCartError("موجودی این محصول کافی نیست.");
      throw error;
    }

    try {
      setIsAddingToCart(true);
      setCartError(null);

      const cart = await addCartItemApi({
        variant_id: Number(selectedVariant.id),
        quantity: Number(quantity),
      });

      console.log("[handleAddToCart] success", {
        selectedVariantId: selectedVariant.id,
        quantity,
        cart,
      });

      window.dispatchEvent(new Event("cart:changed"));
      router.refresh();
      return cart;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ADD_TO_CART_FAILED";

      console.error("[handleAddToCart] failed", {
        selectedVariantId: selectedVariant?.id,
        quantity,
        error,
        message,
      });

      setCartError(getCartErrorText(message));
      throw error;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const goNextImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const goPrevImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useLayoutEffect(() => {
    if (!rootElement) return;

    const ctx = gsap.context(() => {
      const heroShell = rootElement.querySelector<HTMLElement>(".pd-hero-shell");
      const revealItems = gsap.utils.toArray<HTMLElement>(".pd-reveal");
      const cardRevealItems =
        gsap.utils.toArray<HTMLElement>(".pd-card-reveal");
      const mobileSectionsTrigger =
        rootElement.querySelector<HTMLElement>(".pd-sections-trigger");

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const isMobileOrTablet = !isDesktop;

      if (heroShell && isDesktop && isElementVisible(heroShell)) {
        gsap.set(heroShell, {
          opacity: 0,
          y: 10,
          willChange: "transform, opacity",
        });

        if (revealItems.length > 0) {
          gsap.set(revealItems, {
            opacity: 0,
            y: 7,
            willChange: "transform, opacity",
          });
        }

        const heroTimeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            gsap.set([heroShell, ...revealItems], {
              willChange: "auto",
            });
          },
        });

        if (revealItems.length > 0) {
          heroTimeline.to(revealItems, {
            opacity: 1,
            y: 0,
            duration: 0.36,
            stagger: 0.04,
          });
        }

        heroTimeline.to(
          heroShell,
          {
            opacity: 1,
            y: 0,
            duration: 0.44,
          },
          revealItems.length > 0 ? "-=0.16" : 0,
        );
      } else {
        if (heroShell) {
          gsap.set(heroShell, {
            opacity: 1,
            y: 0,
            willChange: "auto",
          });
        }

        if (revealItems.length > 0) {
          gsap.set(revealItems, {
            opacity: 1,
            y: 0,
            willChange: "auto",
          });
        }
      }

      if (
        isMobileOrTablet &&
        mobileSectionsTrigger &&
        isElementVisible(mobileSectionsTrigger) &&
        cardRevealItems.length > 0
      ) {
        gsap.set(cardRevealItems, {
          opacity: 0,
          y: 8,
          willChange: "transform, opacity",
        });

        gsap.to(cardRevealItems, {
          opacity: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mobileSectionsTrigger,
            start: "top 95%",
            once: true,
          },
          onComplete: function () {
            gsap.set(this.targets(), { willChange: "auto" });
          },
        });
      } else if (cardRevealItems.length > 0) {
        gsap.set(cardRevealItems, {
          opacity: 1,
          y: 0,
          willChange: "auto",
        });
      }
    }, rootElement);

    return () => ctx.revert();
  }, [rootElement]);

  if (!product) {
    return (
      <div dir="rtl" className="px-4 py-10 text-center text-sm text-slate-500">
        اطلاعات محصول یافت نشد.
      </div>
    );
  }

  return (
    <div
      ref={setRootElement}
      dir="rtl"
      className="relative overflow-x-clip bg-[#F8F8F8] px-5 pt-4 sm:px-8 lg:px-0"
    >

      <style jsx global>{`
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple-animation 600ms ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e8e8e8 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      {/* DESKTOP HERO */}
      <section className="pd-hero-shell relative z-10 hidden lg:flex lg:min-h-[calc(100dvh-100px)] lg:flex-row-reverse">
        {/* خط عمودی - با جبران فاصله بالا برای چسبیدن به نوبار */}
        <div
          className="pointer-events-none absolute right-1/2 z-20 w-px bg-[#F8F8F8]"
          style={{
            top: "-120px",
            height: "calc(100% + 120px)",
          }}
        />

        <div className="sticky top-0 h-[calc(100dvh-120px)] flex-1 overflow-hidden bg-[#F8F8F8]">
          <ProductGallery
            productName={product.name}
            images={images}
            activeImageIndex={activeImageIndex}
            onChangeImage={setActiveImageIndex}
            onOpenLightbox={() => {
              if (images.length) setLightboxOpen(true);
            }}
            lightboxOpen={lightboxOpen}
            onCloseLightbox={() => setLightboxOpen(false)}
            onNextImage={goNextImage}
            onPrevImage={goPrevImage}
            isLoading={imagesLoading}
          />
        </div>

        <div className="ql-detail-buy-pane w-1/2 flex items-center justify-center">
 <div className="w-full max-w-[560px] px-9 py-12 xl:px-14">
  <p className="ql-overline" lang="en" dir="ltr">MAISON — THE FRAGRANCE EDIT</p>
  <h1 className="ql-detail-title">{product.name}</h1>
  {product.short_description&&<p className="ql-detail-subtitle">{product.short_description}</p>}
  <CinematicPurchasePanel variants={shouldShowVariants?variants:[]} selectedVariant={selectedVariant} onSelectVariant={handleSelectVariant} quantity={quantity} onIncreaseQty={increaseQty} onDecreaseQty={decreaseQty} onAddToCart={handleAddToCart} isAddingToCart={isAddingToCart} cartError={cartError} currentPrice={Number(currentPrice||0)} currentStock={currentStock} currentLabel={currentLabel} inStock={inStock} formatVariantLabel={formatVariantLabel}/>
  <button type="button" onClick={()=>setDetailsOpen(true)} className="ql-detail-more">جزئیات و نت‌های رایحه <span>←</span></button>
 </div>
</div>
</section>
{/* OVERLAY */}
      <button
        type="button"
        aria-label="بستن جزئیات محصول"
        onClick={() => setDetailsOpen(false)}
        className={`fixed inset-0 z-[110] hidden bg-gradient-to-br from-black/25 via-black/20 to-black/15 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block ${detailsOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
          }`}
      />

      {/* DETAILS MODAL */}
      {/* تغییرات: اضافه شدن overflow-x-hidden به این لایه برای مدیریت ورود انیمیشن از اطراف بدون ایجاد اسکرول */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="جزئیات محصول"
        className={`fixed right-4 top-4 bottom-4 z-[120] hidden h-[calc(100dvh-32px)] w-[calc(48vw-16px)] overflow-y-auto overflow-x-hidden rounded-lg bg-gradient-to-b from-[#F8F8F8] to-[#f7f3ee] shadow-[0_0_60px_rgba(0,0,0,0.12),0_0_30px_rgba(0,0,0,0.08)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block ${detailsOpen
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
          }`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#d0d0d0 transparent",
        }}
      >
        <div className="space-y-16 px-14 py-16 xl:px-16">
          {/* VOICE + DESCRIPTION */}
          <section className="border-b border-[#eeeeee] pb-16">
            <h3 className="mb-10 text-[15px] font-light tracking-[0.02em] text-[#2a2a2a]">
              معرفی عطر
            </h3>

            <div className="space-y-10 px-1">
              {product.voice_file && (
                <ProductVoiceCard
                  voiceUrl={product.voice_file}
                  productName={product.name}
                  compact
                  isLoading={false}
                />
              )}

              {product.description && (
                <div
                  className="text-[13.5px] font-light leading-[2] tracking-[0.02em] text-[#6a6a6a]"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}
            </div>
          </section>
        </div>
      </aside>

      {/* MOBILE / TABLET GALLERY */}
      <div id="product-mobile-gallery" className="lg:hidden">
        <ProductGallery
          productName={product.name}
          images={images}
          activeImageIndex={activeImageIndex}
          onChangeImage={setActiveImageIndex}
          onOpenLightbox={() => {
            if (images.length) setLightboxOpen(true);
          }}
          lightboxOpen={lightboxOpen}
          onCloseLightbox={() => setLightboxOpen(false)}
          onNextImage={goNextImage}
          onPrevImage={goPrevImage}
          isLoading={imagesLoading}
        />
      </div>

      {/* MOBILE CONTENT */}
      <div className="pd-sections-trigger mt-20 space-y-14 sm:mt-24 sm:space-y-16 lg:hidden">
        <div id="product-mobile-purchase-panel" className="pd-card-reveal">
          <CinematicPurchasePanel
            variants={shouldShowVariants ? variants : []}
            productName={product.name}
            selectedVariant={selectedVariant}
            onSelectVariant={handleSelectVariant}
            quantity={quantity}
            onIncreaseQty={increaseQty}
            onDecreaseQty={decreaseQty}
            onAddToCart={handleAddToCart}
            isAddingToCart={isAddingToCart}
            cartError={cartError}
            currentPrice={Number(currentPrice || 0)}
            currentStock={currentStock}
            currentLabel={currentLabel}
            inStock={inStock}
            formatVariantLabel={formatVariantLabel}
          />
        </div>

        {product.description && (
          <div className="pd-card-reveal">
            <ProductDescription description={product.description} />
          </div>
        )}

        {product.voice_file && (
          <div className="pd-card-reveal">
            <ProductVoiceCard
              voiceUrl={product.voice_file}
              productName={product.name}
              compact={false}
              isLoading={false}
            />
          </div>
        )}

      </div>

      {/* MOBILE STICKY BAR */}
      <ProductMobileStickyBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        onIncreaseQty={increaseQty}
        onDecreaseQty={decreaseQty}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
        cartError={cartError}
      />
    </div>
  );
}
