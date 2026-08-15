"use client";

import { useEffect, useState } from "react";
import { Button, Form, Select, Spin, Switch } from "antd";

import type {
    SliderFormValues,
    SliderItem,
    SliderProductOption,
    SliderPlacement,
} from "./slider-types";

type Props = {
    loading?: boolean;
    initialValues?: SliderItem | null;
    onCancel: () => void;
    onSubmit: (values: SliderFormValues) => Promise<void>;
};

export default function SliderForm({
    loading,
    initialValues,
    onCancel,
    onSubmit,
}: Props) {
    const [form] = Form.useForm<SliderFormValues>();

    const [products, setProducts] = useState<SliderProductOption[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    const isEdit = !!initialValues;
    const placementValue = Form.useWatch("placement", form);

    const fetchProducts = async (
        placement?: SliderPlacement,
        search?: string,
    ) => {
        try {
            setProductsLoading(true);

            const params = new URLSearchParams();

            if (search?.trim()) {
                params.set("search", search.trim());
            }

            if (placement) {
                params.set("exclude_slider_placement", placement);
            }

            if (initialValues?.id) {
                params.set("exclude_slider_except_id", String(initialValues.id));
            }

            const queryString = params.toString();

            const res = await fetch(
                `/api/v1/products/select${queryString ? `?${queryString}` : ""}`,
                {
                    method: "GET",
                    cache: "no-store",
                },
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "خطا در دریافت محصولات");
            }

            setProducts(data?.data || []);
        } catch {
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        form.setFieldsValue({
            product_id: initialValues?.product_id ?? undefined,
            placement: initialValues?.placement ?? "HOME",
            is_active:
                initialValues?.is_active === undefined
                    ? true
                    : initialValues.is_active === true || initialValues.is_active === 1,
        });
    }, [initialValues, form]);

    useEffect(() => {
        const currentPlacement =
            placementValue ||
            initialValues?.placement ||
            ("HOME" as SliderPlacement);

        fetchProducts(currentPlacement);
    }, [placementValue, initialValues?.id, initialValues?.placement]);

    useEffect(() => {
        if (!placementValue) return;

        const currentProductId = form.getFieldValue("product_id");

        if (!currentProductId) return;

        const exists = products.some((item) => item.id === currentProductId);

        if (!exists) {
            form.setFieldValue("product_id", undefined);
        }
    }, [products, placementValue, form]);

    const handleFinish = async (values: SliderFormValues) => {
        await onSubmit(values);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{
                placement: "HOME",
                is_active: true,
            }}
            className="space-y-1"
        >
            <Form.Item
                label="محل نمایش اسلایدر"
                name="placement"
                rules={[{ required: true, message: "محل نمایش الزامی است" }]}
            >
                <Select
                    className="h-11"
                    options={[
                        {
                            label: "صفحه اصلی",
                            value: "HOME",
                        },
                        {
                            label: "صفحه محصولات",
                            value: "PRODUCTS",
                        },
                    ]}
                />
            </Form.Item>

            <Form.Item
                label="محصول"
                name="product_id"
                rules={[{ required: true, message: "انتخاب محصول الزامی است" }]}
            >
                <Select
                    showSearch
                    allowClear
                    placeholder="محصول را انتخاب کنید"
                    loading={productsLoading}
                    filterOption={false}
                    notFoundContent={
                        productsLoading ? <Spin size="small" /> : "محصولی یافت نشد"
                    }
                    onSearch={(value) =>
                        fetchProducts(
                            placementValue || initialValues?.placement || "HOME",
                            value,
                        )
                    }
                    options={products.map((product) => ({
                        label: `${product.name}${product.brand_name ? ` - ${product.brand_name}` : ""}`,
                        value: product.id,
                    }))}
                />
            </Form.Item>

            <Form.Item label="فعال" name="is_active" valuePropName="checked">
                <Switch />
            </Form.Item>

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={onCancel} className="h-11 rounded-xl">
                    انصراف
                </Button>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="h-11 rounded-xl"
                >
                    {isEdit ? "ذخیره تغییرات" : "ایجاد اسلایدر"}
                </Button>
            </div>
        </Form>
    );
}
