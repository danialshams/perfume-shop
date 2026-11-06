"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {FileAudio,Image as ImageIcon,Search,RefreshCw,ExternalLink} from "lucide-react";
import {getProducts} from "@/components/PanelProductManagementComponents/product-api";
import type {ProductItem} from "@/lib/product";
export default function AdminMediaPage(){
 const [items,setItems]=useState<ProductItem[]>([]),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  setLoading(true);setError("");
  try{const data=await getProducts({page:1,limit:100});
   setItems(Array.isArray(data.items)?data.items:[]);
  }catch{setError("دریافت محصولات از دیتابیس ممکن نیست. وضعیت اتصال را بررسی کنید.")}
  finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>items.filter(p=>p.name.toLowerCase().includes(query.toLowerCase().trim())),[items,query]);
 return <div>
  <div className="fst-page-heading"><div><small>MEDIA / FRAGRANCES</small><h1>تصاویر و وویس محصولات</h1>
   <p>برای هر عطر، عکس اصلی، تصاویر واریانت‌ها و فایل معرفی صوتی را در ویرایشگر محصول مدیریت کن.</p></div>
   <button className="fst-btn" onClick={()=>void load()} disabled={loading}>بازخوانی <RefreshCw size={15}/></button></div>
  {error&&<div className="fst-error" role="alert">{error} <Link href="/admin/database" className="underline">وضعیت دیتابیس</Link></div>}
  <div className="fst-card">
   <label className="fst-field max-w-sm"><span>جستجوی عطر</span><span className="flex items-center gap-2">
    <Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام عطر…"/></span></label>
   <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    {filtered.map(p=><article className="border border-[#e5e0d8] bg-[#fdfbf8] rounded-lg p-4 flex gap-4 items-center" key={p.id}>
     <div className="h-20 w-16 rounded-md shrink-0 overflow-hidden bg-[#eae6df]">
      {p.main_image||p.image?<img alt="" className="w-full h-full object-cover" src={String(p.main_image||p.image)}/>:<ImageIcon size={20}/>}</div>
     <div className="flex-1 min-w-0"><strong className="block text-xs truncate">{p.name}</strong>
      <small className="text-neutral-500 block mt-2">{p.voice_file?"وویس متصل است":"وویس ثبت نشده"}</small>
      <Link className="flex items-center gap-2 mt-3 text-xs underline underline-offset-4" href={"/admin/products?editProduct="+p.id}>
       ویرایش رسانه عطر <ExternalLink size={13}/></Link></div></article>)}
   </div>
   {!loading&&!filtered.length?<p className="fst-empty">محصولی پیدا نشد.</p>:null}
   {loading?<p className="fst-empty">در حال دریافت فهرست محصولات…</p>:null}
  </div>
  <div className="fst-notice mt-4 flex flex-wrap gap-2 items-center"><FileAudio size={18}/>
   حداکثر حجم وویس ۲۰ مگابایت و تصویر ۵ مگابایت است. سرور علاوه بر پسوند، امضای واقعی فایل را بررسی می‌کند. در Vercel، ذخیره‌سازی فایل به فضای S3-compatible دائمی نیاز دارد.</div>
 </div>;
}
