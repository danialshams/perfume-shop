import React from "react";
import { ui } from "./cart.tokens";
import { cn } from "./cart.utils";

export default function SurfaceCard({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "border border-[#E4EAF1]/90 bg-white/88 backdrop-blur-xl",
                ui.radius.card,
                ui.shadows.soft,
                className
            )}
        >
            {children}
        </div>
    );
}
