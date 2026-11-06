"use client";
import {Minus,Plus,ShoppingBag} from "lucide-react";
import {formatPrice,getVariantLabel,type ProductVariant} from "@/lib/product";
type P={productName?:string;variants:ProductVariant[];selectedVariant:ProductVariant|null;onSelectVariant:(v:ProductVariant)=>void;quantity:number;onIncreaseQty:()=>void;onDecreaseQty:()=>void;onAddToCart:()=>void|Promise<unknown>;isAddingToCart?:boolean;cartError?:string|null;currentPrice:number;currentStock:number;currentLabel:string;inStock:boolean;formatVariantLabel:(v:string)=>string};
export default function CinematicPurchasePanel(p:P){
 return <section className="ql-purchase" aria-label="خرید عطر">
  {p.productName&&<h2 className="ql-purchase-mobile-title">{p.productName}</h2>}
  <div className="ql-purchase-caption"><span>{p.inStock?"آماده سفارش":"ناموجود"}</span><span dir="ltr">MAISON / SELECT</span></div>
  {p.variants.length>0?<div className="ql-purchase-variants"><p>انتخاب حجم</p><div className="ql-variant-buttons">{p.variants.map(v=><button key={v.id} type="button" aria-pressed={p.selectedVariant?.id===v.id} className={p.selectedVariant?.id===v.id?"active":""} disabled={p.isAddingToCart||v.is_active===false||Number(v.stock_qty??0)<=0} onClick={()=>p.onSelectVariant(v)}>{p.formatVariantLabel(getVariantLabel(v))}</button>)}</div></div>:p.currentLabel?<p className="ql-single-variant">مدل: {p.currentLabel}</p>:null}
  <div className="ql-purchase-main"><div><small>مبلغ نهایی</small><strong>{formatPrice(Number(p.currentPrice||0)*p.quantity)}</strong></div><div className="ql-quantity"><button type="button" aria-label="کاهش تعداد" disabled={p.quantity<=1||p.isAddingToCart} onClick={p.onDecreaseQty}><Minus size={15}/></button><span>{p.quantity.toLocaleString("fa-IR")}</span><button type="button" aria-label="افزایش تعداد" disabled={!p.inStock||p.quantity>=p.currentStock||p.isAddingToCart} onClick={p.onIncreaseQty}><Plus size={15}/></button></div></div>
  <button type="button" className="ql-purchase-cta" disabled={!p.selectedVariant||!p.inStock||p.isAddingToCart} onClick={()=>{try{Promise.resolve(p.onAddToCart()).catch(()=>{});}catch{}}}><ShoppingBag size={17}/>{p.isAddingToCart?"در حال افزودن...":p.inStock?"افزودن به سبد خرید":"ناموجود"}</button>
  {p.cartError&&<p role="alert" className="ql-purchase-error">{p.cartError}</p>}
 </section>;
}
