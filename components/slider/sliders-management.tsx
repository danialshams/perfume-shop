"use client";

import {
    App,
    Button,
    Drawer,
    Grid,
    Image,
    Modal,
    Space,
    Table,
    Tag,
    Typography,
    Empty,
    Spin,
} from "antd";
import { useEffect, useMemo, useState } from "react";

import MobileSliderCard from "./mobile-slider-card";
import SliderForm from "./slider-form";
import type { SliderFormValues, SliderItem } from "./slider-types";

const { useBreakpoint } = Grid;
const { Title } = Typography;

export default function SlidersManagement() {
    const { message, modal } = App.useApp();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [items, setItems] = useState<SliderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [openForm, setOpenForm] = useState(false);
    const [editingItem, setEditingItem] = useState<SliderItem | null>(null);

    const isEdit = !!editingItem;

    const fetchSliders = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/v1/sliders", {
                method: "GET",
                cache: "no-store",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "خطا در دریافت اسلایدرها");
            }

            setItems(Array.isArray(data?.data) ? data.data : []);
        } catch (error: any) {
            message.error(error?.message || "خطا در دریافت اسلایدرها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const extractErrorMessage = (data: any) => {
        if (data?.errors?.fieldErrors) {
            const fieldErrors = data.errors.fieldErrors;
            const firstField = Object.keys(fieldErrors)[0];
            const firstMessage = fieldErrors?.[firstField]?.[0];

            if (firstMessage) return firstMessage;
        }

        return data?.message || "عملیات ناموفق بود";
    };

    const buildFormData = (values: SliderFormValues) => {
        const formData = new FormData();

        formData.append("product_id", String(values.product_id));
        formData.append("placement", values.placement);
        formData.append("is_active", values.is_active ? "1" : "0");

        return formData;
    };

    const closeForm = () => {
        setOpenForm(false);
        setEditingItem(null);
    };

    const handleCreate = async (values: SliderFormValues) => {
        try {
            setSubmitLoading(true);

            const formData = buildFormData(values);

            const res = await fetch("/api/v1/sliders", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(extractErrorMessage(data));
            }

            message.success("اسلایدر با موفقیت ایجاد شد");
            closeForm();
            await fetchSliders();
        } catch (error: any) {
            message.error(error?.message || "خطا در ایجاد اسلایدر");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleUpdate = async (values: SliderFormValues) => {
        if (!editingItem) return;

        try {
            setSubmitLoading(true);

            const formData = buildFormData(values);

            const res = await fetch(`/api/v1/sliders/${editingItem.id}`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(extractErrorMessage(data));
            }

            message.success("اسلایدر با موفقیت ویرایش شد");
            closeForm();
            await fetchSliders();
        } catch (error: any) {
            message.error(error?.message || "خطا در ویرایش اسلایدر");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (item: SliderItem) => {
        modal.confirm({
            title: "حذف اسلایدر",
            content: `آیا از حذف اسلایدر محصول "${item.product_name || item.title || item.id}" مطمئن هستید؟`,
            okText: "بله، حذف شود",
            cancelText: "انصراف",
            centered: true,
            onOk: async () => {
                try {
                    const res = await fetch(`/api/v1/sliders/${item.id}`, {
                        method: "DELETE",
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data?.message || "خطا در حذف اسلایدر");
                    }

                    message.success("اسلایدر حذف شد");
                    await fetchSliders();
                } catch (error: any) {
                    message.error(error?.message || "خطا در حذف اسلایدر");
                }
            },
        });
    };

    const columns = useMemo(
        () => [
            {
                title: "تصویر",
                dataIndex: "image_url",
                key: "image_url",
                render: (value: string, record: SliderItem) =>
                    value ? (
                        <Image
                            src={value}
                            alt={record.product_name || record.title || "slider"}
                            width={120}
                            height={70}
                            style={{ objectFit: "cover", borderRadius: 8 }}
                            preview={false}
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
                        <span>{record.product_name}</span>
                    ) : (
                        <Tag color="red">بدون محصول</Tag>
                    ),
            },
            {
                title: "وضعیت",
                dataIndex: "is_active",
                key: "is_active",
                render: (value: boolean | number) =>
                    value === true || value === 1 ? (
                        <Tag color="green">فعال</Tag>
                    ) : (
                        <Tag color="red">غیرفعال</Tag>
                    ),
            },
            {
                title: "عملیات",
                key: "actions",
                render: (_: unknown, record: SliderItem) => (
                    <Space>
                        <Button
                            onClick={() => {
                                setEditingItem(record);
                                setOpenForm(true);
                            }}
                        >
                            ویرایش
                        </Button>

                        <Button danger onClick={() => handleDelete(record)}>
                            حذف
                        </Button>
                    </Space>
                ),
            },
        ],
        [handleDelete],
    );

    const formNode = (
        <SliderForm
            loading={submitLoading}
            initialValues={editingItem}
            onCancel={closeForm}
            onSubmit={async (values) => {
                if (editingItem) {
                    await handleUpdate(values);
                } else {
                    await handleCreate(values);
                }
            }}
        />
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <Title level={4} className="!m-0">
                    مدیریت اسلایدرها
                </Title>

                <Button
                    type="primary"
                    onClick={() => {
                        setEditingItem(null);
                        setOpenForm(true);
                    }}
                    className="rounded-xl"
                >
                    افزودن اسلایدر
                </Button>
            </div>

            {isMobile ? (
                loading ? (
                    <div className="flex justify-center py-10">
                        <Spin />
                    </div>
                ) : items.length ? (
                    <div className="grid grid-cols-1 gap-4">
                        {items.map((slider) => (
                            <MobileSliderCard
                                key={slider.id}
                                slider={slider}
                                onEdit={() => {
                                    setEditingItem(slider);
                                    setOpenForm(true);
                                }}
                                onDelete={() => handleDelete(slider)}
                            />
                        ))}
                    </div>
                ) : (
                    <Empty description="اسلایدری یافت نشد" />
                )
            ) : (
                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={items}
                    pagination={false}
                    scroll={{ x: 800 }}
                />
            )}

            {isMobile ? (
                <Modal
                    open={openForm}
                    onCancel={closeForm}
                    footer={null}
                    destroyOnClose
                    title={isEdit ? "ویرایش اسلایدر" : "افزودن اسلایدر"}
                >
                    {formNode}
                </Modal>
            ) : (
                <Drawer
                    open={openForm}
                    onClose={closeForm}
                    destroyOnClose
                    width={520}
                    title={isEdit ? "ویرایش اسلایدر" : "افزودن اسلایدر"}
                    placement="right"
                >
                    {formNode}
                </Drawer>
            )}
        </div>
    );
}
