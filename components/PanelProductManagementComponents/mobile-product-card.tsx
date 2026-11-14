"use client";
import Image from "next/image";
import {Eye,PencilLine} from "lucide-react";
import AdminStatusBadge from "../panel-sections/admin-status-badge";
import {formatPrice,getMainImage,getTotalStock,getVariantPriceInfo,type ProductItem} from "@/lib/product";
import {formatNumber,boolify} from "../panel-sections/persian-number";

type Props={product:ProductItem;onView:()=>void;onEdit:()=>void};
export default function MobileProductCard({product,onView,onEdit}:Props){
 const image=getMainImage(product);
 const totalStock=getTotalStock(product);
 const {minPrice,maxPrice,hasRange}=getVariantPriceInfo(product);
 const status=product.status==="ACTIVE"&&boolify(product.is_active)?"active":"inactive";
 const label=status==="active"?"در فروشگاه":"نمایش داده نمی‌شود";
 return <article className="fst-mobile-product" aria-label={product.name}>
  <div className="fst-mobile-product-main">
   <div className="fst-mobile-product-photo">{image?
    <Image src={image} alt={product.name} fill unoptimized sizes="80px" className="object-cover"/>:
    <span>بدون عکس</span>}</div>
   <div className="fst-mobile-product-info">
    <h3>{product.name}</h3>
    <div className="fst-mobile-product-badges"><AdminStatusBadge type={status} label={label}/>
     {boolify(product.is_featured)&&<AdminStatusBadge type="featured" label="ویژه"/>}</div>
    <strong>{minPrice?(hasRange?formatPrice(minPrice)+" تا "+formatPrice(maxPrice):formatPrice(minPrice)):"قیمت ثبت نشده"}</strong>
    <small>موجودی: {formatNumber(totalStock)}</small>
   </div>
  </div>
  <div className="fst-mobile-product-actions">
   <button type="button" className="fst-btn fst-btn-primary" onClick={onEdit}><PencilLine size={15}/> ویرایش</button>
   <button type="button" className="fst-btn" onClick={onView}><Eye size={15}/> جزئیات</button>
  </div>
 </article>;
}
