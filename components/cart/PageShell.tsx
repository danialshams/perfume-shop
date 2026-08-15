import React from "react";
import { cn } from "./cart.utils";

export function PageShell({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <main
            className={cn(
                "relative min-h-[100svh] overflow-x-hidden bg-[#F8F8F8]",
                className
            )}
        >
            {children}
        </main>
    );
}

export function ContentContainer({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "relative mx-auto bg-[#F8F8F8] max-w-[720px] px-5 pt-10 pb-16 sm:px-8 lg:pt-16 lg:pb-24",
                className
            )}
        >
            {children}
        </section>
    );
}
