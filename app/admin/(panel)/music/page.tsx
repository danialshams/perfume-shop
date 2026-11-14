"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Music2,Save,UploadCloud} from "lucide-react";
import {uploadAdminFile} from "@/lib/admin-upload-client";
type Music={enabled:boolean;audioUrl:string};
export default function MusicAdmin(){
 const [music,setMusic]=useState<Music>({enabled:true,audioUrl:"/audio/luxury-piano.mp3"});
 const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>{fetch("/api/v1/admin/store-settings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setMusic(d.music)}).catch(e=>setError(e.message))},[]);
 async function upload(file:File){setUploading(true);setError("");try{const result=await uploadAdminFile(file,"voice");setMusic(s=>({...s,audioUrl:result.url}));setSuccess("فایل آپلود شد؛ برای اعمال در سایت تنظیمات را ذخیره کن.")}catch(e){setError(e instanceof Error?e.message:"آپلود ناموفق بود")}finally{setUploading(false)}}
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError("");setSuccess("");try{const r=await fetch("/api/v1/admin/store-settings",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"music",value:music})});const d=await r.json();if(!r.ok||!d.saved)throw Error(d.error||"ذخیره ناموفق");setMusic(d.value);setSuccess("موسیقی صفحه اصلی ذخیره و فعال شد.")}catch(e){setError(e instanceof Error?e.message:"ذخیره انجام نشد")}finally{setBusy(false)}}
 return <div><header className="fst-page-heading"><div><small>FERTINI / SOUND</small><h1>موسیقی فروشگاه</h1><p>فایل پس‌زمینه را انتخاب کن و پخش را فعال یا غیرفعال کن. آغاز پخش همیشه تابع مجوز مرورگر و انتخاب کاربر است.</p></div></header>
 {error&&<p role="alert" className="fst-error">{error}</p>}{success&&<p role="status" className="fst-notice">{success}</p>}
 <form className="fst-card fst-simple-form" onSubmit={save}>
  <div className="fst-editor-heading"><h2><Music2 size={20}/> فایل صوتی پس‌زمینه</h2></div>
  <label className="fst-visibility"><input type="checkbox" checked={music.enabled} onChange={e=>setMusic(s=>({...s,enabled:e.target.checked}))}/> امکان پخش موسیقی در فروشگاه</label>
  <label className="fst-field">آدرس فایل فعلی<input dir="ltr" value={music.audioUrl} readOnly/></label>
  <audio className="w-full" controls preload="none" src={music.audioUrl}>مرورگر پخش صدا را پشتیبانی نمی‌کند.</audio>
  <label className="fst-btn cursor-pointer w-fit"><UploadCloud size={17}/>{uploading?"در حال آپلود…":"آپلود موسیقی جدید"}
   <input type="file" className="sr-only" accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" disabled={busy||uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value=""}}/></label>
  <p className="fst-helper">حداکثر حجم فایل ۲۰ مگابایت است؛ برای سرعت بهتر MP3 فشرده انتخاب کن. فایل جدید در فضای دائمی رسانه نگهداری می‌شود.</p>
  <button type="submit" className="fst-btn fst-btn-primary w-fit" disabled={busy||uploading}><Save size={16}/>{busy?"در حال ذخیره…":"ذخیره موسیقی"}</button>
 </form></div>;
}
