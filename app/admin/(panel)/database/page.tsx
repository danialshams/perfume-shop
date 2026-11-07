"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {RefreshCw,Database,AlertTriangle,CheckCircle2} from "lucide-react";
type Health={connected:boolean;configured:boolean;missingEnv?:string[];tableCount?:number;mediaStorageConfigured?:boolean;unauthorized?:boolean;missingTables?:string[];missingCheckoutOrderColumns?:string[];legacyTables?:string[];
 productStatusPresent?:boolean;stockColumns?:string[];duplicatedForeignKeys?:Array<{table:string;column:string;target:string;count:number}>;message:string};
export default function DatabaseHealthPage(){
 const [health,setHealth]=useState<Health|null>(null),[loading,setLoading]=useState(true);
 function load(){setLoading(true);fetch("/api/v1/admin/health",{cache:"no-store"})
  .then(async r=>{const data=await r.json().catch(()=>null);if(r.status===403)return {connected:false,configured:false,unauthorized:true,message:"در پیش‌نمایش بدون ورود، بررسی دیتابیس و اطلاعات سفارش‌ها قابل انجام نیست. برای بررسی واقعی باید با حساب مدیر وارد شوید."} as Health;if(!data)throw Error("Invalid health response");return data as Health;})
  .then(setHealth).catch(()=>setHealth({connected:false,configured:false,message:"بررسی اتصال ممکن نشد."}))
  .finally(()=>setLoading(false))}
 useEffect(()=>{load()},[]);
 const warnings=health?.connected?[
  ...(health.missingTables||[]).map(x=>"جدول ضروری موجود نیست: "+x),
  ...(health.missingCheckoutOrderColumns||[]).map(x=>"ستون موردنیاز ثبت سفارش در orders موجود نیست: "+x),
  ...(health.legacyTables||[]).map(x=>"جدول قدیمی نیازمند بررسی و بکاپ: "+x),
  ...(!health.productStatusPresent?["ستون products.status در دیتابیس وجود ندارد؛ ساختار PostgreSQL باید همگام شود."]:[]),
  ...(health.duplicatedForeignKeys||[]).map(x=>"کلید خارجی تکراری: "+x.table+"."+x.column)
 ]:[];
 return <div>
  <div className="fst-page-heading"><div><small>INFRASTRUCTURE / READ ONLY</small><h1>سلامت دیتابیس</h1>
   <p>بررسی امن و فقط‌خواندنی اتصال PostgreSQL و جدول‌ها؛ بدون حذف یا اصلاح خودکار داده‌ها.</p></div>
   <button className="fst-btn" type="button" disabled={loading} onClick={load}>بررسی مجدد <RefreshCw size={16}/></button></div>
  <div className="fst-card max-w-3xl">
   <div className="flex items-center gap-3 mb-3">{health?.connected?<CheckCircle2 color="#4d8062"/>:<AlertTriangle color="#b07946"/>}
    <h2 className="text-lg font-semibold">{loading?"در حال بررسی…":health?.connected?"اتصال برقرار است":"اتصال برقرار نیست"}</h2></div>
   <p className="text-sm leading-8 text-neutral-600">{health?.message||"…"}</p>
   {health?.missingEnv?.length?<p className="fst-error" dir="ltr">Missing: {health.missingEnv.join(", ")}</p>:null}
   {health?.mediaStorageConfigured!==undefined?<div className="fst-list-row"><span>فضای ذخیره‌سازی دائمی عکس و وویس</span><strong>{health.mediaStorageConfigured?"تنظیم شده":"تنظیم نشده (S3)"}</strong></div>:null}
   {health?.connected?<div className="fst-list-row"><span>تعداد جدول‌ها</span><strong>{health.tableCount?.toLocaleString("fa-IR")}</strong></div>:null}
   {health?.connected?<div className="fst-list-row"><span>ستون‌های موجودی واریانت</span><span>{health.stockColumns?.join(" / ")||"—"}</span></div>:null}
  </div>
  {warnings.length>0?<section className="fst-card mt-4 max-w-3xl"><h2 className="mb-3 font-semibold">موارد نیازمند بررسی</h2>
   {warnings.map((x,i)=><p key={i} className="fst-list-row">{x}</p>)}</section>:null}
  <p className="fst-notice mt-5 max-w-3xl">ساختار قبلی دارای داده‌های تاریخی و سفارش‌های آزمایشی است. پاک‌سازی امن باید پس از تهیه بکاپ کامل SQL و رسانه‌ها، بررسی وابستگی‌های API و تست migration روی نسخه جداگانه انجام شود. برای اتصال Production نیز متغیرهای DATABASE_URL در محیط Vercel لازم‌اند.</p>
  <Link href="/admin/dashboard" className="fst-btn mt-5">بازگشت به داشبورد <Database size={15}/></Link>
 </div>;
}
