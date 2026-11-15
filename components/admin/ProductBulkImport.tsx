"use client";
import {useEffect,useMemo,useState} from "react";
import {Download,FileSpreadsheet,UploadCloud,X} from "lucide-react";

type ImportRow={sku:string;name:string;group:string;type:"SINGLE"|"GROUPED";volume_ml:number;
 price:number;discount_price:number|null;stock_qty:number;images:string[];main_image?:string;
 description:string;is_best_seller:boolean};
type Preview={sku:string;name:string;models:number;existing:boolean};
type Result={created?:string[];updated?:string[];skipped?:string[];errors?:{line?:number;sku?:string;reason:string}[];
 products?:Preview[];total?:number;error?:string;issues?:string[];ok?:boolean};
const headings=["sku","name","group","type","volume_ml","price","discount_price","stock_qty","image_urls","main_image","description","is_best_seller"];
const digitMap="۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
const numberValue=(value:string)=>Number(value.replace(/[۰-۹٠-٩]/g,c=>String(digitMap.indexOf(c)%10)).replace(/[,٬\s]/g,""));
function parseCsv(csv:string):string[][]{
 const result:string[][]=[];let row:string[]=[],cell="",quoted=false;
 const src=csv.replace(/^\uFEFF/,"");
 for(let i=0;i<src.length;i++){
  const ch=src[i];
  if(quoted){
   if(ch==='"'&&src[i+1]==='"'){cell+='"';i++}
   else if(ch==='"')quoted=false;
   else cell+=ch;
  }else if(ch==='"'&&cell===""){quoted=true;}
   else if(ch===","){row.push(cell);cell="";}
   else if(ch==="\n"||ch==="\r"){
    if(ch==="\r"&&src[i+1]==="\n")i++;
    row.push(cell);if(row.some(x=>x.trim()))result.push(row);
    row=[];cell="";
   }else cell+=ch;
 }
 if(quoted)throw Error("یکی از فیلدهای نقل‌قول‌دار فایل بسته نشده است.");
 row.push(cell);if(row.some(x=>x.trim()))result.push(row);
 return result;
}
function parseRows(content:string){
 const rows=parseCsv(content);
 if(!rows.length)throw Error("فایل خالی است.");
 const headers=rows[0].map(x=>x.trim().toLowerCase());
 const missing=headings.filter(h=>!headers.includes(h));
 if(missing.length)throw Error("ستون‌های لازم وجود ندارند: "+missing.join("، "));
 if(rows.length>1001)throw Error("در هر فایل حداکثر ۱۰۰۰ ردیف محصول قرار بدهید.");
 const items:ImportRow[]=[],failures:string[]=[];
 for(let i=1;i<rows.length;i++){
  const row=Object.fromEntries(headers.map((header,index)=>[header,(rows[i][index]??"").trim()]));
  const num=(key:string)=>numberValue(row[key]||"");
  const type=(row.type||"SINGLE").toUpperCase();
  const images=(row.image_urls||"").split("|").map((v:string)=>v.trim()).filter(Boolean);
  if(!row.sku||!row.name||!row.group||!images.length||!["SINGLE","GROUPED"].includes(type)||
    !Number.isInteger(num("volume_ml"))||num("volume_ml")<=0||
    !Number.isFinite(num("price"))||num("price")<=0||
    !Number.isInteger(num("stock_qty"))||num("stock_qty")<0){
     failures.push("ردیف "+(i+1).toLocaleString("fa-IR")+": نام، شناسه، گروه، نوع، تصویر، حجم، قیمت یا موجودی معتبر نیست.");
     continue;
  }
  items.push({
   sku:row.sku.toLowerCase(),name:row.name,group:row.group,type:type as "SINGLE"|"GROUPED",
   volume_ml:num("volume_ml"),price:num("price"),
   discount_price:row.discount_price?num("discount_price"):null,
   stock_qty:num("stock_qty"),images,
   main_image:row.main_image||undefined,
   description:row.description||"",
   is_best_seller:["1","true","yes","بله"].includes((row.is_best_seller||"").toLowerCase())
  });
 }
 if(failures.length)throw Error(failures.slice(0,6).join("\n")+(failures.length>6?"\n…":""));
 return items;
}
const sampleRows=[
 ["fertini-roselia","روزلیا","وانیل و شکوفه","SINGLE","50","2980000","","0","/api/v1/editorial/product-01-rose-crystal.webp","","عطر نمایشی؛ موجودی صفر","0"],
 ["fertini-noir","نوآر","چوبی و سدر","GROUPED","50","3250000","","0","/api/v1/editorial/product-03-smoked-vetiver-cedar.webp","","چوبی","1"],
 ["fertini-noir","نوآر","چوبی و سدر","GROUPED","100","4850000","","0","/api/v1/editorial/product-03-smoked-vetiver-cedar.webp","","چوبی","1"]
];
function downloadCsv(){
 const escape=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
 const text="\uFEFF"+[headings,...sampleRows].map(row=>row.map(escape).join(",")).join("\r\n");
 const blob=new Blob([text],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),anchor=document.createElement("a");
 anchor.href=url;anchor.download="fertini-products-template.csv";anchor.click();
 URL.revokeObjectURL(url);
}
export default function ProductBulkImport({open,onClose,onImported}:{open:boolean;onClose:()=>void;onImported:()=>void}){
 const [fileName,setFileName]=useState(""),[rows,setRows]=useState<ImportRow[]>([]);
 const [preview,setPreview]=useState<Preview[]|null>(null),[error,setError]=useState("");
 const [busy,setBusy]=useState(false),[existing,setExisting]=useState<"skip"|"update">("skip");
 const [result,setResult]=useState<Result|null>(null);
 const groups=useMemo(()=>new Set(rows.map(x=>x.sku)).size,[rows]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!busy)onClose()};
  document.addEventListener("keydown",onKey);
  return()=>{document.body.style.overflow=old;document.removeEventListener("keydown",onKey)};
 },[open,onClose,busy]);
 if(!open)return null;
 const loadFile=async(file:File|null)=>{
  if(!file)return;setError("");setResult(null);setPreview(null);setRows([]);setFileName(file.name);
  if(!/\.csv$/i.test(file.name)){setError("فایل Excel را با گزینه CSV UTF-8 ذخیره و همین‌جا وارد کنید.");return;}
  if(file.size>2*1024*1024){setError("حجم فایل نباید بیشتر از ۲ مگابایت باشد.");return;}
  try{setRows(parseRows(await file.text()))}
  catch(e){setError(e instanceof Error?e.message:"قالب فایل نامعتبر است.");}
 };
 const request=async(action:"preview"|"import")=>{
  if(busy||!rows.length)return;setBusy(true);setError("");
  try{
   const response=await fetch("/api/v1/admin/product-bulk-import",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rows,action,existing,confirm:action==="import"})
   });
   const body:Result=await response.json().catch(()=>({error:"پاسخ نامعتبر سرور"}));
   if(!response.ok&&response.status!==207)throw Error(body.errors?.map(x=>x.reason).slice(0,7).join("\n")||body.error||body.issues?.join("، ")||"عملیات انجام نشد.");
   if(action==="preview"){setPreview(body.products||[]);setResult(null);}
   else{setResult(body);if(body.created?.length||body.updated?.length)onImported();}
  }catch(e){setError(e instanceof Error?e.message:"ارتباط با سرور برقرار نیست.");}
  finally{setBusy(false)}
 };
 const confirmed=preview!==null && !result;
 return <div className="fst-bulk-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}>
  <section className="fst-bulk-dialog" role="dialog" aria-modal="true" aria-labelledby="fst-bulk-title" dir="rtl">
   <header className="fst-bulk-head"><div><small>FERTINI / BULK CATALOG</small><h2 id="fst-bulk-title">ورود گروهی محصولات</h2>
     <p>اطلاعات را در Excel آماده کن، با فرمت CSV UTF-8 ذخیره کن و همه عطرها را یکجا ثبت کن.</p></div>
    <button type="button" aria-label="بستن" disabled={busy} onClick={onClose}><X size={20}/></button>
   </header>
   <div className="fst-bulk-body">
    <button className="fst-btn fst-bulk-template" type="button" onClick={downloadCsv}>
      <Download size={17}/> دریافت نمونه فایل محصولات
    </button>
    <p className="fst-helper">ستون‌ها: شناسه یکتا، نام عطر، گروه بویایی، نوع عطر (SINGLE/GROUPED)، حجم، قیمت، قیمت تخفیف، موجودی، آدرس عکس‌ها، عکس اصلی، توضیحات و پرفروش. برای چند حجم از شناسه یکسان و حجم متفاوت استفاده کن؛ چند عکس را با | جدا کن.</p>
    <label className="fst-bulk-drop">
      <UploadCloud size={25}/><strong>{fileName||"انتخاب فایل CSV از کامپیوتر"}</strong>
      <span>حداکثر ۱۰۰۰ ردیف؛ عکس‌ها باید قبلاً روی هاست آپلود شده باشند.</span>
      <input type="file" accept=".csv,text/csv" disabled={busy}
       onChange={e=>{void loadFile(e.target.files?.[0]||null);e.target.value=""}}/>
    </label>
    {rows.length>0&&<div className="fst-bulk-selected"><FileSpreadsheet size={18}/>
      {rows.length.toLocaleString("fa-IR")} ردیف، {groups.toLocaleString("fa-IR")} محصول
    </div>}
    {preview&&<div className="fst-bulk-preview"><strong>پیش‌نمایش ({preview.length.toLocaleString("fa-IR")} محصول)</strong>
      <div>{preview.slice(0,12).map(p=><div key={p.sku}><span>{p.name} · {p.models.toLocaleString("fa-IR")} مدل</span>
       <small>{p.existing?"قبلاً ثبت شده":"جدید"}</small></div>)}</div>
      {preview.length>12&&<small>و {preview.length-12} محصول دیگر</small>}
    </div>}
    {preview&&<label className="fst-field">محصولات دارای شناسه تکراری
     <select value={existing} onChange={e=>{setExisting(e.target.value as "skip"|"update");setPreview(null)}}>
      <option value="skip">دست‌نخورده باقی بمانند (ایمن‌تر)</option>
      <option value="update">با اطلاعات فایل به‌روزرسانی شوند</option>
     </select></label>}
    {error&&<div role="alert" className="fst-error" style={{whiteSpace:"pre-line"}}>{error}</div>}
    {result&&<div role="status" className={result.errors?.length?"fst-error":"fst-notice"}>
      {Number(result.created?.length||0).toLocaleString("fa-IR")} محصول جدید،
      {" "+Number(result.updated?.length||0).toLocaleString("fa-IR")} ویرایش‌شده،
      {" "+Number(result.skipped?.length||0).toLocaleString("fa-IR")} بدون تغییر.
      {result.errors?.length?<p>{result.errors.length.toLocaleString("fa-IR")} خطا رخ داد؛ شناسه‌های مشکل‌دار را بررسی و دوباره وارد کنید.</p>:null}
    </div>}
   </div>
   <footer className="fst-bulk-actions">
    <button className="fst-btn" onClick={onClose} disabled={busy}>بستن</button>
    {!confirmed?<button className="fst-btn fst-btn-primary" disabled={!rows.length||busy} onClick={()=>void request("preview")}>
      {busy?"در حال بررسی…":"بررسی فایل"}</button>:
     <button className="fst-btn fst-btn-primary" disabled={busy} onClick={()=>void request("import")}>
      {busy?"در حال ثبت…":"تأیید و ثبت در دیتابیس"}</button>}
   </footer>
  </section>
 </div>;
}
