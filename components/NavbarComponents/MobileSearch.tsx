"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import SearchOverlay from "./SearchOverlay";

type MobileSearchProps = {
    updateHeaderHidden?: (hidden: boolean) => void;
};

export default function MobileSearch({
    updateHeaderHidden,
}: MobileSearchProps) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        updateHeaderHidden?.(false);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                aria-label="باز کردن جستجو"
                aria-expanded={open}
                onClick={handleOpen}
                className={[
                    "flex h-10 w-10 items-center justify-center",
                    "rounded-full bg-transparent text-[#33383C]",
                    "transition active:scale-95",
                    "min-[920px]:hidden",
                ].join(" ")}
            >
                <Search
                    className="h-[20px] w-[20px]"
                    strokeWidth={1.5}
                />

            </button>

            <SearchOverlay
                open={open}
                onClose={handleClose}
                mode="mobile"
            />
        </>
    );
}
