// components/CategorySelector.tsx
"use client";
import { Form, Select } from "antd";

type CategoryOption = { label: string; value: number };

interface Props {
  parentOptions: CategoryOption[];
  childOptions: CategoryOption[];
  selectedParentId: number | null;
  onParentChange: (value: number | null) => void;
  loading?: boolean;
}

export default function CategorySelector({
  parentOptions,
  childOptions,
  selectedParentId,
  onParentChange,
  loading = false,
}: Props) {
  const form = Form.useFormInstance();

  return (
    <>
      <Form.Item
        label="دسته اصلی"
        name="parent_category_id"
        rules={[{ required: true, message: "انتخاب دسته اصلی الزامی است" }]}
      >
        <Select
          size="large"
          showSearch
          allowClear
          loading={loading}
          placeholder="انتخاب دسته اصلی"
          options={parentOptions}
          value={selectedParentId ?? undefined}
          onChange={(value) => {
            const nextParentId = value ? Number(value) : null;
            onParentChange(nextParentId);
            form.setFieldValue("parent_category_id", nextParentId ?? undefined);
            form.setFieldValue("category_id", undefined);
          }}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          notFoundContent={loading ? "در حال دریافت..." : "دسته‌ای یافت نشد"}
        />
      </Form.Item>

      <Form.Item
        label="زیر دسته"
        name="category_id"
        rules={[{ required: true, message: "انتخاب زیر دسته الزامی است" }]}
      >
        <Select
          size="large"
          showSearch
          allowClear
          placeholder={selectedParentId ? "انتخاب زیر دسته" : "ابتدا دسته اصلی را انتخاب کنید"}
          disabled={!selectedParentId}
          options={childOptions}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          notFoundContent={
            selectedParentId
              ? "زیردسته‌ای برای این دسته اصلی یافت نشد"
              : "ابتدا دسته اصلی را انتخاب کنید"
          }
        />
      </Form.Item>
    </>
  );
}