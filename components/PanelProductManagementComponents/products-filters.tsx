"use client";

import { ProductQueryParams } from "@/lib/product";
import { Button, Input, Select } from "antd";
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
        <div className="mb-5 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                    size="large"
                    placeholder="جستجو بر اساس نام، اسلاگ، توضیح..."
                    value={filters.search ?? ""}
                    onChange={(e) =>
                        onChange({ ...filters, search: e.target.value, page: 1 })
                    }
                    onPressEnter={onSearch}
                />

                <Select
                    size="large"
                    placeholder="ویژه"
                    allowClear
                    value={
                        filters.is_featured === 0 || filters.is_featured === 1
                            ? filters.is_featured
                            : undefined
                    }
                    onChange={(value) =>
                        onChange({ ...filters, is_featured: value, page: 1 })
                    }
                    options={[
                        { label: "ویژه", value: 1 },
                        { label: "عادی", value: 0 },
                    ]}
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <Button
                    type="primary"
                    size="large"
                    onClick={onSearch}
                    icon={<Search size={16} />}
                >
                    اعمال فیلتر
                </Button>

                <Button
                    size="large"
                    onClick={onReset}
                    icon={<RotateCcw size={16} />}
                >
                    پاک کردن
                </Button>
            </div>
        </div>
    );
}
