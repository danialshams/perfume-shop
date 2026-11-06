"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {FERTINI_DEMOS} from "@/lib/fertini-demo";
import {DEFAULT_SITE_CONTENT,type FertiniSiteContent} from "@/lib/fertini-site-content";
import {Save,RefreshCw,ArrowUp,ArrowDown,Image as ImageIcon,Package} from "lucide-react";
type Keys="bestsellerIds"|"latestIds";
export default function AdminContentPage(){
 const [content,setContent]=useState<FertiniSiteContent>(DEFAULT_SITE_CONTENT);
 const [error,setError]=useState(""),[success,setSuccess]=useState(""),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false);
 async function load(){
  setBusy(true);setError("");setSuccess("");
  try{const r=await fetch("/api/v1/admin/content",{cache:"no-store"});
   const data=await r.json();if(!r.ok)throw Error(data.error||"خطای دریافت محتوا");
   setContent(data.content);setConnected(true);
  }catch(e){setConnected(false);setError(e instanceof Error?e.message:"اتصال برقرار نشد")}
  finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);
 const edit=(key:keyof FertiniSiteContent,value:unknown)=>setContent(prev=>({...prev,[key]:value}));
 function swap(key:Keys,index:number,delta:number){
  const arr=[...content[key]],other=index+delta;if(other<0||other>=arr.length)return;
  [arr[index],arr[other]]=[arr[other],arr[index]];edit(key,arr);
 }
 async function save(event:FormEvent){
  event.preventDefault();if(!connected)return;
  setBusy(true);setError("");setSuccess("");
  try{const r=await fetch("/api/v1/admin/content",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(content)});
   const v=await r.json();if(!r.ok)throw Error(v.error||"ذخیره ناموفق");
   setContent(v.content);setSuccess("محتوای صفحه اصلی در دیتابیس ذخیره شد.");
  }catch(e){setError(e instanceof Error?e.message:"خطای ذخیره")}
  finally{setBusy(false)}
 }
 const products=(key:Keys,title:string)=>(
  <section className="fst-card"><h2 className="mb-2 text-base font-medium">{title}</h2>
   <p className="text-xs text-neutral-500 leading-7 mb-4">ترتیب همین لیست در صفحه اصلی اعمال می‌شود.</p>
   {content[key].map((id,i)=><div className="fst-list-row" key={i}>
    <span className="text-xs w-6 text-neutral-400">{i+1}</span>
    <select aria-label={"محصول "+(i+1)} value={id} onChange={e=>{
     if(content[key].includes(e.target.value))return;
     const next=[...content[key]];next[i]=e.target.value;edit(key,next);
    }} className="flex-1 border border-[#ddd7cf] bg-white rounded-md px-2 py-2 text-xs">
     {FERTINI_DEMOS.map(p=><option value={p.id} key={p.id} disabled={content[key].includes(p.id)&&p.id!==id}>{p.name}</option>)}
    </select>
    <button type="button" disabled={i===0} aria-label="جابجایی به بالا" onClick={()=>swap(key,i,-1)}><ArrowUp size={17}/></button>
    <button type="button" disabled={i===5} aria-label="جابجایی به پایین" onClick={()=>swap(key,i,1)}><ArrowDown size={17}/></button>
   </div>)}
  </section>
 );
 return <div>
  <div className="fst-page-heading"><div><small>VISUAL EDITOR / HOME</small><h1>مدیریت صفحه اصلی</h1>
   <p>تصاویر هیرو، متن‌های بخش‌ها و ترتیب محصولات را با پیش‌نمایش چیدمان صفحه اصلی ویرایش کن.</p></div>
   <Link href="/" target="_blank" className="fst-btn">مشاهده سایت <ImageIcon size={16}/></Link></div>
  {error&&<div className="fst-error" role="alert">{error}</div>}
  {success&&<div className="fst-notice" role="status">{success}</div>}
  {!connected&&<p className="fst-notice mb-4">ویرایش در حالت مشاهده است. ذخیره تنها پس از اتصال دیتابیس و اجرای migration محتوای سایت فعال می‌شود.</p>}
  <form onSubmit={e=>void save(e)} className="grid gap-4">
   <section className="fst-card">
    <h2 className="font-semibold text-base mb-2">تصاویر هیرو</h2><p className="text-xs text-neutral-500 mb-5">اسلایدها به ترتیب انتخاب‌شده نمایش داده می‌شوند.</p>
    <div className="fst-tools-grid">{content.heroSlides.map((slide,i)=><div key={i} className="grid gap-3">
     <div className="overflow-hidden bg-[#e5e7e2] rounded-md aspect-[16/9]"><img src={slide.photo} alt={slide.alt} className="w-full h-full object-cover"/></div>
     <label className="fst-field">نشانی تصویر اسلاید {i+1}
      <input value={slide.photo} dir="ltr" onChange={e=>edit("heroSlides",content.heroSlides.map((s,j)=>j===i?{...s,photo:e.target.value}:s))} required/></label>
     <label className="fst-field">متن جایگزین تصویر
      <input value={slide.alt} onChange={e=>edit("heroSlides",content.heroSlides.map((s,j)=>j===i?{...s,alt:e.target.value}:s))} required/></label>
    </div>)}</div>
   </section>
   <div className="fst-tools-grid">
    <section className="fst-card grid gap-4">
     <label className="fst-field">تیتر بخش پرفروش‌ترین‌ها
      <input maxLength={70} value={content.bestsellerTitle} onChange={e=>edit("bestsellerTitle",e.target.value)}/></label>
     <label className="fst-field">توضیح بخش
      <textarea value={content.bestsellerDescription} maxLength={260} onChange={e=>edit("bestsellerDescription",e.target.value)}/></label>
    </section>
    <section className="fst-card grid gap-4">
     <label className="fst-field">تیتر بخش جدیدترین‌ها
      <input maxLength={70} value={content.latestTitle} onChange={e=>edit("latestTitle",e.target.value)}/></label>
     <label className="fst-field">توضیح بخش
      <textarea value={content.latestDescription} maxLength={260} onChange={e=>edit("latestDescription",e.target.value)}/></label>
    </section>
   </div>
   <div className="fst-tools-grid">{products("bestsellerIds","چیدمان پرفروش‌ترین‌ها")}{products("latestIds","چیدمان جدیدترین‌ها")}</div>
   <div className="fst-notice">فهرست این ویرایشگر شامل عطرهای نمایشی FERTINI است. مدیریت محصولات واقعی، قیمت‌ها، موجودی و وویس در <Link href="/admin/products" className="underline">بخش محصولات <Package size={13} className="inline"/></Link> انجام می‌شود؛ برای یکسان‌سازی کامل فروشگاه به اتصال دیتابیس واقعی نیاز است.</div>
   <div className="flex gap-3 justify-end"><button className="fst-btn" type="button" onClick={()=>void load()} disabled={busy}>بازخوانی <RefreshCw size={15}/></button>
    <button className="fst-btn fst-btn-primary" disabled={busy||!connected} type="submit">{busy?"در حال ذخیره…":"ذخیره تغییرات"} <Save size={16}/></button></div>
  </form>
 </div>;
}
