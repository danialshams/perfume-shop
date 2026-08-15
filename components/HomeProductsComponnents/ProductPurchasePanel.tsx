"use client";

import {
  ProductVariant,
  formatPrice,
  getVariantLabel,
} from "@/lib/product";
import { useEffect, useRef, useState } from "react";

type Props = {
  productName?: string;
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
  quantity: number;
  onIncreaseQty: () => void;
  onDecreaseQty: () => void;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
  cartError?: string | null;
  currentPrice: number;
  currentStock: number;
  currentLabel: string;
  inStock: boolean;
  formatVariantLabel: (label: string) => string;
};

export default function ProductPurchasePanel({
  productName,
  variants,
  selectedVariant,
  onSelectVariant,
  quantity,
  onIncreaseQty,
  onDecreaseQty,
  onAddToCart,
  isAddingToCart = false,
  cartError = null,
  currentPrice,
  currentStock,
  inStock,
  formatVariantLabel,
}: Props) {
  const total = Number(currentPrice || 0) * Number(quantity || 1);

  const formattedTotal = formatPrice(total)
    .replace(/\s*(تومان|تومن)$/i, "")
    .trim();

  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  const [isIncreasing, setIsIncreasing] = useState(true);

  const [displayTotal, setDisplayTotal] = useState(formattedTotal);
  const [prevTotal, setPrevTotal] = useState(formattedTotal);
  const [isPriceIncreasing, setIsPriceIncreasing] = useState(true);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0, z: 0 });

  const [buttonScale, setButtonScale] = useState({
    decrement: 1,
    increment: 1,
  });
  const [quantityChanged, setQuantityChanged] = useState(false);
  const [waveEffect, setWaveEffect] = useState(false);
  const [liquidEffect, setLiquidEffect] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; tx: string; ty: string }>
  >([]);

  const mobileTitleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lightingRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);

  const [isMobileTitleVisible, setIsMobileTitleVisible] = useState(false);

  const prevTotalRef = useRef(formattedTotal);
  const prevNumericTotalRef = useRef(total);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 2;
    const rotateY = ((centerX - x) / centerX) * 2;

    setParallax({ x: rotateY, y: rotateX, z: 5 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (lightingRef.current) {
      lightingRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setParallax({ x: 0, y: 0, z: 0 });
    if (lightingRef.current) {
      lightingRef.current.style.opacity = "0";
    }
  };

  const handleIncrement = () => {
    if (inStock && quantity < currentStock && !isAddingToCart) {
      setButtonScale((prev) => ({ ...prev, increment: 0.85 }));
      setTimeout(
        () => setButtonScale((prev) => ({ ...prev, increment: 1 })),
        150,
      );
      setQuantityChanged(true);
      setTimeout(() => setQuantityChanged(false), 1000);
      setLiquidEffect(true);
      setTimeout(() => setLiquidEffect(false), 400);
      onIncreaseQty();
    }
  };

  const handleDecrement = () => {
    if (quantity > 1 && !isAddingToCart) {
      setButtonScale((prev) => ({ ...prev, decrement: 0.85 }));
      setTimeout(
        () => setButtonScale((prev) => ({ ...prev, decrement: 1 })),
        150,
      );
      setQuantityChanged(true);
      setTimeout(() => setQuantityChanged(false), 1000);
      setLiquidEffect(true);
      setTimeout(() => setLiquidEffect(false), 400);
      onDecreaseQty();
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !inStock || isAddingToCart) return;

    if (rippleContainerRef.current && addButtonRef.current) {
      const button = addButtonRef.current;
      const container = rippleContainerRef.current;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = rect.width / 2 - size / 2;
      const y = rect.height / 2 - size / 2;

      const ripple = document.createElement("div");
      ripple.className = "ripple-effect";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      container.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setWaveEffect(true);
    setTimeout(() => setWaveEffect(false), 2000);

    await onAddToCart();

    setShowSuccess(true);

    const particleArray = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      particleArray.push({
        x: 50,
        y: 50,
        tx: `${Math.cos(angle) * distance}`,
        ty: `${Math.sin(angle) * distance}`,
      });
    }
    setParticles(particleArray);

    setTimeout(() => {
      setShowSuccess(false);
      setParticles([]);
    }, 2000);
  };

  useEffect(() => {
    if (quantity !== displayQuantity) {
      setIsIncreasing(quantity > displayQuantity);
      setPrevQuantity(displayQuantity);
      setDisplayQuantity(quantity);
    }
  }, [quantity, displayQuantity]);

  useEffect(() => {
    if (formattedTotal !== prevTotalRef.current) {
      setIsPriceIncreasing(total > prevNumericTotalRef.current);
      setPrevTotal(prevTotalRef.current);
      setDisplayTotal(formattedTotal);
      setPriceAnimationKey((prev) => prev + 1);

      prevTotalRef.current = formattedTotal;
      prevNumericTotalRef.current = total;
    }
  }, [quantity, formattedTotal, total]);

  useEffect(() => {
    const titleEl = mobileTitleRef.current;

    if (!titleEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMobileTitleVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(titleEl);

    return () => {
      observer.disconnect();
    };
  }, []);
  const renderVariantOptions = () => (
    <div className="mx-auto mb-8 w-full max-w-[440px] text-center sm:max-w-[480px] lg:max-w-[520px]">
      <div className="flex flex-wrap items-start justify-center gap-x-5 gap-y-6 sm:gap-x-6 sm:gap-y-6">
        {variants?.length > 0 ? (
          variants.map((variant) => {
            const active = selectedVariant?.id === variant.id;
            const stock = Number(variant.stock_qty ?? 0);
            const disabled = stock <= 0;

            return (
              <div key={variant.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectVariant(variant);
                  }}
                  disabled={disabled}
                  className={`min-w-[92px] rounded-[4px] border px-4 py-2.5 text-center transition-all duration-300 ${active
                    ? "border-[#33383C] bg-[#F8F8F8] text-[#242427] shadow-[0_0_0_1px_rgba(36,36,39,0.08)]"
                    : "border-[#ACB2B4] bg-[#F8F8F8] text-[#5d5d64]"
                    } ${disabled
                      ? "cursor-not-allowed opacity-35"
                      : "active:scale-[0.985] hover:border-[#bdbdc4]"
                    }`}
                >
                  <span
                    dir="ltr"
                    className="block text-[12px] font-extralight leading-[1.85] tracking-[0.08em]"
                  >
                    {formatVariantLabel(getVariantLabel(variant))}
                  </span>
                </button>

                <span
                  className={`mt-2.5 block min-h-[14px] text-[9.5px] font-light tracking-[0.13em] ${disabled ? "text-[#cdced5]" : "text-transparent"
                    }`}
                >
                  {disabled ? "ناموجود" : ""}
                </span>
              </div>
            );
          })
        ) : selectedVariant ? (
          // حالت محصول تکی - نمایش حجم
          <div className="flex flex-col items-center">
            <button
              type="button"
              className="min-w-[92px] rounded-[4px] border border-[#33383C] bg-[#F8F8F8] px-4 py-2.5 text-center text-[#242427] shadow-[0_0_0_1px_rgba(36,36,39,0.08)] transition-all duration-300 active:scale-[0.985]"
            >
              <span
                dir="ltr"
                className="block text-[12px] font-extralight leading-[1.85] tracking-[0.08em]"
              >
                {selectedVariant.volume_ml ? `${selectedVariant.volume_ml} ml` :
                  selectedVariant.volume ? `${selectedVariant.volume} ml` :
                    selectedVariant.volume_ml !== undefined ? `${selectedVariant.volume_ml} ml` : ''}
              </span>
            </button>
            <span className="mt-2.5 block min-h-[14px] text-[9.5px] font-light tracking-[0.13em] text-transparent">
            </span>
          </div>
        ) : (
          <div className="rounded-[4px] border border-[#e8e8ea] bg-white px-5 py-3 text-[12px] font-light tracking-[0.08em] text-[#9a9aa0]">
            واریانتی ثبت نشده است
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="mt-12 text-center sm:mt-14 md:mt-16 lg:mt-8">
      {productName && (
        <div
          ref={mobileTitleRef}
          className={[
            "mx-auto mb-18 block max-w-[440px] px-12 text-center sm:max-w-[480px] sm:px-16 lg:hidden",
            "transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isMobileTitleVisible
              ? "translate-y-0 opacity-100 blur-0"
              : "translate-y-5 opacity-0 blur-[8px]",
          ].join(" ")}
        >
          <h2 className="m-0 text-[#33383C] bg-gradient-to-b from-[#1b3a6b] via-[#0f2547] to-[#081427] bg-clip-text text-[28px] font-extralight leading-[1.25] tracking-[-0.035em] text-transparent sm:text-[34px] md:text-[40px]">
            {productName}
          </h2>
        </div>
      )}

      {renderVariantOptions()}

      <div className="mx-auto max-w-7xl px-6 sm:px-16 md:px-24 lg:px-32">
        <div
          ref={containerRef}
          className={`relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[4px] border border-white/[0.1] bg-[rgb(50,55,59)] shadow-lg backdrop-blur-2xl transition-all duration-500 sm:max-w-[430px] lg:max-w-[460px] ${liquidEffect ? "liquid-pulse" : ""
            } ${showSuccess ? "success-state" : ""}`}
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

          <div className="pointer-events-none absolute inset-0 refraction-effect opacity-30" />

          <div className="relative px-3 py-2.5 sm:px-4">
            {cartError && (
              <div className="mb-3 rounded-[3px] border border-[#7a1f1f]/40 bg-[#2a0f0f]/40 px-3 py-2 text-right text-[11px] tracking-[0.08em] text-[#e8c4c4]">
                {cartError}
              </div>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:gap-2.5">
              <div className="min-w-0 overflow-hidden text-right">
                <div
                  className="flex min-w-0 max-w-full items-baseline justify-end gap-1 overflow-hidden whitespace-nowrap text-white sm:gap-1.5"
                  dir="ltr"
                >
                  <span className="relative inline-flex min-w-0 max-w-full overflow-hidden text-[15px] font-light leading-none tabular-nums tracking-[0.12em] sm:text-[10.5px] sm:tracking-[0.18em]">
                    {displayTotal.split("").map((char, index) => {
                      const rightIndex = displayTotal.length - 1 - index;
                      const prevIndex = prevTotal.length - 1 - rightIndex;
                      const prevChar =
                        prevIndex >= 0 ? prevTotal[prevIndex] : "";
                      const hasChanged = prevChar !== char;
                      const delay = `${rightIndex * 35}ms`;

                      return (
                        <span
                          key={`${priceAnimationKey}-digit-${rightIndex}`}
                          className="relative inline-block overflow-hidden"
                          style={{
                            width: char === "," ? "0.22em" : "0.52em",
                            height: "1.2em",
                            flexShrink: 0,
                          }}
                        >
                          {hasChanged && prevChar ? (
                            <>
                              <span
                                key={`${priceAnimationKey}-prev-${rightIndex}`}
                                className={`absolute inset-0 flex items-center justify-center ${isPriceIncreasing
                                  ? "animate-price-digit-out-up"
                                  : "animate-price-digit-out-down"
                                  }`}
                                style={{
                                  animationDelay: delay,
                                  zIndex: 1,
                                }}
                              >
                                {prevChar}
                              </span>

                              <span
                                key={`${priceAnimationKey}-curr-${rightIndex}`}
                                className={`absolute inset-0 flex items-center justify-center ${isPriceIncreasing
                                  ? "animate-price-digit-in-up"
                                  : "animate-price-digit-in-down"
                                  }`}
                                style={{
                                  animationDelay: delay,
                                  zIndex: 2,
                                }}
                              >
                                {char}
                              </span>
                            </>
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center">
                              {char}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </span>

                  <span className="relative -top-px shrink-0 text-[9px] font-light tracking-[0.12em] text-white/40 sm:text-[10px] sm:tracking-[0.15em]">
                    T
                  </span>
                </div>
              </div>

              <div
                className="flex shrink-0 items-center "
                dir="ltr"
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isAddingToCart}
                  className="flex h-8 w-7 items-center justify-center rounded-l-[2px] text-[16px] font-light text-white transition-all duration-300 hover:bg-white/[0.04] hover:opacity-70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 sm:w-8"
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
                  className={`relative flex h-8 w-8 items-center justify-center overflow-hidden pl-[0.12em] text-[13px] font-light tabular-nums tracking-[0.12em] text-white sm:w-9 sm:pl-[0.18em] sm:text-[10.5px] sm:tracking-[0.18em] ${quantityChanged ? "glow-pulse" : ""
                    }`}
                >

                  <span
                    key={`prev-${prevQuantity}`}
                    className={
                      isIncreasing
                        ? "animate-quantity-slide-down"
                        : "animate-quantity-slide-up"
                    }
                  >
                    {prevQuantity}
                  </span>

                  <span
                    key={`curr-${displayQuantity}`}
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
                  disabled={!inStock || quantity >= currentStock || isAddingToCart}
                  className="flex h-8 w-7 items-center justify-center rounded-r-[2px] text-[16px] font-light text-white transition-all duration-300 hover:bg-white/[0.04] hover:opacity-70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 sm:w-8"
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
                disabled={!selectedVariant || !inStock || isAddingToCart}
                className={`relative min-w-[88px] shrink-0 overflow-hidden  px-2.5 py-2 text-[13px] font-light tracking-[0.12em] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] sm:min-w-[110px] sm:px-3.5 sm:text-[10.5px] sm:tracking-[0.18em] lg:min-w-[120px] lg:px-4 ${waveEffect ? "wave-effect" : ""
                  }`}
                style={{
                  background: showSuccess
                    ? "rgba(255, 255, 255, 0.06)"
                    : "transparent",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  color: !inStock ? "rgba(255, 255, 255, 0.2)" : "#ffffff",
                  boxShadow: "none",
                }}
              >
                {showSuccess &&
                  particles.map((particle, i) => (
                    <div
                      key={i}
                      className="particle"
                      style={
                        {
                          left: particle.x + "%",
                          top: particle.y + "%",
                          "--tx": particle.tx + "px",
                          "--ty": particle.ty + "px",
                        } as React.CSSProperties
                      }
                    />
                  ))}

                <span
                  className={`btn-content relative z-10 flex items-center justify-center ${showSuccess ? "success-active" : ""
                    }`}
                >
                  <span className="add-label flex items-center justify-center whitespace-nowrap">
                    {isAddingToCart ? "افزودن..." : "افزودن به سبد"}
                  </span>

                  <span className="success-label absolute inset-0 flex items-center justify-center gap-1.5 whitespace-nowrap sm:gap-2">
                    <span className="success-text inline-flex items-center">
                      افزوده شد
                    </span>

                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      className="checkmark-svg inline-block shrink-0"
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
          filter: blur(0px);
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

      @keyframes checkmark-bounce {
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
        animation: priceDigitOutUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
      }

      .animate-price-digit-in-up {
        animation: priceDigitInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
      }

      .animate-price-digit-out-down {
        animation: priceDigitOutDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
      }

      .animate-price-digit-in-down {
        animation: priceDigitInDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
      }

      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.18);
        pointer-events: none;
        animation: ripple 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
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
        transition: stroke-dashoffset 0.6s cubic-bezier(0.45, 0, 0.55, 1);
      }

      .success-active .checkmark-path {
        stroke-dashoffset: 0;
        transition-delay: 0.3s;
      }

      .success-active .checkmark-svg {
        animation: checkmark-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)
          forwards;
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
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        animation: particleBurst 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
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
