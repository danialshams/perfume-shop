"use client";

import {useEffect,useState} from "react";
import {App,Button,Drawer,Form,Radio} from "antd";
import {uploadProductImage} from "@/lib/api";
import {getScentFamilies,type ProductItem,type ScentFamily} from "@/lib/product";
import {toSlug} from "@/lib/utils";
import {validateMediaMeta} from "@/lib/admin-media-validation";
import {getProductById,updateProduct} from "./product-api";
import ProductBasicInfoFields from "./ProductBasicInfoFields";
import ProductImagesList from "./ProductImagesList";
import ProductVariantsList from "./ProductVariantsList";
import VoiceUploader from "./VoiceUploader";

type VariantForm={
  id?:number;volume_ml:number|null;price:number;discount_price:number|null;
  stock_qty:number;is_active:boolean;images:Array<{id?:number;image_url:string;is_main:boolean}>;
};
type CategoryForm={
 id:number;name:string;parent_ids?:number[];is_active?:boolean|number;
};
type ProductType="SINGLE"|"GROUPED";
type Props={open:boolean;productId:number|null;onClose:()=>void;onSuccess?:(product?:ProductItem)=>void};

function variantsFor(product:ProductItem,type:ProductType):VariantForm[]{
 const list=(product.variants||[]).map(variant=>({
   id:variant.id,
   volume_ml:variant.volume_ml==null?null:Number(variant.volume_ml),
   price:Number(variant.price??0),
   discount_price:variant.discount_price==null?null:Number(variant.discount_price),
   stock_qty:Number(variant.stock_qty??variant.stock??0),
   is_active:variant.is_active===undefined?true:Boolean(variant.is_active),
   images:type==="GROUPED"?(variant.images||[]).map(img=>({
     id:img.id,image_url:img.image_url,is_main:Boolean(img.is_main)
   })):[],
 }));
 return list.length?type==="SINGLE"?list.slice(0,1):list:[{
   volume_ml:100,price:0,discount_price:null,stock_qty:0,is_active:true,images:[],
 }];
}

export default function EditProductDrawer({open,productId,onClose,onSuccess}:Props){
 const {message}=App.useApp();
 const [form]=Form.useForm();
 const [product,setProduct]=useState<ProductItem|null>(null);
 const [categories,setCategories]=useState<CategoryForm[]>([]);
 const [families,setFamilies]=useState<ScentFamily[]>([]);
 const [type,setType]=useState<ProductType>("SINGLE");
 const [loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false);
 const [uploads,setUploads]=useState(0);
 const [imageUploads,setImageUploads]=useState<Record<string,boolean>>({});
 const uploading=(key:string)=>Boolean(imageUploads[key]);
 const setUploading=(key:string,value:boolean)=>{
   setImageUploads(old=>({...old,[key]:value}));
   setUploads(old=>Math.max(0,old+(value?1:-1)));
 };
 const markUpload=(active:boolean)=>setUploads(old=>Math.max(0,old+(active?1:-1)));
 const validateImage=(file:File)=>{
   const result=validateMediaMeta(file,"image");
   if(!result.ok)throw Error(result.error);
   return true;
 };
 const validateVoice=(file:File)=>{
   const result=validateMediaMeta(file,"voice");
   if(!result.ok)throw Error(result.error);
   return true;
 };
 useEffect(()=>{
   if(!open||!productId)return;
   let cancelled=false;
   setLoading(true);
   Promise.all([
     getProductById(productId),
     fetch("/api/v1/categories",{cache:"no-store",credentials:"same-origin"})
       .then(r=>r.ok?r.json():Promise.reject(Error("دریافت دسته‌ها ممکن نشد"))),
     getScentFamilies(),
   ]).then(([value,categoriesResult,groups])=>{
     if(cancelled)return;
     const item=value as ProductItem;
     setProduct(item);
     const links=item.category_links||[];
     const first=links[0];
     const parent=first?.parent_id??item.parent_category_id??undefined;
     const child=first?.child_id??item.category_id??undefined;
     const resolvedType:ProductType=item.type==="GROUPED"?"GROUPED":"SINGLE";
     setType(resolvedType);
     const cats=categoriesResult.data??categoriesResult;
     setCategories(Array.isArray(cats)?cats:[]);
     setFamilies(Array.isArray(groups)?groups:[]);
     form.setFieldsValue({
       name:item.name,
       description:item.description||"",
       parent_category_id:parent==null?undefined:Number(parent),
       category_id:child==null?undefined:Number(child),
       scent_family_mode:"EXISTING",
       scent_family_id:item.scent_family_id==null?undefined:Number(item.scent_family_id),
       type:resolvedType,
       voice_file:item.voice_file||"",
       images:(item.images||[]).map(img=>({id:img.id,image_url:img.image_url,is_main:Boolean(img.is_main)})),
       variants:variantsFor(item,resolvedType),
     });
   }).catch(e=>{
     if(!cancelled)message.error(e instanceof Error?e.message:"خواندن اطلاعات محصول انجام نشد");
   }).finally(()=>{if(!cancelled)setLoading(false)});
   return()=>{cancelled=true};
 },[open,productId,form,message]);

 function close(){
   if(uploads>0||saving)return;
   onClose();
   form.resetFields();
   setProduct(null);
   setType("SINGLE");
   setCategories([]);
   setFamilies([]);
   setImageUploads({});
 }
 function changeType(next:ProductType){
   if(next===type)return;
   setType(next);
   const current:VariantForm[]=form.getFieldValue("variants")||[];
   const first=current[0]||{volume_ml:100,price:0,stock_qty:0,discount_price:null,is_active:true,images:[]};
   form.setFieldsValue({type:next,variants:next==="SINGLE"?[{...first,images:[]}]:current.length?current:[first]});
 }
 async function save(){
   if(uploads>0){message.warning("ابتدا آپلود فایل را کامل کنید");return}
   if(!product||saving)return;
   let values:Record<string,any>;
   try{values=await form.validateFields()}catch{
     message.warning("لطفاً فیلدهای مشخص‌شده را تکمیل کنید");
     return;
   }
   const cats=values.parent_category_id&&values.category_id?[{
     parent_id:Number(values.parent_category_id),child_id:Number(values.category_id),
   }]:[];
   const imgs=(Array.isArray(values.images)?values.images:[]).filter((img:{image_url?:string})=>img?.image_url);
   const variants=(Array.isArray(values.variants)?values.variants:[])
     .slice(0,type==="SINGLE"?1:undefined)
     .map((variant:VariantForm)=>({
       ...variant,
       volume_ml:variant.volume_ml==null?null:Number(variant.volume_ml),
       price:Number(variant.price),
       discount_price:variant.discount_price==null?null:Number(variant.discount_price),
       stock_qty:Number(variant.stock_qty||0),
       is_active:variant.is_active!==false,
       images:type==="GROUPED"?(variant.images||[]).filter(img=>img.image_url):[],
     }));
   if(!variants.length){message.error("حداقل یک حجم و قیمت اضافه کنید");return}
   const mode=values.scent_family_mode||"EXISTING";
   const payload={
     name:String(values.name||"").trim(),
     slug:toSlug(String(values.name||"")),
     description:String(values.description||"").trim()||null,
     type,
     category_id:values.category_id??null,
     parent_category_id:values.parent_category_id??null,
     category_links:cats,
     scent_family_id:mode==="EXISTING"?Number(values.scent_family_id)||null:null,
     new_scent_family:mode==="NEW"&&values.new_scent_family?.name?
       {name:String(values.new_scent_family.name).trim(),image_url:""}:undefined,
     voice_file:typeof values.voice_file==="string"?values.voice_file.trim()||null:null,
     images:imgs,variants,
     // Legacy drafts become visible when the merchant saves an edit.
     // Existing inactive stock stays hidden unless deliberately re-enabled separately.
     status:"ACTIVE",
     is_active:Boolean(product.is_active),
   };
   setSaving(true);
   try{
     const updated=await updateProduct(product.id,payload);
     message.success("تغییرات عطر ذخیره شد");
     onSuccess?.(updated);
     onClose();
   }catch(e){message.error(e instanceof Error?e.message:"ویرایش عطر انجام نشد")}
   finally{setSaving(false)}
 }
 return <Drawer rootClassName="fst-product-drawer" title="ویرایش عطر"
   open={open} onClose={close} width="min(100vw, 790px)" placement="left"
   maskClosable={uploads===0&&!saving} destroyOnClose>
   {loading?<p className="fst-product-hint">در حال دریافت اطلاعات عطر…</p>:
   <Form form={form} layout="vertical" className="fst-product-form">
    <div className="fst-product-type-choice">
     <span>نوع عطر</span>
     <Radio.Group optionType="button" buttonStyle="solid" value={type}
       onChange={e=>changeType(e.target.value)}>
       <Radio.Button value="SINGLE">یک حجم</Radio.Button>
       <Radio.Button value="GROUPED">چند حجم</Radio.Button>
     </Radio.Group>
    </div>
    <ProductBasicInfoFields categories={categories} scentFamilies={families}/>
    <section className="fst-product-section">
     <div className="fst-product-section-title"><span className="fst-product-step">۲</span>
      <div><h3>عکس و معرفی صوتی</h3><p>عکس‌های محصول و وویس اختصاصی آن را مدیریت کنید.</p></div></div>
     <ProductImagesList form={form} validateBeforeUpload={validateImage} onUploadingChange={markUpload}/>
     <div className="fst-product-divider"/>
     <VoiceUploader form={form} validateBeforeUpload={validateVoice} onUploadingChange={markUpload}/>
    </section>
    <section className="fst-product-section">
     <div className="fst-product-section-title"><span className="fst-product-step">۳</span>
      <div><h3>قیمت و موجودی</h3><p>حجم، قیمت و موجودی هر مدل را ویرایش کنید.</p></div></div>
     <ProductVariantsList form={form} productType={type}
       isUploading={uploading} setImageUploading={setUploading}
       uploadProductImage={uploadProductImage} validateBeforeUpload={validateImage}/>
    </section>
    <div className="fst-product-actions">
     <Button onClick={close} disabled={saving||uploads>0}>انصراف</Button>
     <Button type="primary" loading={saving} disabled={loading||uploads>0} onClick={()=>void save()}>ذخیره تغییرات</Button>
    </div>
   </Form>}
 </Drawer>;
}
