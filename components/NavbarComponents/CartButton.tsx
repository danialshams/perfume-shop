"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartCount } from "@/context/CartCountContext";

const CART_BADGE_RED = "#b91c1c";

type CartButtonProps = {
  mobile?: boolean;
};

export default function CartButton({ mobile = false }: CartButtonProps) {
  const { cartCount } = useCartCount();

  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCountRef = useRef<number | null>(null);

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

  const displayCount = cartCount > 99 ? "99+" : cartCount;

  const baseClass =
    "group relative flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-[0_8px_24px_rgba(15,31,61,0.04)] transition-all duration-300";

  const variantClass = mobile
    ? "border-[#dbe5f2] text-[#112447] active:scale-95"
    : "border-[#dbe5f2] text-[#48617f] hover:-translate-y-[1px] hover:border-[#cfdced] hover:text-[#0f1f3d]";

  return (
    <>
      <style jsx>{`
        @keyframes cartShake {
          0% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-8deg) scale(1.02); }
          40% { transform: rotate(6deg) scale(1.02); }
          60% { transform: rotate(-4deg) scale(1.01); }
          80% { transform: rotate(2deg) scale(1.01); }
          100% { transform: rotate(0deg) scale(1); }
        }

        @keyframes badgePop {
          0% { transform: scale(1); }
          30% { transform: scale(1.28); }
          65% { transform: scale(0.94); }
          100% { transform: scale(1); }
        }

        @keyframes badgeGlow {
          0% {
            box-shadow:
              0 0 0 0 rgba(185, 28, 28, 0),
              0 6px 14px rgba(185, 28, 28, 0.24);
          }
          35% {
            box-shadow:
              0 0 0 6px rgba(185, 28, 28, 0.16),
              0 10px 22px rgba(185, 28, 28, 0.32);
          }
          100% {
            box-shadow:
              0 0 0 10px rgba(185, 28, 28, 0),
              0 6px 14px rgba(185, 28, 28, 0.24);
          }
        }

        .cart-shake {
          animation: cartShake 0.46s ease-in-out;
          transform-origin: top center;
          will-change: transform;
        }

        .badge-pop {
          animation:
            badgePop 0.36s ease-out,
            badgeGlow 0.6s ease-out;
          will-change: transform, box-shadow;
        }
      `}</style>

      <Link
        href="/cart"
        aria-label="سبد خرید"
        className={`${baseClass} ${variantClass}`}
      >
        <ShoppingBag
          className={`h-5 w-5 ${animateCart ? "cart-shake" : ""}`}
          strokeWidth={1.55}
        />

        {cartCount > 0 && (
          <span
            className={`absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white px-1.5 text-[10px] font-semibold leading-none text-white tabular-nums ${
              animateCart ? "badge-pop" : ""
            }`}
            style={{
              backgroundColor: CART_BADGE_RED,
              boxShadow: "0 6px 14px rgba(185, 28, 28, 0.24)",
            }}
          >
            {displayCount}
          </span>
        )}
      </Link>
    </>
  );
}
