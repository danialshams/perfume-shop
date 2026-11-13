"use client";

import type {Category, ScentFamily} from "@/lib/product";
import {Form, Input, Select, Switch} from "antd";
import {useMemo} from "react";

type Props = {
  categories?: Category[];
  scentFamilies?: ScentFamily[];
};

/** Minimal product fields matching Fertini's live storefront. */
export default function ProductBasicInfoFields({categories = [], scentFamilies = []}: Props) {
  const form = Form.useFormInstance();
  const parentId = Form.useWatch("parent_category_id", form);
  const mode = Form.useWatch("scent_family_mode", form) ?? "EXISTING";

  const parents = useMemo(() =>
    categories.filter(c => Array.isArray(c.parent_ids) && c.parent_ids.length === 0)
      .map(c => ({value:Number(c.id), label:c.name})), [categories]);
  const children = useMemo(() =>
    categories.filter(c => Array.isArray(c.parent_ids) && c.parent_ids.some(id => Number(id) === Number(parentId)))
      .map(c => ({value:Number(c.id), label:c.name})), [categories, parentId]);
  const families = useMemo(() =>
    scentFamilies.filter(f => f.is_active === undefined || f.is_active === null || Boolean(f.is_active))
      .map(f => ({value:Number(f.id), label:f.name})), [scentFamilies]);

  return <section className="fst-product-section" aria-label="مشخصات اصلی محصول">
    <div className="fst-product-section-title">
      <span className="fst-product-step">۱</span>
      <div><h3>اطلاعات محصول</h3><p>نام، دسته و گروه بویایی را انتخاب کنید.</p></div>
    </div>
    <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
      <Form.Item name="name" label="نام عطر" className="md:col-span-2"
        rules={[{required:true,message:"نام عطر را وارد کنید"},{min:2,message:"نام باید حداقل دو حرف داشته باشد"}]}>
        <Input size="large" placeholder="مثلاً فرتینی نوآر" autoComplete="off"/>
      </Form.Item>

      <Form.Item name="parent_category_id" label="دسته‌بندی اصلی">
        <Select size="large" allowClear showSearch optionFilterProp="label"
          placeholder="انتخاب دسته اصلی" options={parents}
          onChange={() => form.setFieldValue("category_id", undefined)}/>
      </Form.Item>
      <Form.Item name="category_id" label="زیردسته">
        <Select size="large" allowClear showSearch optionFilterProp="label"
          placeholder={parentId ? "انتخاب زیردسته" : "ابتدا دسته اصلی را انتخاب کنید"}
          disabled={!parentId} options={children}/>
      </Form.Item>

      <Form.Item name="scent_family_mode" label="گروه بویایی" initialValue="EXISTING" className="md:col-span-2">
        <Select size="large" options={[
          {value:"EXISTING",label:"انتخاب گروه بویایی موجود"},
          {value:"NEW",label:"ایجاد گروه بویایی جدید"},
        ]} onChange={mode => {
          if(mode === "EXISTING") form.setFieldValue("new_scent_family", undefined);
          else form.setFieldValue("scent_family_id", undefined);
        }}/>
      </Form.Item>
      {mode === "EXISTING" ?
        <Form.Item name="scent_family_id" className="md:col-span-2" label="رایحه محصول"
          rules={[{required:true,message:"گروه بویایی را انتخاب کنید"}]}>
          <Select size="large" showSearch optionFilterProp="label" options={families}
            placeholder={families.length ? "گروه بویایی را انتخاب کنید" : "ابتدا گروه بویایی جدید بسازید"}/>
        </Form.Item>
        :
        <Form.Item name={["new_scent_family","name"]} className="md:col-span-2"
          label="نام گروه بویایی جدید"
          rules={[{required:true,message:"نام گروه بویایی را وارد کنید"},{min:2,message:"نام حداقل دو حرف داشته باشد"}]}>
          <Input size="large" placeholder="مثلاً چوبی، مرکباتی یا گلی"/>
        </Form.Item>
      }
      <p className="fst-product-hint md:col-span-2">
        تصویر کارت‌های رایحه در بخش «مدیریت صفحه اصلی» تنظیم می‌شود؛
        برای گروه بویایی محصول نیازی به آپلود تصویر نیست.
      </p>

      <Form.Item name="description" label="توضیحات محصول" className="md:col-span-2">
        <Input.TextArea rows={4} placeholder="رایحه، حس و ویژگی‌های عطر را به زبان ساده توصیف کنید." showCount maxLength={5000}/>
      </Form.Item>

      <Form.Item name="status" label="وضعیت انتشار" className="md:col-span-2">
        <Select size="large" options={[
          {label:"پیش‌نویس (فعلاً نمایش داده نشود)",value:"DRAFT"},
          {label:"منتشرشده در فروشگاه",value:"ACTIVE"},
          {label:"غیرفعال",value:"INACTIVE"},
        ]}/>
      </Form.Item>

      <div className="md:col-span-2 fst-product-options">
        <Form.Item name="is_featured" valuePropName="checked" label="محصول ویژه">
          <Switch/>
        </Form.Item>
        <Form.Item name="is_best_seller" valuePropName="checked" label="پرفروش">
          <Switch/>
        </Form.Item>
      </div>
    </div>
  </section>;
}
