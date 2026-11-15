"use client";

import { ProductQueryParams } from "@/lib/product";
import { Button, Input } from "antd";
import { Search, RotateCcw } from "lucide-react";

type Props = {
    filters: ProductQueryParams;
    onChange: (next: ProductQueryParams) => void;
    onSearch: () => void;
    onReset: () => void;
};

export default function ProductsFilters({
    filters,
    onChange,
    onSearch,
    onReset,
}: Props) {
    return (
        <div className="mb-5 rounded-md border border-[#e3e8e1] bg-white p-4">
            <div className="grid grid-cols-1 gap-3">
                <Input
                    size="large"
                    placeholder="جستجو بر اساس نام یا شناسه عطر"
                    value={filters.search ?? ""}
                    onChange={(e) =>
                        onChange({ ...filters, search: e.target.value, page: 1 })
                    }
                    onPressEnter={onSearch}
                />

            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <Button
                    type="primary"
                    size="large"
                    onClick={onSearch}
                    icon={<Search size={16} />}
                >
                    جستجو
                </Button>

                <Button
                    size="large"
                    onClick={onReset}
                    icon={<RotateCcw size={16} />}
                >
                    پاک‌کردن
                </Button>
            </div>
        </div>
    );
}
