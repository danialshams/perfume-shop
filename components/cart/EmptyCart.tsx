"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import LuxuryFooter from "@/components/home-sections/LuxuryFooter";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { PrimaryButton } from "./Buttons";
import SectionLabel from "./SectionLabel";

export default function EmptyCart() {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const iconRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".empty-el",
                { y: 18, autoAlpha: 0, filter: "blur(8px)" },
                {
                    y: 0,
                    autoAlpha: 1,
                    filter: "blur(0px)",
                    duration: 0.8,
                    stagger: 0.08,
                    ease: "power3.out",
                    clearProps: "transform,opacity,visibility,filter",
                }
            );

            gsap.to(iconRef.current, {
                y: -7,
                duration: 2.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }, rootRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    return (
        <>
            <LuxuryNavbar />

            <main
                ref={rootRef}
                className="relative min-h-[100svh] overflow-hidden سبد خرید شما خالی است
 px-4 py-8 sm:px-6 md:py-14 lg:px-8"
            >
                <section className="relative mx-auto flex min-h-[calc(100svh-220px)] max-w-3xl items-center justify-center">
                    <div className="w-full rounded-[34px] border border-[#E4EAF1]/90 سبد خرید شما خالی است
 px-6 py-14 text-center backdrop-blur-2xl sm:px-8 md:px-12 md:py-16">
                        <div
                            ref={iconRef}
                            className="empty-el mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#E6EDF5] سبد خرید شما خالی است
 text-[#17345F]"
                        >
                            <ShoppingBag size={38} strokeWidth={1.9} />
                        </div>

                        <div className="empty-el">
                            <SectionLabel>YOUR CART</SectionLabel>
                        </div>

                        <h1 className="empty-el mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#172033] md:text-4xl">
                            سبد خرید شما خالی است
                        </h1>

                        <p className="empty-el mx-auto mt-4 max-w-md text-sm leading-8 text-[#6B7280] md:text-[15px]">
                            هنوز محصولی انتخاب نکرده‌اید. محصولات را بررسی کنید و آیتم‌های موردنظرتان را به سبد اضافه کنید.
                        </p>

                        <div className="empty-el mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <PrimaryButton href="/products" className="px-7">
                                مشاهده محصولات
                                <ArrowLeft size={18} />
                            </PrimaryButton>

                            <div className="inline-flex h-12 items-center justify-center rounded-full border border-[#E4EAF1] bg-white/70 px-5 text-sm text-[#6B7280]">
                                تجربه خریدی ساده، لوکس و مطمئن
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <LuxuryFooter />
        </>
    );
}
