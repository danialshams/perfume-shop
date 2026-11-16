"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {App as AntdApp} from "antd";
import CreateProductDrawer from "@/components/PanelProductManagementComponents/create-product-drawer";
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
 const [createProductOpen,setCreateProductOpen]=useState(false);
 const [categoryOptions,setCategoryOptions]=useState<any[]>([]);
 const [productSearch,setProductSearch]=useState("");
 const [selectedCampaign,setSelectedCampaign]=useState<string|null>(null);
 async function load(){
  setBusy(true);setError("");
  try{const r=await fetch("/api/v1/admin/store-settings",{cache:"no-store",credentials:"same-origin"});const d=await r.json();
   if(!r.ok)throw Error(d.error||"دریافت اطلاعات ناموفق بود.");
   setItems(d.campaigns||[]);setProducts(d.products||[]);setSelectedCampaign(current=>(d.campaigns||[]).some((x:FertiniCampaign)=>x.id===current)?current:(d.campaigns||[])[0]?.id??null);setLoaded(true)
  }catch(e){setError(e instanceof Error?e.message:"خطای دریافت اطلاعات")}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);
 async function reloadProducts(){
  const res=await fetch("/api/v1/admin/store-settings",{cache:"no-store",credentials:"same-origin"});
  const data=await res.json().catch(()=>null);
  if(!res.ok)throw Error(data?.error||"محصولات دریافت نشدند");
  setProducts(data.products||[]);
 }
 async function openNewProduct(){
  try{
   const res=await fetch("/api/v1/categories",{cache:"no-store"});
   const data=await res.json().catch(()=>null);
   setCategoryOptions(Array.isArray(data)?data:Array.isArray(data?.data)?data.data:[]);
   setCreateProductOpen(true);
  }catch(e){setError(e instanceof Error?e.message:"دریافت دسته‌بندی ناموفق بود")}
 }
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
   <button type="button" className="fst-btn fst-btn-primary" onClick={()=>{const entry=initial();setItems(a=>[...a,entry]);setSelectedCampaign(entry.id)}} disabled={items.length>=12||!loaded}><Plus size={16}/> کمپین جدید</button></header>
  {error&&<p className="fst-error" role="alert">{error}</p>}{success&&<p className="fst-notice" role="status">{success}</p>}
  <div className="fst-notice mb-4">عطر کمپین را همین‌جا اضافه کن یا از محصولات موجود انتخاب کن. قیمت تخفیفی در خرید نهایی با قوانین کمپین محاسبه می‌شود.</div>
  <form className="fst-campaign-workbench" onSubmit={save}>
   <aside className="fst-campaign-index" aria-label="فهرست کمپین‌ها">
    <div className="fst-campaign-index__head"><h2>کمپین‌های فروشگاه</h2><span>{items.length.toLocaleString("fa-IR")} کمپین</span></div>
    <div className="fst-campaign-index__list">
     {items.map(item=><button type="button" key={item.id} className={"fst-campaign-index__item "+((selectedCampaign??items[0]?.id)===item.id?"is-active":"")}
       aria-pressed={(selectedCampaign??items[0]?.id)===item.id} onClick={()=>setSelectedCampaign(item.id)}>
       <span className="fst-campaign-index__photo">{item.banner?<img src={item.banner} alt=""/>:<span>F</span>}</span>
       <span className="fst-campaign-index__copy"><strong>{item.title}</strong><small>{item.discountPercent.toLocaleString("fa-IR")}٪ تخفیف · {item.productIds.length.toLocaleString("fa-IR")} محصول</small></span>
       <span className={"fst-campaign-index__state "+(item.enabled?"is-enabled":"")}>{item.enabled?"فعال":"غیرفعال"}</span>
     </button>)}
    </div>
   </aside>
   <div className="fst-campaign-editor">
    {items.map((item,index)=>(selectedCampaign??items[0]?.id)===item.id?<section className="fst-card" key={item.id}>
    <div className="fst-editor-heading"><div><span>CAMPAIGN / {String(index+1).padStart(2,"0")}</span><h2>{item.title}</h2></div>
    <div className="flex gap-2"><button type="button" aria-label="بالا" disabled={index===0} onClick={()=>setItems(old=>{const next=[...old];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}><ArrowUp size={17}/></button>
    <button type="button" aria-label="پایین" disabled={index===items.length-1} onClick={()=>setItems(old=>{const next=[...old];[next[index],next[index+1]]=[next[index+1],next[index]];return next})}><ArrowDown size={17}/></button>
    <button type="button" aria-label="حذف کمپین" onClick={()=>{setItems(a=>a.filter(x=>x.id!==item.id));setSelectedCampaign(null)}}><Trash2 size={17}/></button></div></div>
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
    <div className="fst-marketing-product-heading">
     <strong>عطرهای این کمپین ({item.productIds.length})</strong>
     <button type="button" className="fst-btn" onClick={()=>void openNewProduct()}><Plus size={15}/> ساخت محصول جدید</button>
    </div>
    <label className="fst-field mt-3"><span>جستجو در محصولات موجود (اختیاری)</span>
     <input value={productSearch} onChange={e=>setProductSearch(e.target.value)}
      placeholder="نام عطر را وارد کن"/>
    </label>
    <div className="fst-marketing-products">{products.filter(p=>p.name.toLowerCase().includes(productSearch.trim().toLowerCase())).map(p=><label key={p.id} className="fst-marketing-choice">
     <input type="checkbox" checked={item.productIds.includes(p.id)} disabled={!item.productIds.includes(p.id)&&item.productIds.length>=60}
      onChange={e=>edit(item.id,{productIds:e.target.checked?[...item.productIds,p.id]:item.productIds.filter(x=>x!==p.id)})}/>
     <img src={p.image} alt=""/><span>{p.name}</span></label>)}</div>
   </section>:null)}
   {!items.length&&<div className="fst-card"><p className="fst-empty">هنوز کمپینی ساخته نشده است. کمپین جدید بساز تا در صفحه اصلی نمایش داده شود.</p></div>}
   <div className="fst-save-bar"><span>کمپین‌ها در دیتابیس ذخیره می‌شوند.</span><button className="fst-btn fst-btn-primary" type="submit" disabled={busy||!!uploading||!loaded}><Save size={16}/>{busy?"در حال ذخیره…":"ذخیره کمپین‌ها"}</button></div>
   </div>
  </form>
  <AntdApp><CreateProductDrawer open={createProductOpen} categories={categoryOptions}
   onClose={()=>setCreateProductOpen(false)}
   onSuccess={()=>{void reloadProducts().catch(e=>setError(e instanceof Error?e.message:"دریافت محصولات جدید ناموفق بود"));}}/></AntdApp>
 </div>;
}
