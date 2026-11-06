import {validateMediaMeta,type Kind} from "./admin-media-validation";
export type AdminUpload={url:string;file_name?:string;size?:number;mime_type?:string};
const json=async(res:Response)=>{const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||data.message||"آپلود ناموفق بود");return data};
async function localUpload(file:File,kind:Kind):Promise<AdminUpload>{
 const data=new FormData();data.append("file",file);
 const res=await fetch(kind==="image"?"/api/v1/uploads/products":"/api/v1/uploads/products/voice",
  {method:"POST",body:data,credentials:"same-origin"});
 const response=await json(res);
 return response.data as AdminUpload;
}
function sendToStorage(url:string,file:File,mime:string,progress?:(n:number)=>void):Promise<void>{
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhr.open("PUT",url,true);
  xhr.setRequestHeader("Content-Type",mime);
  xhr.upload.onprogress=e=>{if(e.lengthComputable&&e.total>0)progress?.(Math.round(e.loaded/e.total*90))};
  xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else reject(Error("فضای ذخیره‌سازی فایل را نپذیرفت ("+xhr.status+")"))};
  xhr.onerror=()=>reject(Error("ارسال مستقیم فایل ناموفق بود. تنظیمات CORS فضای ذخیره‌سازی را بررسی کنید."));
  xhr.ontimeout=()=>reject(Error("ارتباط آپلود قطع شد."));
  xhr.timeout=120000;
  xhr.send(file);
 });
}
export async function uploadAdminFile(file:File,kind:Kind,progress?:(n:number)=>void):Promise<AdminUpload>{
 const meta=validateMediaMeta(file,kind);
 if(!meta.ok)throw Error(meta.error);
 progress?.(0);
 const r=await fetch("/api/v1/admin/media-upload/start",{method:"POST",credentials:"same-origin",
  headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size})});
 // Local development retains its existing public/uploads workflow. Never bypass S3 on Vercel.
 if(r.status===503&&typeof location!=="undefined"&&["localhost","127.0.0.1"].includes(location.hostname)){
  const uploaded=await localUpload(file,kind);progress?.(100);return uploaded;
 }
 const start=await json(r) as {uploadUrl:string;session:string};
 await sendToStorage(start.uploadUrl,file,meta.mime,progress);
 progress?.(94);
 const complete=await fetch("/api/v1/admin/media-upload/complete",{method:"POST",credentials:"same-origin",
  headers:{"Content-Type":"application/json"},body:JSON.stringify({session:start.session})});
 const done=await json(complete) as AdminUpload;
 progress?.(100);
 return done;
}
