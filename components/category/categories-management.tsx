"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Button } from "antd";
import { Plus } from "lucide-react";

import { CategoryFormValues, CategoryItem } from "./category-types";
import CategoriesTable from "./categories-table";
import CategoryForm from "./category-form";
import MobileCategoryCard from "./mobile-category-card";
import AdminDrawer from "../panel-sections/admin-drawer";
import AdminEmptyState from "../panel-sections/admin-empty-state";
import AdminLoading from "../panel-sections/admin-loading";
import AdminPageHeader from "../panel-sections/admin-page-header";

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

function normalizeParentIds(parentIds?: number[]) {
    if (!Array.isArray(parentIds)) return [];

    return [...new Set(parentIds.map(Number))].filter(
        (id) => Number.isInteger(id) && id > 0,
    );
}

function normalizeFormValues(values: CategoryFormValues): CategoryFormValues {
    return {
        name: values.name?.trim(),
        parent_ids: normalizeParentIds(values.parent_ids),
        description: values.description?.trim() || "",
        is_active: values.is_active === 0 ? 0 : 1,
        image_file: values.image_file ?? null,
        remove_image: values.remove_image === true,
    };
}

function buildCategoryFormData(values: CategoryFormValues) {
    const payload = normalizeFormValues(values);

    const formData = new FormData();

    if (payload.name !== undefined) {
        formData.append("name", payload.name);
    }

    formData.append("description", payload.description ?? "");
    formData.append("is_active", String(payload.is_active ?? 1));
    formData.append("parent_ids", JSON.stringify(payload.parent_ids ?? []));

    /**
     * تصویر جدید
     * route سمت سرور این فیلد را با نام image دریافت می‌کند.
     */
    if (payload.image_file) {
        formData.append("image", payload.image_file);
    }

    /**
     * حذف تصویر فعلی در ویرایش
     * اگر تصویر جدید انتخاب شده باشد، نیازی به remove_image نیست.
     */
    if (!payload.image_file && payload.remove_image) {
        formData.append("remove_image", "1");
    }

    return formData;
}

export default function CategoriesManagement() {
    const { message, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [items, setItems] = useState<CategoryItem[]>([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [editItem, setEditItem] = useState<CategoryItem | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/v1/categories", {
                cache: "no-store",
            });

            const json: ApiResponse<CategoryItem[]> = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "خطا در دریافت دسته‌بندی‌ها");
            }

            setItems(Array.isArray(json.data) ? json.data : []);
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "دریافت دسته‌بندی‌ها ناموفق بود",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const parentOptions = useMemo(() => items, [items]);

    const openCreateDrawer = () => {
        setEditItem(null);
        setCreateOpen(true);
    };

    const closeCreateDrawer = () => {
        if (submitting) return;
        setCreateOpen(false);
    };

    const openEditDrawer = (category: CategoryItem) => {
        setCreateOpen(false);
        setEditItem(category);
    };

    const closeEditDrawer = () => {
        if (submitting) return;
        setEditItem(null);
    };

    const handleCreate = async (values: CategoryFormValues) => {
        try {
            setSubmitting(true);

            const formData = buildCategoryFormData(values);

            const res = await fetch("/api/v1/categories", {
                method: "POST",
                body: formData,

                /**
                 * نکته مهم:
                 * برای FormData نباید Content-Type بگذاری.
                 * مرورگر خودش multipart boundary را تنظیم می‌کند.
                 */
            });

            const json: ApiResponse<CategoryItem> = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "ایجاد دسته‌بندی ناموفق بود");
            }

            message.success("دسته‌بندی با موفقیت ایجاد شد");
            setCreateOpen(false);
            await fetchCategories();
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "ایجاد دسته‌بندی ناموفق بود",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (values: CategoryFormValues) => {
        if (!editItem) return;

        try {
            setSubmitting(true);

            const formData = buildCategoryFormData(values);

            const res = await fetch(`/api/v1/categories/${editItem.id}`, {
                method: "PATCH",
                body: formData,

                /**
                 * برای FormData نباید Content-Type بگذاری.
                 */
            });

            const json: ApiResponse<CategoryItem> = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "ویرایش دسته‌بندی ناموفق بود");
            }

            message.success("دسته‌بندی با موفقیت ویرایش شد");
            setEditItem(null);
            await fetchCategories();
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "ویرایش دسته‌بندی ناموفق بود",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (category: CategoryItem) => {
        modal.confirm({
            title: "حذف دسته‌بندی",
            content: `آیا از حذف «${category.name}» مطمئن هستید؟`,
            okText: "حذف",
            cancelText: "انصراف",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await fetch(`/api/v1/categories/${category.id}`, {
                        method: "DELETE",
                    });

                    const json: ApiResponse<{ success: boolean }> = await res.json();

                    if (!res.ok || !json.success) {
                        throw new Error(json.message || "حذف دسته‌بندی ناموفق بود");
                    }

                    message.success("دسته‌بندی با موفقیت حذف شد");
                    await fetchCategories();
                } catch (error) {
                    message.error(
                        error instanceof Error ? error.message : "حذف دسته‌بندی ناموفق بود",
                    );
                }
            },
        });
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="مدیریت دسته‌بندی‌ها"
                subtitle="ایجاد، ویرایش و حذف دسته‌بندی‌های محصولات"
                actions={
                    <Button
                        type="primary"
                        size="large"
                        icon={<Plus size={18} />}
                        onClick={openCreateDrawer}
                    >
                        افزودن دسته‌بندی
                    </Button>
                }
            />

            {loading ? (
                <AdminLoading text="در حال دریافت دسته‌بندی‌ها..." />
            ) : items.length === 0 ? (
                <AdminEmptyState
                    title="دسته‌بندی‌ای ثبت نشده"
                    description="برای شروع، یک دسته‌بندی جدید ایجاد کنید."
                />
            ) : (
                <>
                    <div className="grid gap-4 md:hidden">
                        {items.map((item) => (
                            <MobileCategoryCard
                                key={item.id}
                                category={item}
                                onEdit={() => openEditDrawer(item)}
                                onDelete={() => handleDelete(item)}
                            />
                        ))}
                    </div>

                    <div className="hidden md:block">
                        <CategoriesTable
                            data={items}
                            loading={loading}
                            onEdit={openEditDrawer}
                            onDelete={handleDelete}
                        />
                    </div>
                </>
            )}

            <AdminDrawer
                open={createOpen}
                title="ایجاد دسته‌بندی"
                onClose={closeCreateDrawer}
            >
                <CategoryForm
                    key={createOpen ? "create-open" : "create-closed"}
                    categories={parentOptions}
                    loading={submitting}
                    submitText="ایجاد دسته‌بندی"
                    initialValues={{
                        name: "",
                        parent_ids: [],
                        description: "",
                        image_url: "",
                        image_file: null,
                        remove_image: false,
                        is_active: 1,
                    }}
                    onSubmit={handleCreate}
                />
            </AdminDrawer>

            <AdminDrawer
                open={!!editItem}
                title={`ویرایش دسته‌بندی${editItem ? `: ${editItem.name}` : ""}`}
                onClose={closeEditDrawer}
            >
                {editItem ? (
                    <CategoryForm
                        key={`edit-${editItem.id}`}
                        currentCategoryId={editItem.id}
                        categories={parentOptions}
                        loading={submitting}
                        submitText="ذخیره تغییرات"
                        initialValues={{
                            name: editItem.name,
                            parent_ids: normalizeParentIds(editItem.parent_ids),
                            description: editItem.description ?? "",
                            image_url: editItem.image_url ?? "",
                            image_file: null,
                            remove_image: false,
                            is_active:
                                editItem.is_active === true || editItem.is_active === 1 ? 1 : 0,
                        }}
                        onSubmit={handleUpdate}
                    />
                ) : null}
            </AdminDrawer>
        </div>
    );
}
