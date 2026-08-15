"use client";

import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReactNode } from "react";

type Props<T extends object> = {
    columns: ColumnsType<T>;
    data: T[];
    rowKey: string | ((record: T) => string);
    loading?: boolean;
    pagination?: TablePaginationConfig | false;
    expandable?: any;
    locale?: {
        emptyText?: ReactNode;
    };
    scroll?: {
        x?: number | string | true;
        y?: number | string;
    };
};

export default function AdminDataTable<T extends object>({
    columns,
    data,
    rowKey,
    loading,
    pagination,
    expandable,
    locale,
    scroll = { x: 1200 },
}: Props<T>) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-sm backdrop-blur">
            <Table<T>
                columns={columns}
                dataSource={data}
                rowKey={rowKey}
                loading={loading}
                pagination={pagination}
                expandable={expandable}
                locale={locale}
                scroll={scroll}
            />
        </div>
    );
}
