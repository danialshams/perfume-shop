"use client";

import { useState } from "react";
import OrdersSection from "@/components/account/OrdersSection";
import ProfileSection from "@/components/account/ProfileSection";
import { ProfileForm, T } from "@/components/account/utils";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";
import LuxuryNavbar from "@/components/home-sections/navbar";

interface Props {
    initialData: ProfileForm;
}

type Tab = "profile" | "orders";

const tabs: Array<{ key: Tab; label: string }> = [
    { key: "profile", label: "اطلاعات و نشانی" },
    { key: "orders", label: "سفارش‌های من" },
];

export default function AccountClientWrapper({ initialData }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("profile");

    const fullName = `${initialData.first_name} ${initialData.last_name}`.trim();

    return (
        <div className="maison-account bg-[#F8F8F8]">
            <LuxuryNavbar />

            {/* حذف آیکن‌های بومی مرورگر روی فیلد رمز */}
            <style>{`
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none !important;
                }
                input::-webkit-credentials-auto-fill-button,
                input::-webkit-strong-password-auto-fill-button,
                input::-webkit-strong-password-generation-button,
                input::-webkit-caps-lock-indicator {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    margin: 0 !important;
                }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                textarea:-webkit-autofill {
                    -webkit-text-fill-color: ${T.ink1};
                    -webkit-box-shadow: 0 0 0 1000px ${T.paper} inset;
                    transition: background-color 9999s ease-out 0s;
                }
            `}</style>

            <main
                dir="rtl"
                className="min-h-screen selection:bg-[#1A1A1A] selection:text-white"
                style={{ background: T.paper, color: T.ink1 }}
            >
                <div className="mx-auto w-full max-w-[42rem] bg-[#F8F8F8] px-6 pb-28 pt-16 sm:px-10 sm:pt-24">
                    <header className="mb-10 bg-[#F8F8F8] sm:mb-12">
                        <h1
                            className="text-[28px] font-light leading-[1.25] tracking-tight sm:text-[34px]"
                            style={{ color: T.ink1 }}
                        >
                            حساب کاربری
                        </h1>

                        <p
                            className="mt-4 text-[12px] font-light leading-[2]"
                            style={{ color: T.ink3 }}
                        >
                            {fullName ? `${fullName} عزیز، خوش آمدید.` : "خوش آمدید."}
                        </p>
                    </header>

                    <nav
                        className="flex items-stretch gap-8 border-b"
                        style={{ borderColor: T.hairline }}
                        role="tablist"
                        aria-label="بخش‌های حساب"
                    >
                        {tabs.map((tab, index) => {
                            const active = activeTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="relative -mb-px pb-4 pt-1 transition-colors duration-300"
                                >
                                    <span className="flex items-baseline gap-2.5">
                                        <span
                                            className="text-[10px] font-normal tabular-nums tracking-[0.24em]"
                                            style={{ color: active ? T.ink2 : T.ink3 }}
                                        >
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span
                                            className="text-[12px] font-medium tracking-[0.14em]"
                                            style={{ color: active ? T.ink1 : T.ink3 }}
                                        >
                                            {tab.label}
                                        </span>
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className={[
                                            "absolute inset-x-0 bottom-0 h-px origin-right transition-transform duration-500 ease-out",
                                            active ? "scale-x-100" : "scale-x-0",
                                        ].join(" ")}
                                        style={{ background: T.ink1 }}
                                    />
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-4">
                        {activeTab === "profile" && (
                            <ProfileSection initialData={initialData} />
                        )}

                        {activeTab === "orders" && (
                            <div className="mt-12">
                                <OrdersSection />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CinematicFooter />
        </div>
    );
}
