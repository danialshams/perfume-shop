"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {RefreshCw,Plus,Search,ArrowLeft,X,Check,AlertCircle} from "lucide-react";
export type Resource="customers"|"coupons"|"reviews"|"payments"|"brands";
type RecordRow={id:number;status?:string;[key:string]:unknown};
const CONFIG:Record<Resource,{title:string;description:string;overline:string;columns:Array<[string,string]>;statuses:string[];create?:boolean}>={
 customers:{title:"مشتریان",description:"حساب‌های کاربری، اطلاعات تماس و وضعیت دسترسی. رمز عبور هرگز نمایش داده نمی‌شود.",overline:"CUSTOMERS",
  columns:[["full_name","نام مشتری"],["phone","شماره همراه"],["email","ایمیل"],["created_at","تاریخ عضویت"]],statuses:["ACTIVE","BLOCKED"]},
 coupons:{title:"کدهای تخفیف",description:"تعریف تخفیف درصدی یا ثابت، فعال‌سازی و غیرفعال‌سازی کدها.",overline:"COUPONS",
  columns:[["code","کد"],["discount_type","نوع"],["discount_value","مقدار"],["used_count","دفعات استفاده"]],statuses:["ACTIVE","INACTIVE"],create:true},
 reviews:{title:"دیدگاه‌ها",description:"بازبینی و تأیید دیدگاه کاربران با حفظ متن اصلی.",overline:"REVIEWS",
  columns:[["product_name","محصول"],["customer_name","مشتری"],["rating","امتیاز"],["comment","متن دیدگاه"]],statuses:["PENDING","APPROVED","REJECTED"]},
 payments:{title:"تراکنش‌ها",description:"گزارش پرداخت‌های ثبت‌شده. تغییر موفقیت پرداخت فقط از مسیر تأیید درگاه امکان‌پذیر است.",overline:"PAYMENTS",
  columns:[["order_number","سفارش"],["customer_name","مشتری"],["provider","درگاه"],["amount","مبلغ"]],statuses:[]},
 brands:{title:"برندها",description:"افزودن برند و تعیین نمایش یا عدم نمایش آن در کاتالوگ.",overline:"BRANDS",
  columns:[["name","نام برند"],["slug","شناسه"],["country","کشور"]],statuses:["ACTIVE","INACTIVE"],create:true}
};
const labels:Record<string,string>={ACTIVE:"فعال",INACTIVE:"غیرفعال",BLOCKED:"مسدود",PENDING:"در انتظار",APPROVED:"تأییدشده",REJECTED:"ردشده",
 SUCCESS:"موفق",FAILED:"ناموفق",CANCELLED:"لغوشده",REFUNDED:"برگشتی",PERCENT:"درصدی",FIXED:"مبلغ ثابت"};
function format(value:unknown,k:string){if(value==null||value==="")return "—";
 if(k==="created_at")return new Date(String(value)).toLocaleDateString("fa-IR");
 if(k==="amount"||k==="discount_value")return Number(value).toLocaleString("fa-IR");
 return labels[String(value)]||String(value)}
export default function RecordsManager({resource}:{resource:Resource}){
 const config=CONFIG[resource],url="/api/v1/admin/records/"+resource;
 const [rows,setRows]=useState<RecordRow[]>([]),[page,setPage]=useState(1),[hasNext,setHasNext]=useState(false);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const [filter,setFilter]=useState(""),[confirm,setConfirm]=useState<{id:number;status:string}|null>(null);
 const [saving,setSaving]=useState(false),[creating,setCreating]=useState(false);
 const [form,setForm]=useState({code:"",title:"",discount_type:"PERCENT",discount_value:"",name:"",slug:""});
 const load=useCallback(async(nextPage=1)=>{
  setLoading(true);setError("");
  try{const r=await fetch(url+"?page="+nextPage+"&limit=30",{cache:"no-store"});
   const data=await r.json().catch(()=>null);
   if(!r.ok)throw Error(data?.error||"دریافت اطلاعات از دیتابیس ممکن نیست.");
   setRows(prev=>nextPage===1?data.items:[...prev,...data.items]);
   setHasNext(!!data.hasNext);setPage(nextPage);
  }catch(e){setError(e instanceof Error?e.message:"دریافت اطلاعات ممکن نشد")}finally{setLoading(false)}
 },[url]);
 useEffect(()=>{setRows([]);void load(1)},[load]);
 const filtered=useMemo(()=>rows.filter(x=>Object.values(x).some(v=>String(v??"").toLowerCase().includes(filter.toLowerCase().trim()))),[rows,filter]);
 async function changeStatus(){
  if(!confirm)return;
  setSaving(true);setError("");
  try{const r=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(confirm)});
   const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.error||"تغییر وضعیت انجام نشد");
   setRows(prev=>prev.map(x=>x.id===confirm.id?{...x,status:confirm.status}:x));
   setSuccess("وضعیت ذخیره شد.");setConfirm(null);
  }catch(e){setError(e instanceof Error?e.message:"خطای ذخیره")}finally{setSaving(false)}
 }
 async function create(event:FormEvent){
  event.preventDefault();setSaving(true);setError("");setSuccess("");
  try{
   const data=resource==="coupons"?{code:form.code,title:form.title,discount_type:form.discount_type,discount_value:Number(form.discount_value)}:{name:form.name,slug:form.slug};
   const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const result=await r.json().catch(()=>null);if(!r.ok)throw Error(result?.error||"ثبت اطلاعات ممکن نشد");
   setCreating(false);setSuccess("رکورد در دیتابیس ثبت شد.");await load(1);
  }catch(e){setError(e instanceof Error?e.message:"خطای ثبت")}finally{setSaving(false)}
 }
 return <div>
  <div className="fst-page-heading"><div><small>{config.overline} / FERTINI STUDIO</small><h1>{config.title}</h1><p>{config.description}</p></div>
   <div className="flex flex-wrap gap-2">{config.create&&<button className="fst-btn fst-btn-primary" type="button" onClick={()=>setCreating(true)}>مورد جدید <Plus size={16}/></button>}
    <button className="fst-btn" type="button" onClick={()=>void load(1)} disabled={loading}>بازخوانی <RefreshCw size={16}/></button></div></div>
  {error&&<div className="fst-error" role="alert">{error}</div>}
  {success&&<div className="fst-notice mb-3" role="status">{success}</div>}
  <section className="fst-card">
   <label className="fst-field max-w-[390px] mb-5"><span>جستجو در فهرست بارگذاری‌شده</span>
    <span className="flex gap-3 items-center"><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={"جستجو در "+config.title}/></span></label>
   <div className="grid gap-3">
    {filtered.map(row=><article key={row.id} className="rounded-lg border border-[#e8e2d8] bg-[#fffcf8] px-4 py-4">
     <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
      <span className="text-xs font-semibold">شناسه #{Number(row.id).toLocaleString("fa-IR")}</span>
      <span className="text-xs text-neutral-500">{labels[row.status||""]||row.status||"—"}</span>
     </div>
     <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {config.columns.map(([k,title])=><div key={k} className="grid gap-1 min-w-0"><dt className="text-[11px] text-neutral-500">{title}</dt>
       <dd className="text-xs break-words" dir={k==="email"||k==="code"?"ltr":undefined}>{format(row[k],k)}</dd></div>)}
     </dl>
     <div className="border-t border-[#eee8e0] flex justify-end items-center gap-3 flex-wrap mt-4 pt-3">
      {resource==="payments"&&row.order_id?<Link href={"/admin/orders?openOrder="+row.order_id} className="fst-btn">جزئیات سفارش <ArrowLeft size={14}/></Link>:null}
      {config.statuses.length>0?<label className="flex gap-2 items-center text-xs">تغییر وضعیت
       <select className="min-h-10 border border-[#ddd4c7] rounded-md px-3 bg-white" value={row.status||""} onChange={e=>setConfirm({id:Number(row.id),status:e.target.value})}>
        {config.statuses.map(s=><option key={s} value={s}>{labels[s]||s}</option>)}</select></label>:null}
     </div>
    </article>)}
   </div>
   {!loading&&filtered.length===0?<p className="fst-empty">موردی پیدا نشد.</p>:null}
   {loading?<p className="fst-empty">در حال دریافت اطلاعات…</p>:null}
   {hasNext&&<button disabled={loading} className="fst-btn w-full mt-5" onClick={()=>void load(page+1)}>نمایش موارد بیشتر</button>}
  </section>
  {resource==="payments"&&<p className="fst-notice mt-4"><AlertCircle size={17} className="inline ml-2"/>تراکنش‌های قدیمی sandbox ممکن است موفق گزارش شده باشند اما فروش واقعی نیستند. وضعیت پرداخت از این صفحه قابل تغییر نیست.</p>}
  {confirm&&<div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
   <button className="absolute inset-0 bg-black/40" type="button" aria-label="بستن تأییدیه" onClick={()=>setConfirm(null)}/>
   <div className="fst-card relative z-10 w-full max-w-md shadow-2xl"><h2 className="text-base font-semibold">تأیید تغییر وضعیت</h2>
    <p className="text-xs leading-8 mt-2">وضعیت رکورد {confirm.id} به «{labels[confirm.status]||confirm.status}» تغییر کند؟</p>
    <div className="flex gap-3 mt-6"><button className="fst-btn flex-1" onClick={()=>setConfirm(null)} disabled={saving}>انصراف <X size={15}/></button>
     <button className="fst-btn fst-btn-primary flex-1" onClick={()=>void changeStatus()} disabled={saving}>تأیید <Check size={15}/></button></div></div>
  </div>}
  {creating&&<div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
   <button className="absolute inset-0 bg-black/40" type="button" aria-label="بستن ساخت رکورد" onClick={()=>setCreating(false)}/>
   <form onSubmit={e=>void create(e)} className="fst-card relative z-10 w-full max-w-md grid gap-3 max-h-[85dvh] overflow-y-auto shadow-2xl">
    <div className="flex justify-between items-center"><h2 className="font-semibold text-base">{resource==="coupons"?"کد تخفیف جدید":"برند جدید"}</h2>
     <button type="button" aria-label="بستن" onClick={()=>setCreating(false)}><X size={18}/></button></div>
    {resource==="coupons"?<>
     <label className="fst-field">کد تخفیف (حروف انگلیسی)<input dir="ltr" required pattern="[A-Za-z0-9_-]{3,40}" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label>
     <label className="fst-field">عنوان<input value={form.title} maxLength={150} onChange={e=>setForm({...form,title:e.target.value})}/></label>
     <label className="fst-field">نوع<select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})}>
      <option value="PERCENT">درصدی</option><option value="FIXED">مبلغ ثابت</option></select></label>
     <label className="fst-field">مقدار تخفیف<input required min={0.01} max={form.discount_type==="PERCENT"?100:undefined} step="any" type="number" value={form.discount_value} onChange={e=>setForm({...form,discount_value:e.target.value})}/></label>
    </>:<>
     <label className="fst-field">نام برند<input required minLength={2} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
     <label className="fst-field">شناسه انگلیسی برند<input required dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label>
    </>}
    <p className="text-xs text-neutral-500 leading-7">مورد جدید برای جلوگیری از انتشار ناخواسته، ابتدا غیرفعال ثبت می‌شود.</p>
    <button className="fst-btn fst-btn-primary" disabled={saving} type="submit">{saving?"در حال ثبت…":"ثبت"} <Check size={16}/></button>
   </form>
  </div>}
 </div>;
}
