"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {Plus,Save,Trash2,ExternalLink} from "lucide-react";
import type {FertiniShippingMethod} from "@/lib/fertini-site-content";
export default function ShippingAdmin(){
 const [methods,setMethods]=useState<FertiniShippingMethod[]>([]),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>{fetch("/api/v1/admin/store-settings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setMethods(d.shipping||[]);setLoaded(true)}).catch(e=>setError(e.message))},[]);
 const edit=(id:string,patch:Partial<FertiniShippingMethod>)=>setMethods(a=>a.map(x=>x.id===id?{...x,...patch}:x));
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError("");setSuccess("");try{const r=await fetch("/api/v1/admin/store-settings",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"shipping",value:methods})});const d=await r.json();if(!r.ok||!d.saved)throw Error(d.error||"ذخیره ناموفق");setMethods(d.value);setSuccess("روش‌های ارسال ذخیره شدند و در صفحه راهنمای ارسال فروشگاه قابل مشاهده‌اند.")}catch(e){setError(e instanceof Error?e.message:"ذخیره انجام نشد")}finally{setBusy(false)}}
 return <div><header className="fst-page-heading"><div><small>FERTINI / DELIVERY</small><h1>مدیریت ارسال</h1><p>روش ارسال، هزینه، توضیح و زمان تقریبی تحویل را مشخص کن تا مشتری آن‌ها را در سایت ببیند.</p></div>
 <Link className="fst-btn" href="/shipping" target="_blank">صفحه ارسال مشتری <ExternalLink size={16}/></Link></header>
 {error&&<p role="alert" className="fst-error">{error}</p>}{success&&<p role="status" className="fst-notice">{success}</p>}
 <form className="grid gap-4" onSubmit={save}>
 {methods.map(m=><section key={m.id} className="fst-card fst-simple-form"><div className="fst-editor-heading"><h2>{m.name}</h2><button type="button" aria-label="حذف روش" onClick={()=>setMethods(a=>a.filter(x=>x.id!==m.id))}><Trash2 size={17}/></button></div>
  <div className="fst-marketing-fields">
   <label className="fst-field">نام روش ارسال<input required maxLength={100} value={m.name} onChange={e=>edit(m.id,{name:e.target.value})}/></label>
   <label className="fst-field">هزینه (تومان)<input required type="number" min="0" max="1000000000" value={m.cost} onChange={e=>edit(m.id,{cost:Number(e.target.value)})}/></label>
   <label className="fst-field">زمان تقریبی تحویل<input maxLength={100} value={m.estimatedDays} onChange={e=>edit(m.id,{estimatedDays:e.target.value})} placeholder="مثلا ۲ تا ۵ روز کاری"/></label>
   <label className="fst-visibility"><input type="checkbox" checked={m.enabled} onChange={e=>edit(m.id,{enabled:e.target.checked})}/> نمایش به مشتری</label>
  </div>
  <label className="fst-field">توضیح روش<textarea maxLength={300} value={m.description} onChange={e=>edit(m.id,{description:e.target.value})}/></label>
 </section>)}
 <div className="fst-card"><button type="button" className="fst-btn" disabled={methods.length>=12} onClick={()=>setMethods(a=>[...a,{id:"delivery-"+Date.now(),name:"روش ارسال جدید",description:"",estimatedDays:"",cost:0,enabled:false}])}><Plus size={16}/> روش ارسال جدید</button>
 <p className="fst-helper mt-3">این تنظیمات فعلا در صفحه راهنمای ارسال نمایش داده می‌شوند. هزینه واقعی در پرداخت نهایی پس از اتصال انتخاب روش ارسال به تسویه‌حساب اعمال خواهد شد.</p></div>
 <div className="fst-save-bar"><span>تغییرات در دیتابیس نگهداری می‌شوند.</span><button type="submit" disabled={busy||!loaded} className="fst-btn fst-btn-primary"><Save size={16}/>{busy?"در حال ذخیره…":"ذخیره روش‌ها"}</button></div>
 </form></div>;
}
