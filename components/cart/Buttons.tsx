// Buttons.tsx
import Link from "next/link";
import React from "react";
import { cn } from "./cart.utils";

export function PrimaryButton({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[1px] bg-[#2A2A2A] px-5 text-[13px] font-light tracking-[0.08em] text-white transition-all hover:bg-[#3A3A3A] active:scale-[0.99]",
                className
            )}
        >
            {children}
        </Link>
    );
}
