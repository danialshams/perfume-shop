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
        active: "#e7f1e7",
        inactive: "default",
        draft: "#f7eedc",
        featured: "#e3ece1",
        "not-featured": "default",
        "low-stock": "#fae5da",
        "in-stock": "#e8f0e9",
    } as const;

    return <Tag color={map[type]}>{label}</Tag>;
}
