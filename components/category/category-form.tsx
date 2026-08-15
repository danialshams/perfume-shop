"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Form,
    Image,
    Input,
    Switch,
    TreeSelect,
    Upload,
    Typography,
} from "antd";
import type { TreeSelectProps, UploadFile, UploadProps } from "antd";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";

import { CategoryFormValues, CategoryItem } from "./category-types";

const { Text } = Typography;

type Props = {
    initialValues?: Partial<CategoryFormValues>;
    categories: CategoryItem[];
    loading?: boolean;
    onSubmit: (values: CategoryFormValues) => Promise<void> | void;
    submitText: string;
    currentCategoryId?: number | null;
};

type CategoryTreeNode = {
    title: string;
    value: number;
    key: number;
    children?: CategoryTreeNode[];
};

function normalizeParentIds(parentIds?: unknown): number[] {
    if (!Array.isArray(parentIds)) return [];

    return [...new Set(parentIds.map(Number))].filter(
        (id) => Number.isInteger(id) && id > 0,
    );
}

function normalizeIsActive(value: unknown): 0 | 1 {
    return value === 0 ? 0 : 1;
}

function buildCategoryTreeOptions(
    categories: CategoryItem[],
    currentCategoryId?: number | null,
): CategoryTreeNode[] {
    const normalizedCurrentId =
        currentCategoryId != null ? Number(currentCategoryId) : null;

    const validCategories = categories.filter(
        (item) => Number(item.id) !== normalizedCurrentId,
    );

    const itemById = new Map<number, CategoryItem>();

    validCategories.forEach((item) => {
        itemById.set(Number(item.id), item);
    });

    const childrenByParentId = new Map<number, CategoryItem[]>();

    validCategories.forEach((item) => {
        const parentIds = normalizeParentIds(item.parent_ids);

        parentIds.forEach((parentId) => {
            if (!itemById.has(parentId)) return;

            const list = childrenByParentId.get(parentId) ?? [];
            const exists = list.some((child) => Number(child.id) === Number(item.id));

            if (!exists) {
                list.push(item);
            }

            childrenByParentId.set(parentId, list);
        });
    });

    const rootItems = validCategories.filter((item) => {
        const parentIds = normalizeParentIds(item.parent_ids);
        return parentIds.length === 0;
    });

    const buildNode = (
        item: CategoryItem,
        visited = new Set<number>(),
    ): CategoryTreeNode => {
        const itemId = Number(item.id);

        if (visited.has(itemId)) {
            return {
                title: item.name,
                value: itemId,
                key: itemId,
            };
        }

        const nextVisited = new Set(visited);
        nextVisited.add(itemId);

        const rawChildren = (childrenByParentId.get(itemId) ?? []).sort((a, b) =>
            a.name.localeCompare(b.name, "fa"),
        );

        const children = rawChildren
            .filter((child) => !nextVisited.has(Number(child.id)))
            .map((child) => buildNode(child, nextVisited));

        return {
            title: item.name,
            value: itemId,
            key: itemId,
            children: children.length > 0 ? children : undefined,
        };
    };

    return rootItems
        .sort((a, b) => a.name.localeCompare(b.name, "fa"))
        .map((item) => buildNode(item));
}

function getFileFromUploadFile(file?: UploadFile): File | null {
    const originFile = file?.originFileObj;

    if (originFile instanceof File) {
        return originFile;
    }

    return null;
}

export default function CategoryForm({
    initialValues,
    categories,
    loading,
    onSubmit,
    submitText,
    currentCategoryId,
}: Props) {
    const [form] = Form.useForm<CategoryFormValues>();

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [removeImage, setRemoveImage] = useState(false);

    const currentImageUrl = initialValues?.image_url?.trim() || "";

    useEffect(() => {
        form.resetFields();

        form.setFieldsValue({
            name: initialValues?.name ?? "",
            parent_ids: normalizeParentIds(initialValues?.parent_ids),
            description: initialValues?.description ?? "",
            is_active: normalizeIsActive(initialValues?.is_active),
        });

        setFileList([]);
        setRemoveImage(false);
    }, [form, initialValues, currentCategoryId]);

    const treeData = useMemo(
        () => buildCategoryTreeOptions(categories, currentCategoryId),
        [categories, currentCategoryId],
    );

    const filterTreeNode: TreeSelectProps["filterTreeNode"] = (
        input,
        treeNode,
    ) => {
        const title =
            typeof treeNode.title === "string"
                ? treeNode.title
                : String(treeNode.title ?? "");

        return title.toLowerCase().includes(input.toLowerCase());
    };

    const uploadProps: UploadProps = {
        accept: "image/jpeg,image/png,image/webp,image/gif",
        maxCount: 1,
        multiple: false,
        fileList,
        beforeUpload: (file) => {
            const isAllowedType = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ].includes(file.type);

            if (!isAllowedType) {
                form.setFields([
                    {
                        name: "image_file",
                        errors: ["فرمت تصویر معتبر نیست. فرمت‌های مجاز: jpg, png, webp, gif"],
                    },
                ]);

                return Upload.LIST_IGNORE;
            }

            const isLessThan5MB = file.size / 1024 / 1024 <= 5;

            if (!isLessThan5MB) {
                form.setFields([
                    {
                        name: "image_file",
                        errors: ["حجم تصویر نباید بیشتر از ۵ مگابایت باشد"],
                    },
                ]);

                return Upload.LIST_IGNORE;
            }

            form.setFields([
                {
                    name: "image_file",
                    errors: [],
                },
            ]);

            /**
             * فایل را آپلود اتوماتیک نکن.
             * فقط داخل state نگه دار تا همراه فرم با FormData ارسال شود.
             */
            return false;
        },
        onChange: ({ fileList: nextFileList }) => {
            setFileList(nextFileList.slice(-1));

            if (nextFileList.length > 0) {
                setRemoveImage(false);
            }
        },
        onRemove: () => {
            setFileList([]);
            return true;
        },
    };

    const handleRemoveCurrentImage = () => {
        setRemoveImage(true);
        setFileList([]);
    };

    const handleUndoRemoveCurrentImage = () => {
        setRemoveImage(false);
    };

    return (
        <Form<CategoryFormValues>
            form={form}
            layout="vertical"
            preserve={false}
            initialValues={{
                name: "",
                parent_ids: [],
                description: "",
                is_active: 1,
            }}
            onFinish={async (values) => {
                const selectedFile = getFileFromUploadFile(fileList[0]);

                const payload: CategoryFormValues = {
                    name: values.name?.trim(),
                    description: values.description?.trim() || "",
                    parent_ids: normalizeParentIds(values.parent_ids).filter(
                        (id) => id !== Number(currentCategoryId),
                    ),
                    is_active: values.is_active === 0 ? 0 : 1,

                    /**
                     * فایل تصویر جدید
                     */
                    image_file: selectedFile,

                    /**
                     * حذف تصویر فعلی
                     */
                    remove_image: removeImage,
                };

                await onSubmit(payload);
            }}
        >
            <div className="space-y-4">
                <Form.Item
                    label="نام دسته‌بندی"
                    name="name"
                    rules={[
                        { required: true, message: "نام دسته‌بندی الزامی است" },
                        { min: 2, message: "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد" },
                    ]}
                >
                    <Input size="large" placeholder="مثلاً عطر مردانه" />
                </Form.Item>

                <Form.Item
                    label="دسته‌های والد"
                    name="parent_ids"
                    extra="ابتدا دسته‌های بدون والد نمایش داده می‌شوند و می‌توانید از ساختار درختی، والد مناسب را انتخاب کنید."
                >
                    <TreeSelect
                        treeData={treeData}
                        multiple
                        allowClear
                        showSearch
                        size="large"
                        placeholder="انتخاب دسته‌های والد"
                        treeDefaultExpandAll={false}
                        treeNodeFilterProp="title"
                        filterTreeNode={filterTreeNode}
                        maxTagCount="responsive"
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item label="توضیحات" name="description">
                    <Input.TextArea rows={4} placeholder="توضیحات دسته‌بندی" />
                </Form.Item>

                <Form.Item
                    label="تصویر دسته‌بندی"
                    name="image_file"
                    extra="فرمت‌های مجاز: jpg, png, webp, gif — حداکثر حجم: ۵ مگابایت"
                >
                    <div className="space-y-3">
                        {currentImageUrl && !removeImage && fileList.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 p-3">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <Text type="secondary">تصویر فعلی دسته‌بندی</Text>

                                    <Button
                                        danger
                                        type="default"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={handleRemoveCurrentImage}
                                    >
                                        حذف تصویر
                                    </Button>
                                </div>

                                <Image
                                    src={currentImageUrl}
                                    alt="تصویر دسته‌بندی"
                                    width={140}
                                    height={140}
                                    className="rounded-lg object-cover"
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: 12,
                                    }}
                                />
                            </div>
                        ) : null}

                        {currentImageUrl && removeImage ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Text type="danger">
                                        تصویر فعلی بعد از ذخیره تغییرات حذف می‌شود.
                                    </Text>

                                    <Button size="small" onClick={handleUndoRemoveCurrentImage}>
                                        لغو حذف
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>

                            <p className="ant-upload-text">
                                برای انتخاب تصویر کلیک کنید یا فایل را اینجا بکشید
                            </p>

                            <p className="ant-upload-hint">
                                در صورت انتخاب تصویر جدید، تصویر قبلی هنگام ذخیره جایگزین می‌شود.
                            </p>
                        </Upload.Dragger>
                    </div>
                </Form.Item>

                <Form.Item
                    label="فعال"
                    name="is_active"
                    valuePropName="checked"
                    getValueProps={(value) => ({
                        checked: value === 1 || value === true,
                    })}
                    normalize={(checked) => (checked ? 1 : 0)}
                >
                    <Switch />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                >
                    {submitText}
                </Button>
            </div>
        </Form>
    );
}
