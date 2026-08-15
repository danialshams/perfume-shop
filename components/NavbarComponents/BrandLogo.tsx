"use client";

import Link from "next/link";
import { NAVY_SOFT } from "./navbar.constants";

export default function BrandLogo() {
    return (
        <Link
            href="/"
            aria-label="صفحه اصلی"
            className="group flex shrink-0 items-center gap-3"
        >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dbe5f2] bg-white shadow-[0_10px_26px_rgba(15,31,61,0.05)] transition-all duration-300 group-hover:-translate-y-[1px] group-hover:border-[#cfdced]">
                <div className="pointer-events-none absolute inset-[3px] rounded-[14px] border border-[#f4f8fc]" />
                <div
                    className="pointer-events-none absolute inset-x-2 top-1 h-px"
                    style={{
                        background:
                            "linear-gradient(to left, transparent, rgba(90,115,150,0.28), transparent)",
                    }}
                />
                <span
                    className="select-none font-serif text-[20px] font-normal tracking-[-0.08em]"
                    style={{ color: NAVY_SOFT }}
                >
                    L
                </span>
            </div>

            <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-[10.5px] font-medium tracking-[0.34em] text-[#112447]">
                    MAISON
                </span>
                <span className="mt-1 text-[10px] font-light tracking-[0.16em] text-[#6b819e]">
                    exclusive fragrance
                </span>
            </div>
        </Link>
    );
}
