"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Package,ShoppingBag,Shapes,Users,ArrowUpLeft,PanelsTopLeft,
  ArrowLeft,RefreshCw,TicketPercent,MessageSquare} from "lucide-react";
type Recent={id:number;order_number:string|null;customer_name:string|null;total_amount:number;status:string;created_at:string};
type Overview={products:number|null;orders:number|null;categories:number|null;customers:number|null;notifications:number|null;partial:boolean;recent:Recent[]};
const cards=[
 {key:"products",label:"محصولات",icon:Package},
 {key:"orders",label:"سفارش‌ها",icon:ShoppingBag},
 {key:"categories",label:"دسته‌بندی‌ها",icon:Shapes},
 {key:"customers",label:"حساب‌های کاربری",icon:Users}
] as const;
const actions=[
 {href:"/admin/content",title:"ویرایش صفحه اصلی",detail:"اسلایدها، پرفروش‌ها، تازه‌ها و سه کارت رایحه",icon:PanelsTopLeft},
 {href:"/admin/products",title:"افزودن و مدیریت عطر",detail:"عکس، قیمت، موجودی و معرفی صوتی",icon:Package},
 {href:"/admin/orders",title:"مدیریت سفارش‌ها",detail:"مشتری، اقلام، پرداخت و وضعیت ارسال",icon:ShoppingBag},
 {href:"/admin/customers",title:"مشتریان",detail:"نمایش جزئیات و مدیریت وضعیت حساب",icon:Users},
 {href:"/admin/coupons",title:"کدهای تخفیف",detail:"ساخت، مشاهده و فعال‌سازی تخفیف‌ها",icon:TicketPercent},
 {href:"/admin/reviews",title:"مدیریت دیدگاه‌ها",detail:"بررسی و تأیید یا رد نظرات",icon:MessageSquare}
] as const;
export default function AdminDashboardPage(){
 const [data,setData]=useState<Overview|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 function reload(){
  setLoading(true);setError("");
  fetch("/api/v1/admin/overview",{cache:"no-store",credentials:"same-origin"})
   .then(async r=>{const payload=await r.json().catch(()=>null);if(!r.ok)throw Error(payload?.error||"ارتباط با سرور آمار برقرار نیست.");if(!payload)throw Error("پاسخ آمار فروشگاه معتبر نیست.");return payload as Overview})
   .then(setData).catch(e=>{setData(null);setError(e instanceof Error?e.message:"خطای اتصال")}).finally(()=>setLoading(false));
 }
 useEffect(()=>{reload()},[]);
 return <div>
  <div className="fst-page-heading"><div><small>FERTINI / STUDIO OVERVIEW</small><h1>نمای کلی فروشگاه</h1>
   <p>آمار واقعی و دسترسی سریع به مدیریت محتوا، محصولات و سفارش‌ها.</p></div>
   <button type="button" className="fst-btn" onClick={reload} disabled={loading}>بازخوانی آمار <RefreshCw size={16}/></button></div>
  {error&&<div className="fst-error" role="alert">{error}</div>}
  {data?.partial&&<p role="status" className="fst-notice mb-4">بخشی از آمار دیتابیس در دسترس نیست و با خط تیره مشخص شده است.</p>}
  <section className="fst-grid" aria-label="شاخص‌های فروشگاه">
   {cards.map(x=><div className="fst-card fst-metric" key={x.key}>
    <small>{x.label}</small><strong>{loading?"…":data&&data[x.key]!=null?Number(data[x.key]).toLocaleString("fa-IR"):"—"}</strong>
    <x.icon size={20} strokeWidth={1.5}/></div>)}</section>
  <section className="fst-actions" aria-label="بخش‌های مدیریت">
   {actions.map(a=><Link key={a.href} href={a.href} className="fst-card fst-action">
    <span className="flex items-center justify-between"><a.icon size={22} strokeWidth={1.5}/><ArrowUpLeft size={16}/></span>
    <span><strong className="block">{a.title}</strong><small className="block mt-2">{a.detail}</small></span></Link>)}</section>
  <section className="fst-data-grid">
   <div className="fst-card"><div className="flex items-center justify-between mb-4"><h2>آخرین سفارش‌ها</h2>
    <Link href="/admin/orders" className="text-xs flex gap-2 items-center">همه سفارش‌ها <ArrowLeft size={14}/></Link></div>
    {data?.recent?.length?data.recent.map(o=><Link href={"/admin/orders?openOrder="+o.id} className="fst-list-row" key={o.id}>
     <span><b>{o.customer_name||"مشتری"}</b><small className="block">#{o.order_number||o.id}</small></span>
     <span>{Number(o.total_amount||0).toLocaleString("fa-IR")} تومان</span></Link>):<p className="fst-empty">{loading?"در حال دریافت سفارش‌ها…":error?"دیتابیس متصل نیست.":"سفارشی ثبت نشده است."}</p>}
   </div>
   <div className="fst-card"><h2>راهنمای مدیریت</h2>
    <p className="text-xs leading-8 text-neutral-500">برای ثبت عکس‌ها و وویس هر عطر، از «افزودن محصول» استفاده کنید؛ بعداً هم می‌توانید همان فایل‌ها را در «ویرایش محصول» تغییر دهید. مدیریت وضعیت پرداخت و اقلام سفارش در صفحه سفارش‌ها انجام می‌شود.</p>
    <Link href="/admin/content" className="fst-btn mt-5">تنظیمات صفحه اصلی <ArrowLeft size={15}/></Link>
   </div>
  </section>
 </div>;
}
