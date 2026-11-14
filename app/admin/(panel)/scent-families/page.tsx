"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {ImagePlus,Plus,RefreshCw,Save,Trash2,X} from "lucide-react";
import {uploadAdminFile} from "@/lib/admin-upload-client";

type Family={id:number;name:string;image_url:string|null;is_active:boolean;sort_order:number;products_count:number};
type Values={name:string;image_url:string;sort_order:number;is_active:boolean};
const blank:Values={name:"",image_url:"",sort_order:0,is_active:true};
export default function ScentFamiliesPage(){
 const [items,setItems]=useState<Family[]>([]);
 const [active,setActive]=useState<number|null|undefined>(undefined);
 const [form,setForm]=useState<Values>(blank);
 const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const load=useCallback(async()=>{
  const res=await fetch("/api/v1/scent-families?manage=1",{cache:"no-store",credentials:"same-origin"});
  const json=await res.json().catch(()=>null);
  if(!res.ok||!Array.isArray(json?.data))throw Error(json?.message||"دریافت گروه‌های بویایی انجام نشد.");
  setItems(json.data);
 },[]);
 useEffect(()=>{void load().catch(e=>setError(e.message))},[load]);
 const select=(item:Family|null)=>{
  setActive(item?.id??null);setForm(item?{name:item.name,image_url:item.image_url||"",sort_order:item.sort_order,is_active:item.is_active}:blank);
  setError("");setSuccess("");
 };
 async function upload(file:File){
  setUploading(true);setError("");
  try{const result=await uploadAdminFile(file,"image");setForm(s=>({...s,image_url:result.url}))}
  catch(e){setError(e instanceof Error?e.message:"آپلود تصویر انجام نشد.")}
  finally{setUploading(false)}
 }
 async function save(e:FormEvent){
  e.preventDefault();if(busy||uploading)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const editing=typeof active==="number";
   const res=await fetch(editing?"/api/v1/scent-families/"+active:"/api/v1/scent-families",{
    method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({...form,sort_order:Number(form.sort_order)||0}),
   });
   const json=await res.json().catch(()=>null);
   if(!res.ok||json?.success===false)throw Error(json?.message||"ذخیره گروه بویایی ناموفق بود.");
   await load();setActive(undefined);setSuccess("گروه بویایی ذخیره شد و در صفحه اصلی قابل مشاهده است.");
  }catch(e){setError(e instanceof Error?e.message:"ذخیره انجام نشد")}
  finally{setBusy(false)}
 }
 async function remove(){
  if(typeof active!=="number"||busy||!window.confirm("گروه بویایی حذف شود؟ گروه دارای محصول قابل حذف نیست."))return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/v1/scent-families/"+active,{method:"DELETE",credentials:"same-origin"});
   const json=await res.json().catch(()=>null);if(!res.ok||json?.success===false)throw Error(json?.message||"حذف انجام نشد.");
   await load();setActive(undefined);setSuccess("گروه حذف شد.");
  }catch(e){setError(e instanceof Error?e.message:"حذف انجام نشد")}
  finally{setBusy(false)}
 }
 return <div className="fst-taxonomy-studio">
  <header className="fst-page-heading"><div><small>FERTINI / OLFACTIVE GROUPS</small><h1>گروه‌های بویایی</h1>
   <p>هر گروه عکس اختصاصی دارد و عطرها بر اساس گروه ثبت‌شده در محصول، خودکار در همان صفحه نمایش داده می‌شوند.</p></div>
   <button className="fst-btn fst-btn-primary" type="button" onClick={()=>select(null)}><Plus size={16}/> گروه جدید</button></header>
  {error&&<p className="fst-error" role="alert">{error}</p>}
  {success&&<p className="fst-notice" role="status">{success}</p>}
  <div className="fst-taxonomy-grid">
   <section className="fst-card">
    <div className="fst-editor-heading"><h2>گروه‌های ثبت‌شده ({items.length})</h2></div>
    <div className="fst-taxonomy-list">{items.map(item=><button type="button" key={item.id} className={"fst-taxonomy-item"+(active===item.id?" active":"")} onClick={()=>select(item)}>
     {item.image_url?<img src={item.image_url} alt="" loading="lazy"/>:<span className="fst-taxonomy-empty">بدون تصویر</span>}
     <span><strong>{item.name}</strong><small>{item.products_count} عطر · {item.is_active?"فعال":"غیرفعال"}</small></span>
    </button>)}
    {!items.length&&<p className="fst-helper">هنوز گروه بویایی ثبت نشده است.</p>}</div>
    <button type="button" className="fst-btn mt-3" onClick={()=>void load().catch(e=>setError(e.message))}><RefreshCw size={15}/> بازخوانی فهرست</button>
   </section>
   <section className="fst-card">
    {active===undefined?<div className="fst-empty">برای ویرایش یک گروه را انتخاب کن یا گروه جدید بساز.</div>:
    <form onSubmit={save} className="fst-taxonomy-form">
     <div className="fst-editor-heading"><h2>{active===null?"ایجاد گروه بویایی":"ویرایش گروه بویایی"}</h2><button type="button" aria-label="بستن فرم" onClick={()=>setActive(undefined)}><X size={18}/></button></div>
     <label className="fst-field">نام گروه بویایی<input value={form.name} required minLength={2} maxLength={120} onChange={e=>setForm(s=>({...s,name:e.target.value}))} placeholder="مثلا چوبی"/></label>
     <label className="fst-field">ترتیب نمایش<input type="number" min="0" max="9999" value={form.sort_order} onChange={e=>setForm(s=>({...s,sort_order:Number(e.target.value)||0}))}/></label>
     <label className="fst-visibility"><input type="checkbox" checked={form.is_active} onChange={e=>setForm(s=>({...s,is_active:e.target.checked}))}/> نمایش این گروه در فروشگاه</label>
     {form.image_url?<div className="fst-taxonomy-photo"><img src={form.image_url} alt="تصویر گروه بویایی" /></div>:<div className="fst-taxonomy-photo fst-taxonomy-placeholder">هنوز تصویر انتخاب نشده است.</div>}
     <label className="fst-btn cursor-pointer w-fit"><ImagePlus size={16}/>{uploading?"در حال آپلود…":"انتخاب و آپلود تصویر"}
      <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={uploading||busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=""}}/></label>
     <p className="fst-helper">تصویر در فضای ذخیره‌سازی دائمی هاست قرار می‌گیرد. حداکثر ۵ مگابایت؛ JPG، PNG یا WebP.</p>
     <div className="fst-taxonomy-actions"><button className="fst-btn fst-btn-primary" disabled={busy||uploading} type="submit"><Save size={16}/>{busy?"در حال ذخیره…":"ذخیره گروه"}</button>
      {typeof active==="number"&&<button className="fst-btn" disabled={busy} type="button" onClick={()=>void remove()}><Trash2 size={16}/> حذف گروه</button>}</div>
    </form>}
   </section>
  </div>
  <p className="fst-helper mt-4">برای اختصاص دادن عطر به گروه، در <Link className="underline" href="/admin/products">مدیریت محصولات</Link> گروه بویایی محصول را انتخاب کن. <Link className="underline" href="/admin/categories">دسته‌بندی‌های مردانه، زنانه و زیرمجموعه‌هایشان</Link> جداگانه مدیریت می‌شوند.</p>
 </div>;
}
