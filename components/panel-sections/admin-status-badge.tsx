"use client";

import { Tag } from "antd";

type Props = {
    type:
    | "active"
    | "inactive"
    | "draft"
    | "featured"
    | "not-featured"
    | "low-stock"
    | "in-stock";
    label: string;
};

export default function AdminStatusBadge({ type, label }: Props) {
    const map = {
        active: "success",
        inactive: "default",
        draft: "warning",
        featured: "magenta",
        "not-featured": "default",
        "low-stock": "error",
        "in-stock": "processing",
    } as const;

    return <Tag color={map[type]}>{label}</Tag>;
}
