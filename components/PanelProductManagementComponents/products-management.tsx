"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Segmented } from "antd";
import { Plus, RefreshCcw } from "lucide-react";
import ProductsFilters from "./products-filters";
import ProductDetailsModal from "./product-details-modal";
import { getProducts } from "./product-api";
import { getProductColumns } from "./product-columns";
import MobileProductCard from "./mobile-product-card";
import CreateProductDrawer from "./create-product-drawer";
import EditProductDrawer from "./edit-product-drawer";
import AdminEmptyState from "../panel-sections/admin-empty-state";
import AdminLoading from "../panel-sections/admin-loading";
import AdminPageHeader from "../panel-sections/admin-page-header";
import {
    ProductQueryParams,
    ProductsResponse,
    ProductItem,
} from "@/lib/product";
import AdminDataTable from "../panel-sections/admin-data-table";

const DEFAULT_FILTERS: ProductQueryParams = {
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    is_active: undefined,
    is_featured: undefined,
};

type CategoryOption = {
    id: number | string;
    name: string;
    slug?: string;
    is_active?: boolean | number;
    parent_ids?: Array<number | string>;
    parent_names?: string[];
    has_children?: boolean;
};

export default function ProductsManagement() {
    const { message } = App.useApp();

    const [filters, setFilters] =
        useState<ProductQueryParams>(DEFAULT_FILTERS);

    const [appliedFilters, setAppliedFilters] =
        useState<ProductQueryParams>(DEFAULT_FILTERS);

    const [createOpen, setCreateOpen] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);

    const [data, setData] = useState<ProductsResponse["data"]>({
        items: [],
        meta: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
        },
    });

    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<CategoryOption[]>([]);

    const [selectedProduct, setSelectedProduct] =
        useState<ProductItem | null>(null);

    const [detailsOpen, setDetailsOpen] = useState(false);

    const [mobileView, setMobileView] =
        useState<"cards" | "table">("cards");

    const normalizeArrayResponse = useCallback((result: any) => {
        if (Array.isArray(result)) return result;
        if (Array.isArray(result?.data)) return result.data;
        if (Array.isArray(result?.items)) return result.items;
        return [];
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/categories", {
                method: "GET",
                cache: "no-store",
            });

            const result = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(result?.message || "دریافت دسته‌بندی‌ها با خطا مواجه شد");
            }

            const normalizedCategories: CategoryOption[] =
                normalizeArrayResponse(result);

            setCategories(normalizedCategories);
        } catch (error) {
            console.error(error);
            message.error("دریافت دسته‌بندی‌ها با خطا مواجه شد");
            setCategories([]);
        }
    }, [message, normalizeArrayResponse]);

    const fetchData = useCallback(
        async (params: ProductQueryParams) => {
            try {
                setLoading(true);

                const result = await getProducts(params);

                setData(result);
            } catch (error) {
                console.error(error);
                message.error("دریافت محصولات با خطا مواجه شد");
            } finally {
                setLoading(false);
            }
        },
        [message],
    );

    useEffect(() => {
        fetchData(appliedFilters);
    }, [appliedFilters, fetchData]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const openDetailsModal = useCallback((product: ProductItem) => {
        setSelectedProduct(product);
        setDetailsOpen(true);
    }, []);

    const closeDetailsModal = useCallback(() => {
        setDetailsOpen(false);
        setSelectedProduct(null);
    }, []);

    const openEditDrawer = useCallback((product: ProductItem) => {
        setEditingProductId(Number(product.id));
        setEditOpen(true);
    }, []);

    // Deep link from media library opens the existing full editor (images, variants and voice).
    useEffect(() => {
      const id=Number(new URLSearchParams(window.location.search).get("editProduct"));
      if(Number.isSafeInteger(id)&&id>0){
        setEditingProductId(id);
        setEditOpen(true);
      }
    }, []);

    const closeEditDrawer = useCallback(() => {
        setEditOpen(false);
        setEditingProductId(null);
    }, []);

    const handleRefresh = () => {
        fetchData(appliedFilters);
        fetchCategories();
    };

    const handleSearch = () => {
        setAppliedFilters({
            ...filters,
            page: 1,
        });
    };

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
    };

    const handlePageChange = (page: number, pageSize: number) => {
        const nextFilters: ProductQueryParams = {
            ...appliedFilters,
            page,
            limit: pageSize,
        };

        setFilters(nextFilters);
        setAppliedFilters(nextFilters);
    };

    const handleDelete = useCallback(
        async (product: ProductItem) => {
            try {
                const res = await fetch(`/api/v1/products/${product.id}`, {
                    method: "DELETE",
                });

                const result = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(result?.message || "حذف محصول انجام نشد");
                }

                message.success("محصول با موفقیت حذف شد");

                setData((prev) => ({
                    ...prev,
                    items: prev.items.map((item) =>
                        item.id === product.id
                            ? {
                                  ...item,
                                  deleted_at: new Date().toISOString(),
                              }
                            : item,
                    ),
                }));
            } catch (error: any) {
                console.error(error);
                message.error(error?.message || "حذف محصول انجام نشد");
            }
        },
        [message],
    );

    const handleRestore = useCallback(
        async (product: ProductItem) => {
            try {
                const res = await fetch(`/api/v1/products/${product.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ action: "restore" }),
                });

                const result = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(result?.message || "بازیابی محصول انجام نشد");
                }

                message.success("محصول با موفقیت بازیابی شد");

                setData((prev) => ({
                    ...prev,
                    items: prev.items.map((item) =>
                        item.id === product.id
                            ? {
                                  ...item,
                                  deleted_at: null,
                              }
                            : item,
                    ),
                }));
            } catch (error: any) {
                console.error(error);
                message.error(error?.message || "بازیابی محصول انجام نشد");
            }
        },
        [message],
    );

    const columns = useMemo(
        () =>
            getProductColumns({
                onView: openDetailsModal,

                onEdit: (product) => {
                    openEditDrawer(product);
                },

                onImages: openEditDrawer,
                onVariants: openEditDrawer,

                onDelete: handleDelete,
                onRestore: handleRestore,
            }),
        [openDetailsModal, openEditDrawer, handleDelete, handleRestore],
    );

    return (
        <div className="space-y-5">
            <AdminPageHeader
                title="مدیریت محصولات"
                subtitle="مشاهده، بررسی، فیلتر و مدیریت کامل محصولات، تصاویر و واریانت‌ها"
                actions={
                    <>
                        <Button
                            size="large"
                            icon={<RefreshCcw size={16} />}
                            onClick={handleRefresh}
                        >
                            بروزرسانی
                        </Button>

                        <Button
                            type="primary"
                            size="large"
                            icon={<Plus size={16} />}
                            onClick={() => setCreateOpen(true)}
                        >
                            افزودن محصول
                        </Button>
                    </>
                }
            />

            <div className="md:hidden">
                <Segmented
                    block
                    value={mobileView}
                    onChange={(value) => setMobileView(value as "cards" | "table")}
                    options={[
                        {
                            label: "نمای کارت",
                            value: "cards",
                        },
                        {
                            label: "نمای جدول",
                            value: "table",
                        },
                    ]}
                />
            </div>

            <ProductsFilters
                filters={filters}
                onChange={setFilters}
                onSearch={handleSearch}
                onReset={handleReset}
            />

            {loading ? (
                <AdminLoading text="در حال دریافت محصولات..." />
            ) : !data.items.length ? (
                <AdminEmptyState
                    title="محصولی پیدا نشد"
                    description="فیلترها را تغییر بده یا محصول جدید ثبت کن."
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <AdminDataTable<ProductItem>
                            columns={columns}
                            data={data.items}
                            rowKey={(record) => String(record.id)}
                            loading={loading}
                            scroll={{ x: 1800 }}
                            pagination={{
                                current: data.meta.page,
                                pageSize: data.meta.limit,
                                total: data.meta.total,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50", "100"],
                                onChange: handlePageChange,
                                showTotal: (total, range) =>
                                    `${range[0]} - ${range[1]} از ${total} مورد`,
                            }}
                        />
                    </div>

                    <div className="md:hidden">
                        {mobileView === "cards" ? (
                            <div className="grid grid-cols-1 gap-4">
                                {data.items.map((product) => (
                                    <MobileProductCard
                                        key={product.id}
                                        product={product}
                                        onView={() => openDetailsModal(product)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <AdminDataTable<ProductItem>
                                columns={columns}
                                data={data.items}
                                rowKey={(record) => String(record.id)}
                                loading={loading}
                                scroll={{ x: 1500 }}
                                pagination={{
                                    current: data.meta.page,
                                    pageSize: data.meta.limit,
                                    total: data.meta.total,
                                    showSizeChanger: true,
                                    pageSizeOptions: ["10", "20", "50", "100"],
                                    onChange: handlePageChange,
                                    showTotal: (total, range) =>
                                        `${range[0]} - ${range[1]} از ${total} مورد`,
                                }}
                            />
                        )}
                    </div>
                </>
            )}

            <ProductDetailsModal
                open={detailsOpen}
                product={selectedProduct}
                categories={categories}
                onClose={closeDetailsModal}
            />

            <CreateProductDrawer
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                categories={categories}
                onSuccess={() => {
                    fetchData(appliedFilters);
                    fetchCategories();
                }}
            />

            <EditProductDrawer
                open={editOpen}
                productId={editingProductId}
                onClose={closeEditDrawer}
                onSuccess={() => {
                    fetchData(appliedFilters);
                    fetchCategories();
                }}
            />
        </div>
    );
}
