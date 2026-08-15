"use client";

import { Button, Popconfirm, Space, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryItem } from "./category-types";
import AdminDataTable from "../panel-sections/admin-data-table";
import { boolify } from "../panel-sections/persian-number";

type Props = {
    data: CategoryItem[];
    loading?: boolean;
    onEdit: (category: CategoryItem) => void;
    onDelete: (category: CategoryItem) => void;
};

function renderParentTags(parentNames?: string[]) {
    if (!Array.isArray(parentNames) || parentNames.length === 0) {
        return <Tag>بدون والد</Tag>;
    }

    return (
        <Space size={[4, 4]} wrap>
            {parentNames.map((name) => (
                <Tag key={name} color="purple">
                    {name}
                </Tag>
            ))}
        </Space>
    );
}

export default function CategoriesTable({
    data,
    loading,
    onEdit,
    onDelete,
}: Props) {
    const columns: ColumnsType<CategoryItem> = [
        {
            title: "نام",
            dataIndex: "name",
            key: "name",
            width: 220,
            render: (value, record) => (
                <div className="space-y-1">
                    <div className="font-medium">{value}</div>

                    {record.description ? (
                        <Tooltip title={record.description}>
                            <div className="max-w-[220px] truncate text-xs text-gray-500">
                                {record.description}
                            </div>
                        </Tooltip>
                    ) : null}
                </div>
            ),
        },
        {
            title: "والدها",
            dataIndex: "parent_names",
            key: "parent_names",
            width: 320,
            render: (value) => renderParentTags(value),
        },
        {
            title: "فعال",
            dataIndex: "is_active",
            key: "is_active",
            width: 100,
            render: (value) =>
                boolify(value) ? (
                    <Tag color="green">فعال</Tag>
                ) : (
                    <Tag color="red">غیرفعال</Tag>
                ),
        },
        {
            title: "عملیات",
            key: "actions",
            width: 120,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Tooltip title="ویرایش">
                        <Button
                            type="text"
                            icon={<Pencil size={17} />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="حذف دسته‌بندی"
                        description={`از حذف «${record.name}» مطمئن هستید؟`}
                        okText="بله"
                        cancelText="خیر"
                        onConfirm={() => onDelete(record)}
                    >
                        <Tooltip title="حذف">
                            <Button
                                danger
                                type="text"
                                icon={<Trash2 size={17} />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminDataTable<CategoryItem>
            columns={columns}
            data={data}
            rowKey={(record) => String(record.id)}
            loading={loading}
            pagination={{
                pageSize: 20,
                showSizeChanger: true,
            }}
            locale={{ emptyText: "دسته‌بندی‌ای یافت نشد" }}
            scroll={{ x: 800 }}
        />
    );
}
