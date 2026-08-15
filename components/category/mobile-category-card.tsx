"use client";

import { Button, Card } from "antd";
import {
    Pencil,
    Trash2,
    Layers,
    FolderTree,
    Network,
} from "lucide-react";

import { CategoryItem } from "./category-types";
import AdminStatusBadge from "../panel-sections/admin-status-badge";

type MobileCategoryCardProps = {
    category: CategoryItem;
    onEdit: () => void;
    onDelete: () => void;
};

function getStructureInfo(category: CategoryItem) {
    const parentCount = category.parent_ids?.length ?? 0;
    const childrenCount = Number(category.children_count ?? 0);

    if (parentCount === 0 && childrenCount > 0) {
        return {
            label: "والد اصلی",
            type: "featured" as const,
        };
    }

    if (parentCount > 0 && childrenCount > 0) {
        return {
            label: "والد و فرزند",
            type: "featured" as const,
        };
    }

    if (parentCount > 0 && childrenCount === 0) {
        return {
            label: "فرزند",
            type: "draft" as const,
        };
    }

    return {
        label: "مستقل",
        type: "inactive" as const,
    };
}

export default function MobileCategoryCard({
    category,
    onEdit,
    onDelete,
}: MobileCategoryCardProps) {
    const isActive = category.is_active === true || category.is_active === 1;

    const parentCount = category.parent_ids?.length ?? 0;
    const childrenCount = Number(category.children_count ?? 0);
    const parentNames = category.parent_names ?? [];

    const structure = getStructureInfo(category);

    return (
        <Card
            className="overflow-hidden rounded-[28px] border border-neutral-100 shadow-sm"
            styles={{
                body: {
                    padding: 16,
                },
            }}
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FolderTree size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-black leading-6 text-neutral-900">
                            {category.name}
                        </h3>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isActive ? (
                        <AdminStatusBadge type="active" label="فعال" />
                    ) : (
                        <AdminStatusBadge type="inactive" label="غیرفعال" />
                    )}

                    <AdminStatusBadge type={structure.type} label={structure.label} />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-neutral-50 px-3 py-2">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <Layers size={13} />
                            <span>تعداد والد</span>
                        </div>

                        <div className="text-xs font-bold text-neutral-900">
                            {parentCount > 0 ? `${parentCount} دسته` : "ندارد"}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-neutral-50 px-3 py-2">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <Network size={13} />
                            <span>تعداد فرزند</span>
                        </div>

                        <div className="text-xs font-bold text-neutral-900">
                            {childrenCount}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-neutral-50 px-3 py-2 sm:col-span-2">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <FolderTree size={13} />
                            <span>والدها</span>
                        </div>

                        <div className="line-clamp-2 text-xs font-bold text-neutral-900">
                            {parentNames.length > 0 ? parentNames.join("، ") : "بدون والد"}
                        </div>
                    </div>
                </div>

                {category.description ? (
                    <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                        <p className="line-clamp-3 text-xs leading-6 text-neutral-600">
                            {category.description}
                        </p>
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                        type="primary"
                        icon={<Pencil size={16} />}
                        onClick={onEdit}
                        className="h-10 rounded-xl"
                        block
                    >
                        ویرایش
                    </Button>

                    <Button
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={onDelete}
                        className="h-10 rounded-xl"
                        block
                    >
                        حذف
                    </Button>
                </div>
            </div>
        </Card>
    );
}
