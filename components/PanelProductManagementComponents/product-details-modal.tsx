"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {Headphones,Package,ExternalLink} from "lucide-react";
import type {ProductItem,Category} from "@/lib/product";
import {formatPrice,getTotalStock,getMainImage} from "@/lib/product";
import {formatNumber} from "../panel-sections/persian-number";
import AdminModal from "../panel-sections/admin-modal";
import {getProductById} from "./product-api";

type Props={
 open:boolean;product:ProductItem|null;categories?:Category[]|unknown;
 onClose:()=>void;
};

export default function ProductDetailsModal({open,product,onClose}:Props){
 const [details,setDetails]=useState<ProductItem|null>(product);
 const [error,setError]=useState("");
 useEffect(()=>{
  if(!open||!product){setDetails(null);return}
  let cancelled=false;
  setError("");
  setDetails(product);
  void getProductById(product.id).then(item=>{if(!cancelled)setDetails(item)})
    .catch(()=>{if(!cancelled)setError("نمایش اطلاعات به‌روز ممکن نشد؛ داده‌های فهرست نمایش داده می‌شوند.")});
  return()=>{cancelled=true};
 },[open,product]);
 const p=details||product;
 const variants=p?.variants||[];
 const photos=p?.images||[];
 const primary=photos.find(img=>Boolean(img.is_main))?.image_url||getMainImage(p as ProductItem)||"";
 const scent=typeof p?.scent_family==="string"?p.scent_family:
  p?.scent_family&&typeof p.scent_family==="object"?p.scent_family.name||"":
  p?.scent_family_name||"";
 const visible=Boolean(p?.is_active)&&p?.status==="ACTIVE"&&!p?.deleted_at;
 const priceLabel=variants.length
  ?formatPrice(Math.min(...variants.map(v=>Number(v.discount_price??v.price??0)).filter(n=>n>0))||0)
  :p?.price!=null?formatPrice(p.price):"ثبت نشده";
 return <AdminModal open={open} onCancel={onClose} title={p?.name||"جزئیات عطر"} width={790}>
  {p?<div className="fst-detail" dir="rtl">
   {error&&<p className="fst-product-hint" role="status">{error}</p>}
   <div className="fst-detail-top">
    <div className="fst-detail-cover">
     {primary?<Image src={primary} alt={p.name} fill unoptimized sizes="(max-width:700px) 100vw, 240px"/>:
       <span>تصویری ثبت نشده است</span>}
    </div>
    <div className="fst-detail-summary">
     <span className="fst-detail-label">{visible?"در فروشگاه":"در حال حاضر در فروشگاه نمایش داده نمی‌شود"}</span>
     <h3>{p.name}</h3>
     <div className="fst-detail-stat"><span>قیمت از</span><strong>{priceLabel}</strong></div>
     <div className="fst-detail-stat"><span>موجودی کل</span><strong>{formatNumber(getTotalStock(p))}</strong></div>
     {scent&&<div className="fst-detail-stat"><span>گروه بویایی</span><strong>{scent}</strong></div>}
     {p.category_name&&<div className="fst-detail-stat"><span>دسته</span><strong>{p.category_name}</strong></div>}
     {visible&&<Link href={"/products/"+p.id} target="_blank" className="fst-btn fst-detail-link">
      <ExternalLink size={15}/> نمایش در فروشگاه
     </Link>}
    </div>
   </div>
   {p.description&&<section className="fst-detail-section"><h4>توضیحات عطر</h4>
    <p className="fst-detail-description">{p.description}</p></section>}
   {photos.length>1&&<section className="fst-detail-section">
    <h4>گالری عکس</h4><div className="fst-detail-gallery">
     {photos.map((img,i)=><div key={img.id??i} className="fst-detail-thumb"><Image
      src={img.image_url} alt={p.name+" "+(i+1)} fill unoptimized sizes="100px"/></div>)}
    </div></section>}
   <section className="fst-detail-section">
    <h4><Package size={16}/> قیمت و موجودی هر حجم</h4>
    <div className="fst-detail-variants">{variants.length?variants.map((v,i)=><div key={v.id??i}>
     <span>{v.volume_ml?formatNumber(v.volume_ml)+" میلی‌لیتر":"حجم "+(i+1)}</span>
     <strong>{formatPrice(v.discount_price??v.price)}</strong>
     <small>موجودی: {formatNumber(v.stock_qty??v.stock??0)}</small>
    </div>):<p>هنوز حجم و قیمتی ثبت نشده است.</p>}</div>
   </section>
   {p.voice_file&&<section className="fst-detail-section">
    <h4><Headphones size={16}/> معرفی صوتی</h4>
    <audio controls preload="none" src={p.voice_file} className="w-full">مرورگر از پخش صدا پشتیبانی نمی‌کند.</audio>
   </section>}
  </div>:<p className="fst-empty">محصولی انتخاب نشده است.</p>}
 </AdminModal>;
}
