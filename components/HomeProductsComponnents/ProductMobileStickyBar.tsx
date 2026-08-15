"use client";

import { Product, ProductVariant, formatPrice } from "@/lib/product";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  product: Product;
  selectedVariant: ProductVariant | null;
  quantity: number;
  onIncreaseQty: () => void;
  onDecreaseQty: () => void;
  onAddToCart: () => void | Promise<void>;
  isAddingToCart?: boolean;
  cartError?: string | null;
};

type Particle = {
  x: number;
  y: number;
  tx: string;
  ty: string;
};

const MOBILE_PURCHASE_PANEL_ID = "product-mobile-purchase-panel";
const MOBILE_GALLERY_ID = "product-mobile-gallery";
const SITE_FOOTER_ID = "site-footer";

const getProductUnitPrice = (
  product: Product,
  selectedVariant: ProductVariant | null,
) =>
  selectedVariant?.discount_price ??
  selectedVariant?.price ??
  product.display_price ??
  product.price ??
  0;

const getFormattedTotal = (
  product: Product,
  selectedVariant: ProductVariant | null,
  quantity: number,
) => {
  const unitPrice = getProductUnitPrice(product, selectedVariant);
  const normalizedQuantity = Number(quantity || 1);
  const total = Number(unitPrice) * normalizedQuantity;

  return {
    total,
    formatted: formatPrice(total)
      .replace(/\s*(تومان|تومن)$/i, "")
      .trim(),
  };
};

export default function ProductMobileStickyBar({
  product,
  selectedVariant,
  quantity,
  onIncreaseQty,
  onDecreaseQty,
  onAddToCart,
  isAddingToCart = false,
  cartError = null,
}: Props) {
  const initialTotalRef = useRef(
    getFormattedTotal(product, selectedVariant, quantity),
  );

  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  const [isIncreasing, setIsIncreasing] = useState(true);

  const [displayTotal, setDisplayTotal] = useState(
    initialTotalRef.current.formatted,
  );
  const [prevTotal, setPrevTotal] = useState(
    initialTotalRef.current.formatted,
  );
  const [isPriceIncreasing, setIsPriceIncreasing] = useState(true);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const [buttonScale, setButtonScale] = useState({
    decrement: 1,
    increment: 1,
  });
  const [quantityChanged, setQuantityChanged] = useState(false);
  const [waveEffect, setWaveEffect] = useState(false);
  const [liquidEffect, setLiquidEffect] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lightingRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);

  const prevTotalRef = useRef(initialTotalRef.current.formatted);
  const prevNumericTotalRef = useRef(initialTotalRef.current.total);

  const stock = Number(
    selectedVariant?.stock_qty ?? product.total_stock ?? 0,
  );
  const inStock = stock > 0;

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    let intervalId: number | null = null;

    const getElement = (id: string) =>
      document.getElementById(id) as HTMLElement | null;

    const isElementVisibleInViewport = (
      element: HTMLElement | null,
    ) => {
      if (!element) return false;

      const rect = element.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        return false;
      }

      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const isGalleryBlockingSticky = (
      element: HTMLElement | null,
    ) => {
      if (!element) return false;

      const rect = element.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        return false;
      }

      return (
        rect.top < window.innerHeight * 0.65 &&
        rect.bottom > window.innerHeight * 0.45
      );
    };

    const updateVisibility = () => {
      if (window.innerWidth >= 1024) {
        setShouldShow(false);
        return;
      }

      const gallery = getElement(MOBILE_GALLERY_ID);
      const purchasePanel = getElement(MOBILE_PURCHASE_PANEL_ID);
      const footer = getElement(SITE_FOOTER_ID);

      const isGalleryVisible = isGalleryBlockingSticky(gallery);
      const isPurchasePanelVisible =
        isElementVisibleInViewport(purchasePanel);
      const isFooterVisible = isElementVisibleInViewport(footer);

      setShouldShow(
        !isGalleryVisible &&
        !isPurchasePanelVisible &&
        !isFooterVisible,
      );
    };

    const scheduleUpdate = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate);

    intervalId = window.setInterval(() => {
      updateVisibility();

      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }, 250);

    scheduleUpdate();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    if (quantity !== displayQuantity) {
      setIsIncreasing(quantity > displayQuantity);
      setPrevQuantity(displayQuantity);
      setDisplayQuantity(quantity);
    }
  }, [quantity, displayQuantity]);

  useEffect(() => {
    const { total, formatted } = getFormattedTotal(
      product,
      selectedVariant,
      quantity,
    );

    if (formatted !== prevTotalRef.current) {
      setIsPriceIncreasing(total > prevNumericTotalRef.current);
      setPrevTotal(prevTotalRef.current);
      setDisplayTotal(formatted);
      setPriceAnimationKey((previousKey) => previousKey + 1);

      prevTotalRef.current = formatted;
      prevNumericTotalRef.current = total;
    }
  }, [product, selectedVariant, quantity]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 2;
    const rotateY = ((centerX - x) / centerX) * 2;

    setParallax({
      x: rotateY,
      y: rotateX,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);

    if (lightingRef.current) {
      lightingRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setParallax({ x: 0, y: 0 });

    if (lightingRef.current) {
      lightingRef.current.style.opacity = "0";
    }
  };

  const handleIncrement = () => {
    if (!inStock || quantity >= stock || isAddingToCart) {
      return;
    }

    setButtonScale((previousScale) => ({
      ...previousScale,
      increment: 0.85,
    }));

    window.setTimeout(() => {
      setButtonScale((previousScale) => ({
        ...previousScale,
        increment: 1,
      }));
    }, 150);

    setQuantityChanged(true);
    window.setTimeout(() => setQuantityChanged(false), 1000);

    setLiquidEffect(true);
    window.setTimeout(() => setLiquidEffect(false), 400);

    onIncreaseQty();
  };

  const handleDecrement = () => {
    if (quantity <= 1 || isAddingToCart) {
      return;
    }

    setButtonScale((previousScale) => ({
      ...previousScale,
      decrement: 0.85,
    }));

    window.setTimeout(() => {
      setButtonScale((previousScale) => ({
        ...previousScale,
        decrement: 1,
      }));
    }, 150);

    setQuantityChanged(true);
    window.setTimeout(() => setQuantityChanged(false), 1000);

    setLiquidEffect(true);
    window.setTimeout(() => setLiquidEffect(false), 400);

    onDecreaseQty();
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock || isAddingToCart) {
      return;
    }

    if (rippleContainerRef.current && addButtonRef.current) {
      const button = addButtonRef.current;
      const container = rippleContainerRef.current;
      const rect = button.getBoundingClientRect();

      const size = Math.max(rect.width, rect.height);
      const x = rect.width / 2 - size / 2;
      const y = rect.height / 2 - size / 2;

      const ripple = document.createElement("div");

      ripple.className = "ripple-effect";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      container.appendChild(ripple);

      window.setTimeout(() => {
        ripple.remove();
      }, 600);
    }

    setWaveEffect(true);

    window.setTimeout(() => {
      setWaveEffect(false);
    }, 2000);

    try {
      await onAddToCart();
    } catch {
      return;
    }

    setShowSuccess(true);

    const generatedParticles: Particle[] = [];

    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;

      generatedParticles.push({
        x: 50,
        y: 50,
        tx: `${Math.cos(angle) * distance}`,
        ty: `${Math.sin(angle) * distance}`,
      });
    }

    setParticles(generatedParticles);

    window.setTimeout(() => {
      setShowSuccess(false);
      setParticles([]);
    }, 2000);
  };

  const isVisible = mounted && shouldShow;

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-4 z-[70] px-4",
        "transition-all duration-500 ease-out lg:hidden",
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      ].join(" ")}
      aria-hidden={!isVisible}
    >
      <div
        ref={containerRef}
        className={[
          "relative mx-auto w-full max-w-[400px] overflow-hidden",
          "rounded-[4px] ",
          "bg-[rgba(28,28,31,0.88)]  backdrop-blur-[12px] bg-clip-padding",
          "transition-all duration-500 sm:max-w-[430px]",
          liquidEffect ? "liquid-pulse" : "",
          showSuccess ? "success-state" : "",
        ].join(" ")}

        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${parallax.y}deg) rotateY(${parallax.x}deg) scale(1.01)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
          transition: "transform 0.5s ease-out",
        }}
      >
        <div className="h-px w-full bg-gradient-to-l from-transparent via-white/[0.08] to-transparent" />

        <div
          ref={lightingRef}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.06), transparent 40%)`,
          }}
        />

        <div className="refraction-effect pointer-events-none absolute inset-0 opacity-30" />

        <div className="relative px-4 py-2.5">
          {cartError && (
            <div className="mb-3 rounded-[3px] border border-[#7a1f1f]/40 bg-[#2a0f0f]/40 px-3 py-2 text-right text-[11px] tracking-[0.08em] text-[#e8c4c4]">
              {cartError}
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
            <div className="min-w-0 overflow-hidden text-right">
              <div
                className="flex min-w-0 max-w-full items-baseline justify-end gap-1 overflow-hidden whitespace-nowrap text-white"
                dir="ltr"
              >
                <span className="relative inline-flex min-w-0 max-w-full overflow-hidden text-[clamp(12px,4vw,18px)] font-light leading-none tabular-nums tracking-[0.01em]">
                  {displayTotal.split("").map((character, index) => {

                    const rightIndex =
                      displayTotal.length - 1 - index;
                    const previousIndex =
                      prevTotal.length - 1 - rightIndex;
                    const previousCharacter =
                      previousIndex >= 0
                        ? prevTotal[previousIndex]
                        : "";
                    const hasChanged =
                      previousCharacter !== character;
                    const delay = `${rightIndex * 35}ms`;

                    return (
                      <span
                        key={`${priceAnimationKey}-digit-${rightIndex}`}
                        className="relative inline-block overflow-hidden"
                        style={{
                          width: character === "," ? "0.22em" : "0.52em",
                          height: "1.2em",
                          flexShrink: 0,
                        }}

                      >
                        {hasChanged && previousCharacter ? (
                          <>
                            <span
                              key={`${priceAnimationKey}-previous-${rightIndex}`}
                              className={[
                                "absolute inset-0 flex items-center justify-center",
                                isPriceIncreasing
                                  ? "animate-price-digit-out-up"
                                  : "animate-price-digit-out-down",
                              ].join(" ")}
                              style={{
                                animationDelay: delay,
                                zIndex: 1,
                              }}
                            >
                              {previousCharacter}
                            </span>

                            <span
                              key={`${priceAnimationKey}-current-${rightIndex}`}
                              className={[
                                "absolute inset-0 flex items-center justify-center",
                                isPriceIncreasing
                                  ? "animate-price-digit-in-up"
                                  : "animate-price-digit-in-down",
                              ].join(" ")}
                              style={{
                                animationDelay: delay,
                                zIndex: 2,
                              }}
                            >
                              {character}
                            </span>
                          </>
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center">
                            {character}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </span>

                <span className="relative -top-px text-[10px] font-light tracking-[0.15em] text-white/40">
                  T
                </span>
              </div>
            </div>

            <div
              className="flex shrink-0 items-center"
              dir="ltr"
            >
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isAddingToCart}
                className="flex h-8 w-8 items-center justify-center rounded-l-[2px] text-[16px] font-light text-white transition-all duration-300 hover:bg-white/[0.04] hover:opacity-70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
                aria-label="کاهش تعداد"
                style={{
                  transform:
                    buttonScale.decrement !== 1
                      ? `scale(${buttonScale.decrement})`
                      : "scale(1)",
                }}
              >
                −
              </button>

              <span
                className={[
                  "relative flex h-8 w-9 items-center justify-center",
                  "overflow-hidden text-[12px] font-light tabular-nums",
                  "tracking-[0.12em] text-white",
                  quantityChanged ? "glow-pulse" : "",
                ].join(" ")}
              >
                <span
                  key={`previous-${prevQuantity}`}
                  className={
                    isIncreasing
                      ? "animate-quantity-slide-down"
                      : "animate-quantity-slide-up"
                  }
                >
                  {prevQuantity}
                </span>

                <span
                  key={`current-${displayQuantity}`}
                  className={
                    isIncreasing
                      ? "animate-quantity-slide-in-down"
                      : "animate-quantity-slide-in-up"
                  }
                >
                  {displayQuantity}
                </span>
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={
                  !inStock ||
                  quantity >= stock ||
                  isAddingToCart
                }
                className="flex h-8 w-8 items-center justify-center rounded-r-[2px] text-[16px] font-light text-white transition-all duration-300 hover:bg-white/[0.04] hover:opacity-70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
                aria-label="افزایش تعداد"
                style={{
                  transform:
                    buttonScale.increment !== 1
                      ? `scale(${buttonScale.increment})`
                      : "scale(1)",
                }}
              >
                +
              </button>
            </div>

            <button
              ref={addButtonRef}
              type="button"
              onClick={handleAddToCart}
              disabled={
                !selectedVariant || !inStock || isAddingToCart
              }
              className={[
                "relative min-w-[92px] shrink-0 overflow-hidden sm:min-w-[110px]",
                "rounded-[4px] px-3 py-2 sm:px-4",
                "text-[10px] font-medium tracking-[0.14em] sm:text-[10.5px] sm:tracking-[0.18em]",

                "transition-all duration-700",
                "ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.98]",
                "disabled:cursor-not-allowed",
                waveEffect ? "wave-effect" : "",
              ].join(" ")}
              style={{
                background: showSuccess
                  ? "rgba(255, 255, 255, 0.06)"
                  : "transparent",
                borderColor: "rgba(255, 255, 255, 0.08)",
                color: !inStock
                  ? "rgba(255, 255, 255, 0.2)"
                  : "#ffffff",
                boxShadow: "none",
              }}
            >
              {showSuccess &&
                particles.map((particle, index) => (
                  <div
                    key={`${particle.tx}-${particle.ty}-${index}`}
                    className="particle"
                    style={
                      {
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        "--tx": `${particle.tx}px`,
                        "--ty": `${particle.ty}px`,
                      } as CSSProperties
                    }
                  />
                ))}

              <span
                className={[
                  "btn-content relative z-10 flex items-center justify-center",
                  showSuccess ? "success-active" : "",
                ].join(" ")}
              >
                <span className="add-label flex items-center justify-center">
                  {isAddingToCart ? "افزودن..." : "افزودن به سبد"}
                </span>

                <span className="success-label absolute inset-0 flex items-center justify-center gap-2">
                  <span className="success-text inline-flex items-center">
                    افزوده شد
                  </span>

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    className="checkmark-svg inline-block"
                    aria-hidden="true"
                  >
                    <path
                      className="checkmark-path"
                      d="M4 10 L8 14 L16 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>

              <div
                ref={rippleContainerRef}
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4px]"
              />
            </button>
          </div>

          {!inStock && (
            <div className="mt-3 text-right text-[10px] font-light tracking-[0.16em] text-white/40">
              ناموجود
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes quantitySlideDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes quantitySlideInDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes quantitySlideUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        @keyframes quantitySlideInUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes priceDigitOutUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }

        @keyframes priceDigitInUp {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes priceDigitOutDown {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-120%);
            opacity: 0;
          }
        }

        @keyframes priceDigitInDown {
          0% {
            transform: translateY(120%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
          }
          50% {
            text-shadow: 0 0 16px rgba(255, 255, 255, 0.35);
          }
        }

        @keyframes wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes liquidPulse {
          0%,
          100% {
            transform: scale(1);
            filter: blur(0);
          }
          50% {
            transform: scale(1.02);
            filter: blur(0.3px);
          }
        }

        @keyframes refraction {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes successGlow {
          0% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.16);
          }
          100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
          }
        }

        @keyframes checkmarkBounce {
          0% {
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-quantity-slide-down {
          position: absolute;
          animation: quantitySlideDown 0.4s ease-in-out forwards;
        }

        .animate-quantity-slide-in-down {
          position: absolute;
          animation: quantitySlideInDown 0.4s ease-in-out forwards;
        }

        .animate-quantity-slide-up {
          position: absolute;
          animation: quantitySlideUp 0.4s ease-in-out forwards;
        }

        .animate-quantity-slide-in-up {
          position: absolute;
          animation: quantitySlideInUp 0.4s ease-in-out forwards;
        }

        .animate-price-digit-out-up {
          animation: priceDigitOutUp 0.5s
            cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .animate-price-digit-in-up {
          animation: priceDigitInUp 0.5s
            cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .animate-price-digit-out-down {
          animation: priceDigitOutDown 0.5s
            cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .animate-price-digit-in-down {
          animation: priceDigitInDown 0.5s
            cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          pointer-events: none;
          animation: ripple 0.6s
            cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .add-label {
          display: inline-flex;
          transform: translateY(0);
          opacity: 1;
          filter: blur(0);
          transition:
            transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
            opacity 0.4s ease,
            filter 0.4s ease;
        }

        .success-active .add-label {
          transform: translateY(-10px);
          opacity: 0;
          filter: blur(4px);
          transition:
            transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
            opacity 0.3s ease,
            filter 0.3s ease;
        }

        .success-label {
          opacity: 0;
          transform: translateY(10px);
          filter: blur(4px);
          pointer-events: none;
          transition:
            transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
            opacity 0.4s ease,
            filter 0.4s ease;
        }

        .success-active .success-label {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
          transition-delay: 0.1s;
        }

        .checkmark-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          transition: stroke-dashoffset 0.6s
            cubic-bezier(0.45, 0, 0.55, 1);
        }

        .success-active .checkmark-path {
          stroke-dashoffset: 0;
          transition-delay: 0.3s;
        }

        .success-active .checkmark-svg {
          animation: checkmarkBounce 0.8s
            cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.2s;
        }

        .wave-effect::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: wave 1s ease-in-out forwards;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          animation: particleBurst 0.7s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .glow-pulse {
          animation: glowPulse 1s ease-in-out;
        }

        .liquid-pulse {
          animation: liquidPulse 0.4s ease-in-out;
        }

        .success-state {
          animation: successGlow 1.5s ease-in-out;
        }

        .refraction-effect {
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          background-size: 200% 200%;
          animation: refraction 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-quantity-slide-down,
          .animate-quantity-slide-in-down,
          .animate-quantity-slide-up,
          .animate-quantity-slide-in-up,
          .animate-price-digit-out-up,
          .animate-price-digit-in-up,
          .animate-price-digit-out-down,
          .animate-price-digit-in-down,
          .glow-pulse,
          .liquid-pulse,
          .success-state,
          .refraction-effect,
          .particle {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  );
}
