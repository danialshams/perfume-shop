"use client";

import { Spin } from "antd";

export default function AdminLoading({
    text = "در حال بارگذاری...",
}: {
    text?: string;
}) {
    return (
        <div className="flex min-h-[260px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
                <Spin size="large" />
                <p className="text-sm text-neutral-500">{text}</p>
            </div>
        </div>
    );
}
