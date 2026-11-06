"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {FERTINI_DEMOS} from "@/lib/fertini-demo";
import {DEFAULT_SITE_CONTENT,type FertiniSiteContent} from "@/lib/fertini-site-content";
import {Save,RefreshCw,ArrowUp,ArrowDown,Image as ImageIcon,Package,UploadCloud,Smartphone,Monitor} from "lucide-react";
import {uploadAdminFile} from "@/lib/admin-upload-client";
type Keys="bestsellerIds"|"latestIds";
export default function AdminContentPage(){
 const [content,setContent]=useState<FertiniSiteContent>(DEFAULT_SITE_CONTENT);
 const [viewport,setViewport]=useState<"desktop"|"mobile">("desktop");
 const [assets,setAssets]=useState<Array<{url:string;label:string}>>([
  ...DEFAULT_SITE_CONTENT.heroSlides.map((x,i)=>({url:x.photo,label:"هیرو "+(i+1)})),
  ...FERTINI_DEMOS.map(x=>({url:x.image,label:x.name}))
 ]);
 const [uploadingSlide,setUploadingSlide]=useState<number|null>(null);
 useEffect(()=>{
  fetch("/api/v1/admin/media-assets",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{
   if(Array.isArray(data?.items))setAssets(prev=>[...new Map([...prev,...data.items].map((a:{url:string;label:string})=>[a.url,a])).values()]);
  }).catch(()=>{});
 },[]);
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
 const go=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
 async function uploadHero(file:File,index:number){
  setUploadingSlide(index);setError("");
  try{const saved=await uploadAdminFile(file,"image");
   setAssets(prev=>[{url:saved.url,label:"تصویر آپلودشده"},...prev]);
   setContent(prev=>({...prev,heroSlides:prev.heroSlides.map((s,i)=>i===index?{...s,photo:saved.url}:s)}));
  }catch(e){setError(e instanceof Error?e.message:"آپلود تصویر ممکن نیست")}
  finally{setUploadingSlide(null)}
 }
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
  <section className="fst-card mb-4" aria-label="پیش‌نمایش بصری صفحه اصلی">
   <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
    <div><h2 className="text-base font-semibold">پیش‌نمایش چیدمان صفحه اصلی</h2>
     <p className="text-xs text-neutral-500 mt-1">بخش موردنظر را انتخاب کن تا به تنظیمات آن بروی.</p></div>
    <div className="flex gap-2">
     <button type="button" aria-pressed={viewport==="desktop"} onClick={()=>setViewport("desktop")} className={"fst-btn "+(viewport==="desktop"?"fst-btn-primary":"")}>دسکتاپ <Monitor size={15}/></button>
     <button type="button" aria-pressed={viewport==="mobile"} onClick={()=>setViewport("mobile")} className={"fst-btn "+(viewport==="mobile"?"fst-btn-primary":"")}>موبایل <Smartphone size={15}/></button>
    </div>
   </div>
   <div className="fst-preview-stage"><div className={"fst-preview-screen "+(viewport==="mobile"?"is-mobile":"")}>
    <div className="fst-preview-header"><span>☰</span><strong>FERTINI</strong><span>◦</span></div>
    <button className="fst-preview-hero" type="button" onClick={()=>go("fst-editor-hero")}>
     <img src={content.heroSlides[0].photo} alt="پیش‌نمایش هیرو"/><span>ویرایش هیرو +</span></button>
    {(["bestsellerIds","latestIds"] as const).map((key,i)=><button type="button" key={key} className="fst-preview-collection" onClick={()=>go(i===0?"fst-editor-best":"fst-editor-new")}>
     <small>0{i+1} / {i===0?"THE MOST LOVED":"JUST ARRIVED"}</small>
     <h3>{i===0?content.bestsellerTitle:content.latestTitle}</h3>
     <div className="fst-preview-products">{content[key].slice(0,viewport==="mobile"?2:4).map(id=>{
      const p=FERTINI_DEMOS.find(x=>x.id===id);return p?<img key={id} src={p.image} alt={p.name}/>:null;
     })}</div><span>ویرایش بخش +</span></button>)}
   </div></div>
  </section>
  <form onSubmit={e=>void save(e)} className="grid gap-4">
   <section id="fst-editor-hero" className="fst-card scroll-mt-24">
    <h2 className="font-semibold text-base mb-2">تصاویر هیرو</h2><p className="text-xs text-neutral-500 mb-5">اسلایدها به ترتیب انتخاب‌شده نمایش داده می‌شوند.</p>
    <div className="fst-tools-grid">{content.heroSlides.map((slide,i)=><div key={i} className="grid gap-3">
     <div className="overflow-hidden bg-[#e5e7e2] rounded-md aspect-[16/9]"><img src={slide.photo} alt={slide.alt} className="w-full h-full object-cover"/></div>
     <label className="fst-field">انتخاب تصویر اسلاید {i+1}
      <select value={slide.photo} onChange={e=>edit("heroSlides",content.heroSlides.map((s,j)=>j===i?{...s,photo:e.target.value}:s))}>
       {[...new Map([...assets,{url:slide.photo,label:"تصویر فعلی"}].map(x=>[x.url,x])).values()].map(x=><option value={x.url} key={x.url}>{x.label}</option>)}
      </select></label>
     <label className="fst-btn w-fit cursor-pointer">آپلود تصویر جدید <UploadCloud size={15}/>
      <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp" disabled={uploadingSlide!==null} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadHero(file,i);e.target.value="";}}/></label>
     {uploadingSlide===i?<small className="text-xs text-neutral-500">در حال آپلود…</small>:null}
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
   <div className="fst-tools-grid"><div id="fst-editor-best" className="scroll-mt-24">{products("bestsellerIds","چیدمان پرفروش‌ترین‌ها")}</div><div id="fst-editor-new" className="scroll-mt-24">{products("latestIds","چیدمان جدیدترین‌ها")}</div></div>
   <div className="fst-notice">فهرست این ویرایشگر شامل عطرهای نمایشی FERTINI است. مدیریت محصولات واقعی، قیمت‌ها، موجودی و وویس در <Link href="/admin/products" className="underline">بخش محصولات <Package size={13} className="inline"/></Link> انجام می‌شود؛ برای یکسان‌سازی کامل فروشگاه به اتصال دیتابیس واقعی نیاز است.</div>
   <div className="flex gap-3 justify-end"><button className="fst-btn" type="button" onClick={()=>void load()} disabled={busy}>بازخوانی <RefreshCw size={15}/></button>
    <button className="fst-btn fst-btn-primary" disabled={busy||!connected} type="submit">{busy?"در حال ذخیره…":"ذخیره تغییرات"} <Save size={16}/></button></div>
  </form>
 </div>;
}
