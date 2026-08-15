"use client";

import { Button, Image, Popconfirm, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Trash2 } from "lucide-react";

import { SliderItem } from "./slider-types";
import AdminDataTable from "../panel-sections/admin-data-table";

type Props = {
    data: SliderItem[];
    loading?: boolean;
    onEdit: (slider: SliderItem) => void;
    onDelete: (slider: SliderItem) => void;
};

export default function SlidersTable({
    data,
    loading,
    onEdit,
    onDelete,
}: Props) {
    const columns: ColumnsType<SliderItem> = [
        {
            title: "شناسه",
            dataIndex: "id",
            key: "id",
            width: 90,
        },
        {
            title: "تصویر",
            dataIndex: "image_url",
            key: "image_url",
            width: 130,
            render: (value: string, record) =>
                value ? (
                    <Image
                        src={value}
                        alt={record.product_name || record.title || "slider"}
                        width={80}
                        height={50}
                        className="rounded-lg object-cover"
                        fallback="data:application/octet-stream;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                    />
                ) : (
                    <Tag color="red">بدون تصویر</Tag>
                ),
        },
        {
            title: "محل نمایش",
            dataIndex: "placement",
            key: "placement",
            width: 150,
            render: (value: string) =>
                value === "PRODUCTS" ? (
                    <Tag color="blue">صفحه محصولات</Tag>
                ) : (
                    <Tag color="purple">صفحه اصلی</Tag>
                ),
        },
        {
            title: "محصول",
            dataIndex: "product_name",
            key: "product_name",
            render: (_: unknown, record: SliderItem) =>
                record.product_name ? (
                    <div className="flex flex-col">
                        <span>{record.product_name}</span>

                        {record.product_id ? (
                            <span className="text-xs text-gray-500">
                                ID: {record.product_id}
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <Tag color="red">بدون محصول</Tag>
                ),
        },
        {
            title: "وضعیت",
            dataIndex: "is_active",
            key: "is_active",
            width: 110,
            render: (value) =>
                value === true || value === 1 ? (
                    <Tag color="green">فعال</Tag>
                ) : (
                    <Tag color="red">غیرفعال</Tag>
                ),
        },
        {
            title: "عملیات",
            key: "actions",
            width: 160,
            render: (_, record) => (
                <Space>
                    <Button icon={<Pencil size={16} />} onClick={() => onEdit(record)}>
                        ویرایش
                    </Button>

                    <Popconfirm
                        title="حذف اسلایدر"
                        description={`از حذف اسلایدر محصول «${record.product_name || record.title || record.id}» مطمئن هستید؟`}
                        okText="بله"
                        cancelText="خیر"
                        onConfirm={() => onDelete(record)}
                    >
                        <Button danger icon={<Trash2 size={16} />}>
                            حذف
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminDataTable<SliderItem>
            columns={columns}
            data={data}
            rowKey={(record) => String(record.id)}
            loading={loading}
            pagination={false}
            locale={{ emptyText: "اسلایدری یافت نشد" }}
            scroll={{ x: 900 }}
        />
    );
}
