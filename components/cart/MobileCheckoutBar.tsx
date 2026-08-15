"use client";

import Link from "next/link";
import {
    type MouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { SummaryProps } from "./cart.types";
import { formatPrice } from "./cart.utils";

const stripCurrency = (value: string) =>
    value
        .replace(/\s*(تومان|تومن)$/i, "")
        .trim();

export default function MobileCheckoutBar({ subtotal }: SummaryProps) {
    const initialFormattedTotalRef = useRef(stripCurrency(formatPrice(subtotal)));

    const [mounted, setMounted] = useState(false);

    const [displayTotal, setDisplayTotal] = useState(
        initialFormattedTotalRef.current,
    );
    const [prevTotal, setPrevTotal] = useState(
        initialFormattedTotalRef.current,
    );
    const [isPriceIncreasing, setIsPriceIncreasing] = useState(true);
    const [priceAnimationKey, setPriceAnimationKey] = useState(0);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [parallax, setParallax] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const lightingRef = useRef<HTMLDivElement>(null);

    const prevTotalRef = useRef(initialFormattedTotalRef.current);
    const prevNumericTotalRef = useRef(Number(subtotal || 0));

    useEffect(() => {
        const animationFrameId = requestAnimationFrame(() => {
            setMounted(true);
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        const numericTotal = Number(subtotal || 0);
        const formatted = stripCurrency(formatPrice(numericTotal));

        if (formatted !== prevTotalRef.current) {
            setIsPriceIncreasing(numericTotal > prevNumericTotalRef.current);
            setPrevTotal(prevTotalRef.current);
            setDisplayTotal(formatted);
            setPriceAnimationKey((previousKey) => previousKey + 1);

            prevTotalRef.current = formatted;
            prevNumericTotalRef.current = numericTotal;
        }
    }, [subtotal]);

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

    return (
        <div
            className={[
                "fixed inset-x-0 bottom-4 z-[70] px-4",
                "transition-all duration-500 ease-out lg:hidden",
                mounted
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-6 opacity-0",
            ].join(" ")}
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            aria-hidden={!mounted}
        >
            <div
                ref={containerRef}
                className={[
                    "relative mx-auto w-full max-w-[400px] overflow-hidden",
                    "rounded-[4px]",
                    "bg-[rgba(28,28,31,0.88)] backdrop-blur-[12px] bg-clip-padding",
                    "transition-all duration-500 sm:max-w-[430px]",
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
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <div className="min-w-0 overflow-hidden text-right">
                            <p className="mb-1 text-[10px] font-light tracking-[0.16em] text-white/40">
                                مبلغ کل                            </p>

                            <div
                                className="flex min-w-0 max-w-full items-baseline justify-end gap-1 overflow-hidden whitespace-nowrap text-white"
                                dir="ltr"
                            >
                                <span className="relative inline-flex min-w-0 max-w-full overflow-hidden text-[clamp(12px,4vw,18px)] font-light leading-none tabular-nums tracking-[0.01em]">
                                    {displayTotal.split("").map((character, index) => {
                                        const rightIndex = displayTotal.length - 1 - index;
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
                                                    width:
                                                        character === ","
                                                            ? "0.22em"
                                                            : "0.52em",
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

                        <Link
                            href="/checkout"
                            className={[
                                "relative min-w-[92px] shrink-0 overflow-hidden sm:min-w-[110px]",
                                "rounded-[4px] px-3 py-2 sm:px-4",
                                "flex items-center justify-center",
                                "text-[13px] font-light tracking-[0.12em] text-white sm:text-[14px] sm:tracking-[0.14em]",
                                "transition-all duration-700",
                                "ease-[cubic-bezier(0.23,1,0.32,1)]",
                                "active:scale-[0.98]",
                                "hover:bg-white/[0.04] hover:opacity-80",
                            ].join(" ")}
                            style={{
                                background: "transparent",
                                color: "#ffffff",
                                boxShadow: "none",
                            }}
                        >
                            پرداخت
                        </Link>

                    </div>
                </div>
            </div>

            <style jsx>{`
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

                @keyframes refraction {
                    0%,
                    100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
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
                    .animate-price-digit-out-up,
                    .animate-price-digit-in-up,
                    .animate-price-digit-out-down,
                    .animate-price-digit-in-down,
                    .refraction-effect {
                        animation-duration: 0.01ms;
                        animation-iteration-count: 1;
                    }
                }
            `}</style>
        </div>
    );
}
