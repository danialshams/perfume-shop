"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import { PrimaryButton } from "./Buttons";

export default function EmptyCart() {
  const rootRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !rootRef.current) return;
    const scope = gsap.context(() => {
      gsap.fromTo(".ql-cart-empty-reveal", {
        y: 22, opacity: 0,
      }, {
        y: 0, opacity: 1, duration: 0.95, stagger: 0.12,
        ease: "power2.out", clearProps: "transform,opacity",
      });
    }, rootRef);
    return () => scope.revert();
  }, [reducedMotion]);

  return (
    <>
      <LuxuryNavbar />
      <section
        ref={rootRef}
        aria-labelledby="empty-cart-title"
        className="ql-cart-empty ql-container relative flex min-h-[min(720px,80svh)] flex-col justify-center py-24 sm:py-32"
      >
        <div className="mx-auto w-full max-w-[680px] text-center">
          <div className="ql-cart-empty-reveal mb-10 flex items-center justify-between gap-4 border-b border-[#d8cebf] pb-5 text-[10px] tracking-[0.18em] text-[#98856d]" lang="en" dir="ltr">
            <span>MAISON / YOUR SELECTION</span>
            <span>00 — ITEMS</span>
          </div>
          <div className="ql-cart-empty-reveal mx-auto mb-9 flex h-16 w-16 items-center justify-center border border-[#d8cebf] text-[#9b8263]">
            <ShoppingBag size={27} strokeWidth={1.1} aria-hidden="true" />
          </div>
          <h1 id="empty-cart-title" className="ql-cart-empty-reveal text-[clamp(35px,6vw,65px)] font-light leading-[1.6] tracking-[-0.055em] text-[#302d29]">
            هنوز رایحه‌ای انتخاب نکرده‌اید.
          </h1>
          <p className="ql-cart-empty-reveal mx-auto mt-5 max-w-[450px] text-[13px] font-light leading-[2.7] text-[#82766a] sm:text-[15px]">
            مجموعه را کشف کنید؛ عطرهایی که ارزش مکث‌کردن و انتخاب دقیق را دارند.
          </p>
          <div className="ql-cart-empty-reveal mt-10 flex justify-center">
            <PrimaryButton href="/products" className="min-w-[210px] gap-8 !rounded-none !bg-[#302d29] !px-7 !py-7 !tracking-normal hover:!bg-[#6a5641]">
              کشف مجموعه عطرها
              <ArrowLeft size={17} strokeWidth={1.2} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="ql-cart-empty-reveal mt-16 border-t border-[#d8cebf] pt-5 text-[10px] tracking-[0.16em] text-[#b09f8a]" lang="en" dir="ltr">
            A PERSONAL JOURNEY THROUGH SCENT
          </div>
        </div>
      </section>
      <CinematicFooter />
    </>
  );
}
