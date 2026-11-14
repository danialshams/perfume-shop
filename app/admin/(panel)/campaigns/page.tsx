"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {ArrowDown,ArrowUp,ImagePlus,Plus,Save,Trash2} from "lucide-react";
import {uploadAdminFile} from "@/lib/admin-upload-client";
import type {FertiniCampaign} from "@/lib/fertini-site-content";
import type {HomeProduct} from "@/lib/fertini-home-products";
const localDate=(value:string)=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const initial=():FertiniCampaign=>({id:"campaign-"+Date.now(),title:"کمپین جدید",description:"",banner:"/fertini/hero-01.svg",
 startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+7*86400000).toISOString(),
 discountPercent:10,enabled:false,productIds:[]});
export default function CampaignStudio(){
 const [items,setItems]=useState<FertiniCampaign[]>([]),[products,setProducts]=useState<HomeProduct[]>([]);
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[uploading,setUploading]=useState("");
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{const r=await fetch("/api/v1/admin/store-settings",{cache:"no-store",credentials:"same-origin"});const d=await r.json();
   if(!r.ok)throw Error(d.error||"دریافت اطلاعات ناموفق بود.");
   setItems(d.campaigns||[]);setProducts(d.products||[]);setLoaded(true)
  }catch(e){setError(e instanceof Error?e.message:"خطای دریافت اطلاعات")}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);
 const edit=(id:string,patch:Partial<FertiniCampaign>)=>setItems(a=>a.map(x=>x.id===id?{...x,...patch}:x));
 async function upload(id:string,file:File){
  setUploading(id);setError("");
  try{const v=await uploadAdminFile(file,"image");edit(id,{banner:v.url})}
  catch(e){setError(e instanceof Error?e.message:"آپلود تصویر ناموفق بود")}finally{setUploading("")}
 }
 async function save(event:FormEvent){
  event.preventDefault();setBusy(true);setError("");setSuccess("");
  try{
   const r=await fetch("/api/v1/admin/store-settings",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind:"campaigns",value:items})});
   const d=await r.json();if(!r.ok||!d.saved)throw Error(d.error||"ذخیره انجام نشد");
   setItems(d.value);setSuccess("کمپین‌ها ذخیره شدند. کمپین فعال در زمان تعیین‌شده در صفحه اصلی نمایش داده می‌شود.");
  }catch(e){setError(e instanceof Error?e.message:"ذخیره انجام نشد")}finally{setBusy(false)}
 }
 return <div className="fst-marketing">
  <header className="fst-page-heading"><div><small>FERTINI / CAMPAIGNS</small><h1>مدیریت کمپین‌ها</h1>
   <p>بنر، بازه زمانی، درصد تخفیف و عطرهای کمپین را تنظیم کن. نمایش کمپین فعال به زمان شروع و پایان آن وابسته است.</p></div>
   <button type="button" className="fst-btn fst-btn-primary" onClick={()=>setItems(a=>[...a,initial()])} disabled={items.length>=12||!loaded}><Plus size={16}/> کمپین جدید</button></header>
  {error&&<p className="fst-error" role="alert">{error}</p>}{success&&<p className="fst-notice" role="status">{success}</p>}
  <div className="fst-notice mb-4">برای ایجاد عطر مخصوص کمپین، ابتدا آن را در <Link href="/admin/products" className="underline">مدیریت محصولات</Link> ایجاد کن، سپس از فهرست پایین انتخابش کن. برای حفظ صحت پرداخت، تخفیف نهایی باید با قیمت گونه‌های محصول هماهنگ باشد.</div>
  <form className="grid gap-4" onSubmit={save}>
   {items.map((item,index)=><section className="fst-card" key={item.id}>
    <div className="fst-editor-heading"><div><span>CAMPAIGN / {String(index+1).padStart(2,"0")}</span><h2>{item.title}</h2></div>
    <div className="flex gap-2"><button type="button" aria-label="بالا" disabled={index===0} onClick={()=>setItems(old=>{const next=[...old];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}><ArrowUp size={17}/></button>
    <button type="button" aria-label="پایین" disabled={index===items.length-1} onClick={()=>setItems(old=>{const next=[...old];[next[index],next[index+1]]=[next[index+1],next[index]];return next})}><ArrowDown size={17}/></button>
    <button type="button" aria-label="حذف کمپین" onClick={()=>setItems(a=>a.filter(x=>x.id!==item.id))}><Trash2 size={17}/></button></div></div>
    <div className="fst-marketing-fields">
     <label className="fst-field">عنوان کمپین<input required value={item.title} maxLength={100} onChange={e=>edit(item.id,{title:e.target.value})}/></label>
     <label className="fst-field">درصد تخفیف<input required type="number" min="1" max="80" value={item.discountPercent} onChange={e=>edit(item.id,{discountPercent:Number(e.target.value)})}/></label>
     <label className="fst-field">شروع کمپین<input required type="datetime-local" value={localDate(item.startsAt)} onChange={e=>{if(e.target.value)edit(item.id,{startsAt:new Date(e.target.value).toISOString()})}}/></label>
     <label className="fst-field">پایان کمپین<input required type="datetime-local" value={localDate(item.endsAt)} onChange={e=>{if(e.target.value)edit(item.id,{endsAt:new Date(e.target.value).toISOString()})}}/></label>
    </div>
    <label className="fst-field mt-3">توضیحات<textarea value={item.description} maxLength={350} onChange={e=>edit(item.id,{description:e.target.value})}/></label>
    <label className="fst-visibility mt-3"><input type="checkbox" checked={item.enabled} onChange={e=>edit(item.id,{enabled:e.target.checked})}/> فعال‌سازی کمپین در بازه زمانی تعیین‌شده</label>
    <div className="fst-marketing-banner">{item.banner&&<img src={item.banner} alt={item.title}/>}</div>
    <label className="fst-btn w-fit cursor-pointer"><ImagePlus size={16}/>{uploading===item.id?"در حال آپلود…":"بارگذاری بنر کمپین"}
     <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={!!uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(item.id,file);e.target.value=""}}/></label>
    <div className="fst-marketing-product-heading"><strong>عطرهای این کمپین ({item.productIds.length})</strong><small>از محصولات فعال انتخاب کن؛ حداکثر ۶۰ عطر</small></div>
    <div className="fst-marketing-products">{products.map(p=><label key={p.id} className="fst-marketing-choice">
     <input type="checkbox" checked={item.productIds.includes(p.id)} disabled={!item.productIds.includes(p.id)&&item.productIds.length>=60}
      onChange={e=>edit(item.id,{productIds:e.target.checked?[...item.productIds,p.id]:item.productIds.filter(x=>x!==p.id)})}/>
     <img src={p.image} alt=""/><span>{p.name}</span></label>)}</div>
   </section>)}
   {!items.length&&<div className="fst-card"><p className="fst-empty">هنوز کمپینی ساخته نشده است. کمپین جدید بساز تا در صفحه اصلی نمایش داده شود.</p></div>}
   <div className="fst-save-bar"><span>کمپین‌ها در دیتابیس ذخیره می‌شوند.</span><button className="fst-btn fst-btn-primary" type="submit" disabled={busy||!!uploading||!loaded}><Save size={16}/>{busy?"در حال ذخیره…":"ذخیره کمپین‌ها"}</button></div>
  </form>
 </div>;
}
