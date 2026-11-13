"use client";

import { createProduct, uploadProductImage } from "@/lib/api";
import { getScentFamilies } from "@/lib/product";
import type { ScentFamily } from "@/lib/product";
import { toSlug } from "@/lib/utils";
import { App, Button, Drawer, Form, Radio } from "antd";
import { useEffect, useState } from "react";
import ProductBasicInfoFields from "./ProductBasicInfoFields";
import ProductImagesList from "./ProductImagesList";
import ProductVariantsList from "./ProductVariantsList";
import VoiceUploader from "./VoiceUploader";
import {validateMediaMeta} from "@/lib/admin-media-validation";

type ProductType = "SINGLE" | "GROUPED";

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    categories: any[];
};

export default function CreateProductDrawer({
    open,
    onClose,
    onSuccess,
    categories,
}: Props) {
    const [form] = Form.useForm();
    const {message}=App.useApp();
    const [mediaUploads,setMediaUploads]=useState(0);
    const markMediaUpload=(busy:boolean)=>setMediaUploads(value=>Math.max(0,value+(busy?1:-1)));

    const [selectedType, setSelectedType] = useState<ProductType>("SINGLE");
    const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);

    const [scentFamilies, setScentFamilies] = useState<ScentFamily[]>([]);
    const [loadingScentFamilies, setLoadingScentFamilies] = useState(false);

    useEffect(() => {
        if (!open) {
            form.resetFields();
            setSelectedType("SINGLE");
            setUploadingMap({});
            setSubmitting(false);
            setMediaUploads(0);
            setScentFamilies([]);
            setLoadingScentFamilies(false);
        }
    }, [open, form]);

    useEffect(() => {
        if (!open) return;

        let ignore = false;

        async function loadScentFamilies() {
            setLoadingScentFamilies(true);

            try {
                const data = await getScentFamilies();

                if (!ignore) {
                    setScentFamilies(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to load scent families:", error);

                if (!ignore) {
                    setScentFamilies([]);
                }
            } finally {
                if (!ignore) {
                    setLoadingScentFamilies(false);
                }
            }
        }

        loadScentFamilies();

        return () => {
            ignore = true;
        };
    }, [open]);

    const isUploading = (key: string) => Boolean(uploadingMap[key]);

    const setImageUploading = (key: string, value: boolean) => {
        setUploadingMap((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const validateBeforeUpload=(file:File)=>{const x=validateMediaMeta(file,"image");if(!x.ok)throw Error(x.error);return true};
    const validateVoiceBeforeUpload=(file:File)=>{const x=validateMediaMeta(file,"voice");if(!x.ok)throw Error(x.error);return true};

    const normalizeVariants = (variants: any[], type: ProductType) => {
        if (type === "SINGLE") {
            const firstVariant =
                Array.isArray(variants) && variants.length > 0
                    ? variants[0]
                    : {};

            return [
                {
                    volume_ml:
                        firstVariant?.volume_ml === "" ||
                            firstVariant?.volume_ml === undefined ||
                            firstVariant?.volume_ml === null
                            ? null
                            : Number(firstVariant.volume_ml),

                    price: Number(firstVariant?.price ?? 0),

                    discount_price:
                        firstVariant?.discount_price === "" ||
                            firstVariant?.discount_price === undefined ||
                            firstVariant?.discount_price === null
                            ? null
                            : Number(firstVariant.discount_price),

                    stock_qty: Number(firstVariant?.stock_qty ?? 0),

                    is_active:
                        firstVariant?.is_active === undefined
                            ? true
                            : Boolean(firstVariant.is_active),

                    images: [],
                },
            ];
        }

        return Array.isArray(variants)
            ? variants.map((variant: any) => ({
                volume_ml:
                    variant?.volume_ml === "" ||
                        variant?.volume_ml === undefined ||
                        variant?.volume_ml === null
                        ? null
                        : Number(variant.volume_ml),

                price: Number(variant?.price ?? 0),

                discount_price:
                    variant?.discount_price === "" ||
                        variant?.discount_price === undefined ||
                        variant?.discount_price === null
                        ? null
                        : Number(variant.discount_price),

                stock_qty: Number(variant?.stock_qty ?? 0),

                is_active:
                    variant?.is_active === undefined
                        ? true
                        : Boolean(variant.is_active),

                images: Array.isArray(variant?.images)
                    ? variant.images.filter((image: any) => image?.image_url)
                    : [],
            }))
            : [];
    };

    const buildInitialVariants = (type: ProductType) => {
        if (type === "SINGLE") {
            return [
                {
                    volume_ml: 100,
                    price: 0,
                    discount_price: null,
                    stock_qty: 0,
                    is_active: true,
                    images: [],
                },
            ];
        }

        return [
            {
                volume_ml: 100,
                price: 0,
                discount_price: null,
                stock_qty: 0,
                is_active: true,
                images: [
                    {
                        image_url: "",
                        is_main: true,
                    },
                ],
            },
        ];
    };

    const handleSelectType = (type: ProductType) => {
        setSelectedType(type);

        form.setFieldsValue({
            type,
            status: "DRAFT",
            is_active: true,
            is_featured: false,
            is_best_seller: false,

            scent_family_mode: "EXISTING",
            scent_family_id: undefined,
            new_scent_family: undefined,

            images: [
                {
                    image_url: "",
                    is_main: true,
                },
            ],

            variants: buildInitialVariants(type),
        });
    };

    const handleSubmit = async () => {
                if(mediaUploads>0){message.warning("ابتدا منتظر پایان آپلود تصاویر و وویس بمانید.");return;}
        const values=await form.validateFields().catch(()=>null);
        if(!values)return;

        setSubmitting(true);

        try {
            const categoryLinks =
                values.parent_category_id && values.category_id
                    ? [
                        {
                            parent_id: Number(values.parent_category_id),
                            child_id: Number(values.category_id),
                        },
                    ]
                    : [];

            const {
                scent_family_mode,
                scent_family_id,
                new_scent_family,
                ...restValues
            } = values;

            const payload = {
                ...restValues,

                type: selectedType,
                slug: toSlug(values.name || ""),

                category_id: values.category_id ?? null,
                parent_category_id: values.parent_category_id ?? null,
                category_links: categoryLinks,

                scent_family_id:
                    scent_family_mode === "EXISTING"
                        ? scent_family_id
                            ? Number(scent_family_id)
                            : null
                        : null,

                new_scent_family:
                    scent_family_mode === "NEW"
                        ? {
                            name: String(
                                new_scent_family?.name ?? "",
                            ).trim(),
                            image_url: String(
                                new_scent_family?.image_url ?? "",
                            ).trim(),
                        }
                        : undefined,

                images: Array.isArray(values.images)
                    ? values.images.filter((item: any) => item?.image_url)
                    : [],

                variants: normalizeVariants(
                    values.variants || [],
                    selectedType,
                ),
            };
          
            await createProduct(payload);

            form.resetFields();
            setSelectedType("SINGLE");

            onSuccess?.();
            onClose();
        } catch(error) {
            message.error(error instanceof Error?error.message:"ثبت محصول انجام نشد. اتصال دیتابیس و فایل‌ها را بررسی کنید.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            rootClassName="fst-product-drawer"
            open={open}
            onClose={onClose}
            title="ایجاد محصول"
            width="min(100vw, 1000px)"
            destroyOnClose
            maskClosable={mediaUploads===0}
            placement="left"
        >
            <Form form={form} layout="vertical" className="fst-product-form"
              initialValues={{
                type:"SINGLE",status:"DRAFT",is_active:true,
                is_featured:false,is_best_seller:false,scent_family_mode:"EXISTING",
                images:[{image_url:"",is_main:true}],
                variants:[{volume_ml:100,price:0,discount_price:null,stock_qty:0,is_active:true,images:[]}],
              }}>
                <div className="fst-product-type-choice">
                  <span>نوع محصول</span>
                  <Radio.Group optionType="button" buttonStyle="solid"
                    value={selectedType} onChange={e=>handleSelectType(e.target.value)}>
                    <Radio.Button value="SINGLE">عطر تکی</Radio.Button>
                    <Radio.Button value="GROUPED">چند حجم / مدل</Radio.Button>
                  </Radio.Group>
                  <small>{selectedType==="SINGLE"?"برای یک حجم یا مدل":"برای عطرهای دارای چند حجم یا قیمت متفاوت"}</small>
                </div>
                    <ProductBasicInfoFields
                        categories={categories}
                        scentFamilies={scentFamilies}
                    />

                    {loadingScentFamilies ? (
                        <div className="mb-4 text-xs text-neutral-500">
                            در حال دریافت گروه‌های بویایی...
                        </div>
                    ) : null}

                    <section className="fst-product-section" aria-label="عکس و صدای محصول">
                        <div className="fst-product-section-title"><span className="fst-product-step">۲</span><div><h3>عکس و معرفی صوتی</h3><p>عکس اصلی و در صورت نیاز فایل صوتی را اضافه کنید.</p></div></div>
                        <ProductImagesList form={form} validateBeforeUpload={validateBeforeUpload} onUploadingChange={markMediaUpload}/>
                        <div className="my-5 border-t border-[#e8e1d9]"/>
                        <VoiceUploader form={form} validateBeforeUpload={validateVoiceBeforeUpload} onUploadingChange={markMediaUpload}/>
                        {mediaUploads>0?<p role="status" className="mt-4 text-xs text-amber-800">آپلود فایل در جریان است؛ تا پایان آن محصول را ثبت نکنید.</p>:null}
                    </section>

                    <section className="fst-product-section" aria-label="قیمت و موجودی"><div className="fst-product-section-title"><span className="fst-product-step">۳</span><div><h3>قیمت و موجودی</h3><p>{selectedType==="SINGLE"?"قیمت، حجم و تعداد موجود را وارد کنید.":"برای هر حجم قیمت و موجودی جداگانه تعیین کنید."}</p></div></div>
                    <ProductVariantsList
                        form={form}
                        productType={selectedType}
                        isUploading={isUploading}
                        setImageUploading={setImageUploading}
                        uploadProductImage={uploadProductImage}
                        validateBeforeUpload={validateBeforeUpload}
                    /></section>

                    <div className="fst-product-actions">
                        <Button onClick={onClose} disabled={mediaUploads>0}>انصراف</Button>

                        <Button
                            type="primary"
                            loading={submitting}
                            disabled={mediaUploads>0}
                            onClick={handleSubmit}
                        >
                            ثبت محصول
                        </Button>
                    </div>
                </Form>
        </Drawer>
    );
}
