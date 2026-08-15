"use client";

import React from "react";
import { useViewportReveal } from "./cart.hooks";

export default function ViewportSection({
    children,
    className,
    animation = "default",
    disabled,
}: {
    children: React.ReactNode;
    className?: string;
    animation?: "default" | "summary" | "header";
    disabled?: boolean;
}) {
    const ref = useViewportReveal<HTMLDivElement>({
        animation,
        disabled,
    });

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
