"use client";

import Spinner from "./spinner";


export default function SectionLoader({
    title = "در حال بارگذاری...",
}: {
    title?: string;
}) {
    return (
        <div className="flex min-h-[220px] w-full items-center justify-center rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
                <Spinner size="lg" className="text-neutral-700" />
                <p className="text-sm text-neutral-500">{title}</p>
            </div>
        </div>
    );
}
