"use client";
import {Button,Dropdown,Image,Modal} from "antd";
import type {ColumnsType} from "antd/es/table";
import {MoreVertical,Eye,Pencil,Trash2,RotateCcw} from "lucide-react";
import {formatPrice,getMainImage,getTotalStock,getVariantPriceInfo,type ProductItem} from "@/lib/product";
import {formatNumber} from "../panel-sections/persian-number";
type Props={
 onView:(product:ProductItem)=>void;onEdit?:(product:ProductItem)=>void;
 onImages?:(product:ProductItem)=>void;onVariants?:(product:ProductItem)=>void;
 onDelete?:(product:ProductItem)=>void;onRestore?:(product:ProductItem)=>void;
};
export function getProductColumns({onView,onEdit,onDelete,onRestore}:Props):ColumnsType<ProductItem>{
 return [
  {title:"عطر",key:"product",width:305,render:(_,record)=>{
    const photo=getMainImage(record);
    const visible=record.status==="ACTIVE"&&Boolean(record.is_active)&&!record.deleted_at;
    return <div className="fst-product-cell">
     <div className="fst-product-cell-image">
      {photo?<Image src={photo} alt={record.name} width={58} height={72} preview={false}/>:
       <span>بدون عکس</span>}
     </div>
     <div><strong>{record.name}</strong>{!visible&&<small>نمایش داده نمی‌شود</small>}</div>
    </div>;
  }},
  {title:"قیمت",key:"price",width:155,render:(_,record)=>{
    const prices=getVariantPriceInfo(record);
    return prices.minPrice?formatPrice(prices.minPrice):"—";
  }},
  {title:"موجودی",key:"stock",width:110,render:(_,record)=>{
    const total=getTotalStock(record);
    return <span className={total<=5?"fst-stock-low":"fst-stock-regular"}>
      {formatNumber(total)}{total<=5&&<small> موجودی کم</small>}</span>;
  }},
  {title:"عملیات",key:"actions",width:165,fixed:"left",render:(_,record)=>record.deleted_at?
   <Button size="small" icon={<RotateCcw size={15}/>} onClick={()=>onRestore?.(record)}>بازیابی</Button>:
   <div className="fst-product-table-actions">
    <Button onClick={()=>onEdit?.(record)} size="small">ویرایش</Button>
    <Dropdown trigger={["click"]} menu={{items:[
      {key:"view",label:"مشاهده اطلاعات",icon:<Eye size={15}/>,onClick:()=>onView(record)},
      {key:"delete",label:"حذف محصول",icon:<Trash2 size={15}/>,danger:true,onClick:()=>Modal.confirm({
       title:"حذف محصول",content:"آیا «"+record.name+"» حذف شود؟",
       okText:"حذف",cancelText:"انصراف",okButtonProps:{danger:true},
       onOk:()=>onDelete?.(record),
      })},
    ]}}><Button size="small" aria-label={"عملیات "+record.name} icon={<MoreVertical size={17}/>}/></Dropdown>
   </div>
  },
 ];
}
