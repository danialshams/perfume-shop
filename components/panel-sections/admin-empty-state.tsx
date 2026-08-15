"use client";

type Props = {
    title?: string;
    description?: string;
};

export default function AdminEmptyState({
    title = "موردی یافت نشد",
    description = "داده‌ای برای نمایش وجود ندارد.",
}: Props) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white">
            <div className="text-center">
                <h3 className="text-base font-bold text-neutral-800">{title}</h3>
                <p className="mt-2 text-sm text-neutral-500">{description}</p>
            </div>
        </div>
    );
}
