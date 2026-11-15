"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {Search,Save,Globe2,ShieldCheck,FileText,ImagePlus,CheckCircle2,AlertCircle,RefreshCw,ExternalLink} from "lucide-react";
import {
  DEFAULT_SEO_CONFIG,seoAbsolute,seoPageConfig,seoTitle,
  type FertiniSeoConfig,type FertiniSeoPage,
} from "@/lib/fertini-seo";
import {uploadAdminFile} from "@/lib/admin-upload-client";

type Item={path:string;title:string;imageUrl:string};
type Tab="general"|"pages"|"advanced";
const sections:[Tab,string][]= [["general","تنظیمات اصلی"],["pages","صفحات و محصولات"],["advanced","تنظیمات پیشرفته"]];
function Field({label,value,onChange,placeholder="",hint="",max=550,multiline=false}:{
 label:string;value:string;onChange:(value:string)=>void;placeholder?:string;hint?:string;max?:number;multiline?:boolean;
}){
 return <label className="fst-seo-field"><span>{label}</span>
  {multiline?<textarea rows={3} maxLength={max} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:
  <input maxLength={max} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}
  <small>{hint}<em dir="ltr">{value.length} / {max}</em></small>
 </label>;
}
function Toggle({title,description,checked,onChange}:{
 title:string;description:string;checked:boolean;onChange:(value:boolean)=>void;
}){
 return <label className="fst-seo-switch"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>
  <span><strong>{title}</strong><small>{description}</small></span></label>;
}
export default function SeoStudio(){
 const [seo,setSeo]=useState<FertiniSeoConfig>(DEFAULT_SEO_CONFIG);
 const [items,setItems]=useState<Item[]>([]);
 const [snapshot,setSnapshot]=useState("");
 const [tab,setTab]=useState<Tab>("general");
 const [selected,setSelected]=useState("/");
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [uploading,setUploading]=useState(false);
 const changed=JSON.stringify(seo)!==snapshot;
 const activePage=seoPageConfig(seo,selected);
 const current=items.find(x=>x.path===selected);
 const siteTitle=seoTitle(seo,selected,current?.title||"FERTINI");
 const siteDescription=activePage.description||(selected==="/"?seo.homepageDescription:"");
 const image=activePage.imageUrl||current?.imageUrl||seo.defaultImage;
 const url=seoAbsolute(activePage.canonical||selected,seo);
 const warnings=[
   ...(siteTitle.length>65?["عنوان ممکن است در نتایج گوگل کوتاه شود."]:[]),
   ...(siteDescription.length<70?["توضیح صفحه کوتاه است؛ بهتر است مخصوص همان صفحه باشد."]:[]),
   ...(siteDescription.length>165?["توضیح طولانی است و ممکن است در نتایج بریده شود."]:[]),
   ...(!image?["تصویر اشتراک‌گذاری تعیین نشده است."]:[]),
   ...(!seo.indexSite?["نمایش سایت در نتایج جستجو غیرفعال است."]:[]),
   ...(activePage.noindex?["این صفحه عمداً از ایندکس خارج شده است."]:[]),
 ];
 const filtered=useMemo(()=>items.filter(item=>(item.title+" "+item.path).toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0,310),[items,search]);

 async function reload(){
   setLoading(true);setError("");setSuccess("");
   try{
     const response=await fetch("/api/v1/admin/seo",{credentials:"same-origin",cache:"no-store"});
     const data=await response.json().catch(()=>null);
     if(!response.ok||!data?.seo)throw Error(data?.error||"بارگذاری تنظیمات سئو انجام نشد.");
     setSeo({...DEFAULT_SEO_CONFIG,...data.seo,pages:data.seo.pages||{}});
     setSnapshot(JSON.stringify({...DEFAULT_SEO_CONFIG,...data.seo,pages:data.seo.pages||{}}));
     setItems(data.items||[]);
   }catch(e){setError(e instanceof Error?e.message:"خطا در دریافت تنظیمات");}
   finally{setLoading(false)}
 }
 useEffect(()=>{void reload()},[]);
 function update<K extends keyof FertiniSeoConfig>(key:K,value:FertiniSeoConfig[K]){
   setSeo(old=>({...old,[key]:value}));setSuccess("");
 }
 function updatePage<K extends keyof FertiniSeoPage>(key:K,value:FertiniSeoPage[K]){
   setSeo(old=>({...old,pages:{...old.pages,[selected]:{...seoPageConfig(old,selected),[key]:value}}}));
   setSuccess("");
 }
 async function upload(file:File,kind:"default"|"page"|"logo"){
  setUploading(true);setError("");
  try{
    const result=await uploadAdminFile(file,"image");
    if(kind==="default")update("defaultImage",result.url);
    else if(kind==="logo")update("companyLogo",result.url);
    else updatePage("imageUrl",result.url);
  }catch(e){setError(e instanceof Error?e.message:"آپلود تصویر انجام نشد")}
  finally{setUploading(false)}
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!changed)return;setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/v1/admin/seo",{method:"PUT",credentials:"same-origin",
      headers:{"Content-Type":"application/json"},body:JSON.stringify(seo)});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.saved){
     const issues=Array.isArray(data?.issues)?data.issues.map((x:{path:string;message:string})=>x.path+": "+x.message).slice(0,4).join("، "):"";
     throw Error(issues||data?.error||"ذخیره تنظیمات انجام نشد.");
   }
   setSeo(data.seo);setSnapshot(JSON.stringify(data.seo));
   setSuccess("تنظیمات SEO در PostgreSQL ذخیره شد و در متادیتای سایت اعمال می‌شود.");
  }catch(e){setError(e instanceof Error?e.message:"خطا در ذخیره")}
  finally{setBusy(false)}
 }
 const uploadField=(kind:"default"|"page"|"logo")=><label className="fst-seo-upload">
   <ImagePlus size={16}/>{uploading?"در حال آپلود…":"انتخاب تصویر از دستگاه"}
   <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
     onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,kind);e.target.value=""}}/>
 </label>;

 if(loading)return <div className="fst-card" role="status">در حال بارگذاری تنظیمات سئو…</div>;
 return <div className="fst-seo-studio" dir="rtl">
  <header className="fst-page-heading">
   <div><small>FERTINI / SEO</small><h1>مدیریت سئو</h1>
    <p>عنوان‌ها، توضیحات، نمایش در گوگل و تنظیمات فنی را از یکجا مدیریت کنید.</p></div>
   <Link className="fst-btn" href="/"><ExternalLink size={16}/> مشاهده فروشگاه</Link>
  </header>
  <div className="fst-seo-guide">
   <strong>از کجا شروع کنم؟</strong>
   <p>ابتدا عنوان و توضیحات اصلی را بنویسید، سپس برای محصولات مهم توضیح مخصوص ثبت کنید. تنظیمات تخصصی برای مواقع ضروری هستند.</p>
  </div>
  <nav className="fst-seo-tabs" aria-label="بخش‌های سئو">
   {sections.map(([id,label])=><button type="button" key={id}
    aria-pressed={tab===id} className={tab===id?"active":""} onClick={()=>setTab(id)}>
    {id==="general"?<Globe2 size={16}/>:id==="pages"?<FileText size={16}/>:<ShieldCheck size={16}/>}
    {label}</button>)}
  </nav>
  {error&&<p role="alert" className="fst-error">{error}</p>}
  {success&&<p role="status" className="fst-seo-success"><CheckCircle2 size={16}/>{success}</p>}
  <form onSubmit={save}>
  {tab==="general"&&<div className="fst-seo-columns">
   <section className="fst-seo-panel">
    <h2>هویت فروشگاه در گوگل</h2>
    <Field label="نام برند" value={seo.siteName} max={120} onChange={v=>update("siteName",v)} hint="نامی که مشتریان شما می‌شناسند."/>
    <Field label="عنوان صفحه اصلی" value={seo.homepageTitle} max={120} onChange={v=>update("homepageTitle",v)} hint="پیشنهاد: حدود ۵۰ تا ۶۰ نویسه."/>
    <Field label="توضیحات صفحه اصلی" value={seo.homepageDescription} max={550} multiline onChange={v=>update("homepageDescription",v)} hint="توضیح کوتاه و مشخص درباره عطرها و خدمات فرتینی."/>
    <Field label="دامنه اصلی" value={seo.siteUrl} max={2000} onChange={v=>update("siteUrl",v)} placeholder="https://fertiniperfume.com" hint="دامنه واقعی با HTTPS؛ در کانونیکال و نقشه سایت استفاده می‌شود."/>
    <Toggle title="اجازه نمایش سایت در گوگل" description="در حالت عادی برای فروشگاه فعال باشد؛ در دوره آماده‌سازی می‌توانید خاموش کنید."
      checked={seo.indexSite} onChange={v=>update("indexSite",v)}/>
   </section>
   <section className="fst-seo-panel">
    <h2><Search size={18}/> پیش‌نمایش نتیجه جستجو</h2>
    <div className="fst-seo-google">
     <div className="fst-seo-host"><span>F</span><div><b>{seo.siteName||"FERTINI"}</b><small dir="ltr">{seo.siteUrl.replace(/^https?:\/\//,"")}</small></div></div>
     <strong>{seo.homepageTitle||"عنوان سایت"}</strong>
     <p>{seo.homepageDescription||"توضیح کوتاه فروشگاه در این بخش ظاهر می‌شود."}</p>
    </div>
    <p className="fst-seo-note">این پیش‌نمایش تقریبی است و گوگل ممکن است عنوان و توضیح را بازنویسی کند.</p>
    <h3>تصویر پیش‌فرض شبکه‌های اجتماعی</h3>
    <Field label="آدرس تصویر اشتراک‌گذاری" value={seo.defaultImage} max={500} onChange={v=>update("defaultImage",v)}/>
    {uploadField("default")}
    <Field label="متن جایگزین تصویر" value={seo.defaultImageAlt} max={250} onChange={v=>update("defaultImageAlt",v)}/>
    {seo.defaultImage&&<div className="fst-seo-social">
     <img src={seo.defaultImage} alt={seo.defaultImageAlt||"پیش‌نمایش تصویر"}/>
     <div><b>{seo.homepageTitle}</b><p>{seo.homepageDescription}</p></div>
    </div>}
   </section>
  </div>}
  {tab==="pages"&&<div className="fst-seo-columns">
   <section className="fst-seo-panel">
    <h2>انتخاب صفحه یا محصول</h2>
    <p className="fst-seo-note">نیازی به وارد کردن آدرس دستی نیست. فقط محصول یا صفحه را پیدا و انتخاب کنید.</p>
    <input className="fst-seo-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی نام عطر یا صفحه…"/>
    <div className="fst-seo-list">
     {filtered.map(item=><button key={item.path} type="button" className={selected===item.path?"selected":""} aria-pressed={selected===item.path}
      onClick={()=>{setSelected(item.path);setError("")}}><span>{item.title}</span><small dir="ltr">{item.path}</small>
      {seo.pages[item.path]?.title&&<CheckCircle2 size={14}/>}</button>)}
     {!filtered.length&&<p>صفحه‌ای پیدا نشد.</p>}
    </div>
   </section>
   <section className="fst-seo-panel">
    <h2>تنظیمات: {current?.title||selected}</h2>
    <Field label="عنوان اختصاصی" value={activePage.title} max={135} onChange={v=>updatePage("title",v)} placeholder={current?.title||""} hint="اگر خالی بماند، نام اصلی صفحه استفاده می‌شود."/>
    <Field label="توضیحات اختصاصی" value={activePage.description} max={550} multiline onChange={v=>updatePage("description",v)} hint="برای هر محصول از متن تکراری استفاده نکنید."/>
    <details className="fst-seo-details">
      <summary>آدرس اصلی و تنظیمات ربات‌ها</summary>
      <Field label="Canonical (اختیاری)" value={activePage.canonical} max={2000} onChange={v=>updatePage("canonical",v)} placeholder={seo.siteUrl+selected} hint="معمولاً خالی بگذارید؛ برای رفع محتوای تکراری کاربرد دارد."/>
      <Toggle title="عدم نمایش این صفحه در گوگل (Noindex)" description="برای صفحه یا محصول خصوصی یا آزمایشی روشن کنید."
        checked={activePage.noindex} onChange={v=>updatePage("noindex",v)}/>
      <Toggle title="جلوگیری از کش موتور جستجو (Noarchive)" description="اختیاری؛ برای صفحه‌های معمولی خاموش بماند."
        checked={activePage.noarchive} onChange={v=>updatePage("noarchive",v)}/>
    </details>
    <Field label="تصویر Open Graph" value={activePage.imageUrl} max={500} onChange={v=>updatePage("imageUrl",v)} placeholder={current?.imageUrl||seo.defaultImage} hint="عکس نمایش‌داده‌شده هنگام اشتراک‌گذاری لینک."/>
    {uploadField("page")}
    <Field label="متن جایگزین تصویر (ALT)" value={activePage.imageAlt} max={250} onChange={v=>updatePage("imageAlt",v)}/>
    <h3>پیش‌نمایش گوگل</h3>
    <div className="fst-seo-google">
      <small dir="ltr">{url}</small>
      <strong>{siteTitle}</strong><p>{siteDescription||"برای این صفحه توضیح اختصاصی ثبت نشده است."}</p>
    </div>
    {image&&<div className="fst-seo-social"><img src={image} alt={activePage.imageAlt||"عکس اشتراک‌گذاری"}/><div><b>{siteTitle}</b><p>{siteDescription}</p></div></div>}
    <div className="fst-seo-checks"><strong>بررسی سریع کیفیت صفحه</strong>
    {warnings.length?warnings.map((v,i)=><p key={i}><AlertCircle size={15}/>{v}</p>):
       <p><CheckCircle2 size={15}/> مورد مهمی در بررسی اولیه دیده نشد.</p>}</div>
   </section>
  </div>}
  {tab==="advanced"&&<div className="fst-seo-columns">
    <section className="fst-seo-panel">
     <h2>ایندکس و سرویس‌های گوگل</h2>
     <Toggle title="ساخت نقشه سایت (Sitemap)" description="فهرست صفحه‌های قابل نمایش برای موتورهای جستجو."
       checked={seo.sitemapEnabled} onChange={v=>update("sitemapEnabled",v)}/>
     <Toggle title="داده‌های ساختاریافته JSON-LD" description="معرفی برند و محصولات به موتورهای جستجو."
       checked={seo.structuredDataEnabled} onChange={v=>update("structuredDataEnabled",v)}/>
     <Field label="Google Search Console – کد تأیید" value={seo.googleVerification} max={300} onChange={v=>update("googleVerification",v)}
      hint="فقط مقدار content از متاتگ تأیید را وارد کنید، نه کل کد HTML."/>
     <Field label="Bing Webmaster – کد تأیید" value={seo.bingVerification} max={300} onChange={v=>update("bingVerification",v)}
      hint="فقط کد تأیید سرویس Bing."/>
     <Field label="زبان سایت" value={seo.language} max={12} onChange={v=>update("language",v)} placeholder="fa-IR"/>
     <Field label="جداکننده عنوان‌ها" value={seo.titleSeparator} max={12} onChange={v=>update("titleSeparator",v)} placeholder=" | "/>
     <div className="fst-seo-links">
       <Link href="/robots.txt" target="_blank">مشاهده robots.txt <ExternalLink size={14}/></Link>
       <Link href="/sitemap.xml" target="_blank">مشاهده sitemap.xml <ExternalLink size={14}/></Link>
     </div>
    </section>
    <section className="fst-seo-panel">
     <h2>برند و شبکه‌های اجتماعی</h2>
     <Field label="نام سازمان / برند در Schema" value={seo.companyName} max={150} onChange={v=>update("companyName",v)}/>
     <Field label="آدرس لوگو" value={seo.companyLogo} max={500} onChange={v=>update("companyLogo",v)} hint="تصویر واقعی لوگوی برند."/>
     {uploadField("logo")}
     <Field label="شناسه حساب X / Twitter" value={seo.twitterHandle} max={100} onChange={v=>update("twitterHandle",v)} placeholder="@Fertini"/>
     <Field label="لینک شبکه‌های اجتماعی (هر لینک در یک خط)" value={seo.socialProfiles.join("\n")} max={24000} multiline
       onChange={v=>update("socialProfiles",v.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,12))}
       hint="این لینک‌ها در داده ساختاریافته سازمان استفاده می‌شوند."/>
     <p className="fst-seo-note">تغییرات سایت روی متادیتا، Open Graph، robots.txt و sitemap.xml اعمال می‌شود. نمایش قطعی در گوگل به خزیدن و ایندکس شدن سایت وابسته است.</p>
    </section>
  </div>}
  <footer className="fst-seo-savebar">
   <span>{changed?"تغییرات ذخیره نشده‌اند":"همه تغییرات ذخیره شده‌اند"}</span>
   <div><button className="fst-btn" type="button" disabled={busy} onClick={()=>{if(!changed||window.confirm("تغییرات ذخیره‌نشده حذف شوند؟"))void reload()}}><RefreshCw size={15}/> بازخوانی</button>
   <button className="fst-btn fst-btn-primary" type="submit" disabled={busy||!changed}><Save size={16}/> {busy?"در حال ذخیره…":"ذخیره تنظیمات"}</button></div>
  </footer>
  </form>
 </div>;
}
