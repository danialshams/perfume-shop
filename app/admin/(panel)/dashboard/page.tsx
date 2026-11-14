"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Package,ShoppingBag,Shapes,Users,ArrowUpLeft,PanelsTopLeft,Search,RefreshCw,ArrowLeft} from "lucide-react";

type Recent={id:number;order_number:string|null;customer_name:string|null;total_amount:number;created_at:string};
type Overview={products:number|null;orders:number|null;categories:number|null;customers:number|null;partial:boolean;recent:Recent[]};
const metrics=[
 {key:"products",label:"محصولات",icon:Package},
 {key:"orders",label:"سفارش‌ها",icon:ShoppingBag},
 {key:"categories",label:"دسته‌بندی‌ها",icon:Shapes},
 {key:"customers",label:"مشتریان",icon:Users},
] as const;
const tasks=[
 {href:"/admin/products",title:"مدیریت عطرها",detail:"افزودن عطر، قیمت، عکس و موجودی",icon:Package},
 {href:"/admin/content",title:"چیدمان صفحه اصلی",detail:"هیرو، پرفروش‌ها و کارت‌های رایحه",icon:PanelsTopLeft},
 {href:"/admin/seo",title:"تنظیمات سئو",detail:"پیش‌نمایش گوگل و تنظیمات صفحات",icon:Search},
] as const;

export default function AdminDashboardPage(){
 const [data,setData]=useState<Overview|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 function reload(){
  setLoading(true);setError("");
  fetch("/api/v1/admin/overview",{cache:"no-store",credentials:"same-origin"})
   .then(async response=>{const value=await response.json().catch(()=>null);
     if(!response.ok||!value)throw Error(value?.error||"دریافت آمار ممکن نشد.");return value as Overview;})
   .then(setData).catch(e=>{setData(null);setError(e instanceof Error?e.message:"خطای دریافت آمار")})
   .finally(()=>setLoading(false));
 }
 useEffect(()=>{reload()},[]);
 return <div className="fst-dashboard">
  <header className="fst-page-heading">
   <div><small>FERTINI / OVERVIEW</small><h1>نمای کلی فروشگاه</h1>
    <p>آمار فروشگاه و کارهای روزانه در یک نگاه.</p></div>
   <button type="button" className="fst-dashboard-refresh" onClick={reload} disabled={loading} aria-label="به‌روزرسانی آمار" title="به‌روزرسانی آمار">
    <RefreshCw size={17}/></button>
  </header>
  {error&&<div className="fst-error" role="alert">{error}</div>}
  {data?.partial&&<p role="status" className="fst-notice">بعضی آمارها موقتاً در دسترس نیستند.</p>}
  <section className="fst-dashboard-metrics" aria-label="آمار اصلی">
   {metrics.map(item=><div className="fst-dashboard-metric" key={item.key}>
    <div><small>{item.label}</small><item.icon size={19}/></div>
    <strong>{loading?"…":data?.[item.key]==null?"—":Number(data[item.key]).toLocaleString("fa-IR")}</strong>
   </div>)}
  </section>
  <h2 className="fst-dashboard-title">مدیریت سریع</h2>
  <section className="fst-dashboard-tasks" aria-label="دسترسی به بخش‌های اصلی">
   {tasks.map(item=><Link key={item.href} href={item.href} className="fst-dashboard-task">
    <item.icon size={21}/><div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowUpLeft size={16}/></Link>)}
  </section>
  <section className="fst-dashboard-orders">
   <div className="fst-dashboard-orders-heading"><h2>آخرین سفارش‌ها</h2><Link href="/admin/orders">مدیریت سفارش‌ها <ArrowLeft size={15}/></Link></div>
   {data?.recent?.length?data.recent.slice(0,5).map(order=><Link href={"/admin/orders?openOrder="+order.id} key={order.id} className="fst-list-row">
    <span><b>{order.customer_name||"مشتری"}</b><small className="block">سفارش #{order.order_number||order.id}</small></span>
    <strong>{Number(order.total_amount||0).toLocaleString("fa-IR")} تومان</strong>
   </Link>):<p className="fst-empty">{loading?"در حال دریافت سفارش‌ها…":error?"دریافت سفارش‌ها ممکن نشد.":"هنوز سفارشی ثبت نشده است."}</p>}
  </section>
 </div>;
}
