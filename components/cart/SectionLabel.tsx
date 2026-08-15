import React from "react";

export default function SectionLabel({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <p className="text-[11px] font-medium tracking-[0.28em] text-[#8AA0BC]">
            {children}
        </p>
    );
}
