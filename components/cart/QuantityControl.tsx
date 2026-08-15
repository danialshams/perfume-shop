"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn, formatPrice } from "./cart.utils";
import MiniSpinner from "./MiniSpinner";

export default function QuantityControl({
    quantity,
    loading,
    disabledIncrease,
    disabledDecrease,
    onIncrease,
    onDecrease,
}: {
    quantity: number;
    loading: boolean;
    disabledIncrease: boolean;
    disabledDecrease: boolean;
    onIncrease: () => void;
    onDecrease: () => void;
}) {
    const qtyRef = useRef<HTMLSpanElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!qtyRef.current || prefersReducedMotion) return;

        gsap.fromTo(
            qtyRef.current,
            { scale: 0.9, autoAlpha: 0.6 },
            {
                scale: 1,
                autoAlpha: 1,
                duration: 0.28,
                ease: "back.out(1.7)",
                clearProps: "transform,opacity,visibility",
            }
        );
    }, [quantity, prefersReducedMotion]);

    return (
        <div
            className={cn(
                "flex items-center rounded-full border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300",
                loading
                    ? "border-[#DCE6F1] bg-[#F4F8FC] opacity-90"
                    : "border-[#E4EAF1] bg-[#F8FAFC]"
            )}
        >
            <button
                type="button"
                onClick={onIncrease}
                disabled={loading || disabledIncrease}
                className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17345F] shadow-[0_3px_8px_rgba(23,52,95,0.06)] transition-all duration-200 active:scale-95",
                    "disabled:cursor-not-allowed disabled:bg-[#F2F5F8] disabled:text-[#A8B3C2] disabled:shadow-none"
                )}
                aria-label="افزایش"
            >
                <Plus size={15} strokeWidth={2.1} />
            </button>

            <span
                ref={qtyRef}
                className="flex min-w-12 items-center justify-center px-1 text-center text-sm font-semibold text-[#172033]"
            >
                {loading ? <MiniSpinner /> : formatPrice(quantity)}
            </span>

            <button
                type="button"
                onClick={onDecrease}
                disabled={loading || disabledDecrease}
                className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#17345F] shadow-[0_3px_8px_rgba(23,52,95,0.06)] transition-all duration-200 active:scale-95",
                    "disabled:cursor-not-allowed disabled:bg-[#F2F5F8] disabled:text-[#A8B3C2] disabled:shadow-none"
                )}
                aria-label="کاهش"
            >
                <Minus size={15} strokeWidth={2.1} />
            </button>
        </div>
    );
}
